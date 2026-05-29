import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

const userSelect = { id: true, name: true, email: true, role: true, color: true, theme: true, board: true, createdAt: true }

router.get('/', authMiddleware, async (_, res: Response) => {
  res.json(await prisma.user.findMany({ select: userSelect, orderBy: { createdAt: 'asc' } }))
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
