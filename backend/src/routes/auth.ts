import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()
const jwtExpiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn']
const userSelect = { id: true, name: true, email: true, role: true, color: true, theme: true, board: true, createdAt: true }

function signAuthToken(user: { id: string; role: string }) {
  return jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: jwtExpiresIn })
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

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: userSelect,
  })
  if (!user) return res.status(404).json({ error: 'Not found' })
  res.json(user)
})

export default router
