import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth'
import bcrypt from 'bcryptjs'

const router = Router()
const prisma = new PrismaClient()

const userSelect = { id: true, name: true, email: true, role: true, color: true, theme: true, board: true, createdAt: true }

router.get('/', authMiddleware, async (_, res: Response) => {
  res.json(await prisma.user.findMany({ select: userSelect, orderBy: { createdAt: 'asc' } }))
})

router.post('/me/password', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' })
  if (String(newPassword).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })

  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
  res.json({ ok: true })
})

router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { passwordHash, ...data } = req.body
  const user = await prisma.user.update({ where: { id: req.params.id }, data, select: userSelect })
  res.json(user)
})

router.delete('/:id', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  await prisma.user.delete({ where: { id: req.params.id } })
  res.sendStatus(204)
})

export default router
