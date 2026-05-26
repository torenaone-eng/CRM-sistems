import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { siteId, managerId, stage } = req.query as Record<string,string>
  res.json(await prisma.deal.findMany({
    where: { ...(siteId && { siteId }), ...(managerId && { managerId }), ...(stage && { stage }) },
    include: { contact: { select: { id: true, name: true } }, manager: { select: { id: true, name: true, color: true } } },
    orderBy: { createdAt: 'desc' },
  }))
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  res.status(201).json(await prisma.deal.create({ data: { ...req.body, managerId: req.body.managerId || req.userId } }))
})

router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  res.json(await prisma.deal.update({ where: { id: req.params.id }, data: req.body }))
})

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  await prisma.deal.delete({ where: { id: req.params.id } })
  res.sendStatus(204)
})

export default router
