import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import crypto from 'crypto'

const router = Router()
const prisma = new PrismaClient()
const jwtExpiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn']
const userSelect = { id: true, name: true, email: true, role: true, color: true, theme: true, board: true, createdAt: true }

function signAuthToken(user: { id: string; role: string }) {
  return jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: jwtExpiresIn })
}

function hashResetToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

async function sendResetEmail(email: string, resetUrl: string) {
  const from = process.env.PASSWORD_RESET_FROM || 'CRM torenaOne <no-reply@torenaone-office.ru>'
  const subject = 'Восстановление пароля CRM torenaOne'
  const text = [
    'Здравствуйте.',
    '',
    'Чтобы задать новый пароль в CRM torenaOne, откройте ссылку:',
    resetUrl,
    '',
    'Ссылка действует 30 минут. Если вы не запрашивали восстановление, просто проигнорируйте это письмо.',
  ].join('\n')

  if (process.env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: email, subject, text }),
    })
    if (!response.ok) throw new Error(`Email provider failed: ${response.status}`)
    return
  }

  console.warn(`Password reset email is not configured. Reset link for ${email}: ${resetUrl}`)
}

router.post('/register', authMiddleware, async (req: Request, res: Response) => {
  const { name, email, password, role = 'MANAGER', color = '#4f8ef7', theme = 'midnight', board = null } = req.body
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' })

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return res.status(409).json({ error: 'Email already exists' })

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, color, theme, board },
    select: userSelect,
  })
  const token = signAuthToken(user)
  res.status(201).json({ user, token })
})

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return res.status(401).json({ error: 'Invalid credentials' })

  const token = signAuthToken(user)
  const { passwordHash, ...safeUser } = user
  res.json({ user: safeUser, token })
})

router.post('/forgot-password', async (req: Request, res: Response) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  const generic = { ok: true, message: 'Если такой email есть в CRM, мы отправим ссылку для восстановления.' }
  if (!email) return res.json(generic)

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.json(generic)

  const rawToken = crypto.randomBytes(32).toString('hex')
  await prisma.passwordResetToken.create({
    data: {
      tokenHash: hashResetToken(rawToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  })

  const appUrl = (process.env.PUBLIC_APP_URL || 'https://crm.torenaone-office.ru').replace(/\/$/, '')
  const resetUrl = `${appUrl}/?resetToken=${rawToken}`
  try {
    await sendResetEmail(user.email, resetUrl)
  } catch (error) {
    console.error('Password reset email failed:', (error as Error).message)
  }

  res.json(generic)
})

router.post('/reset-password', async (req: Request, res: Response) => {
  const token = String(req.body.token || '').trim()
  const password = String(req.body.password || '')
  if (!token || !password) return res.status(400).json({ error: 'Missing fields' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })

  const reset = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash: hashResetToken(token),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  })
  if (!reset) return res.status(400).json({ error: 'Reset link is invalid or expired' })

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
  ])

  res.json({ ok: true })
})

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: userSelect,
  })
  if (!user) return res.status(404).json({ error: 'Not found' })
  res.json(user)
})

export default router
