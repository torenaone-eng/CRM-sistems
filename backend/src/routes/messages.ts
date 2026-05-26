import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { contactId, siteId, channel } = req.query as Record<string,string>
  res.json(await prisma.message.findMany({
    where: { ...(contactId && { contactId }), ...(siteId && { siteId }), ...(channel && { channel }) },
    include: { contact: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  }))
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const msg = await prisma.message.create({ data: { ...req.body, managerId: req.body.managerId || req.userId } })
  res.status(201).json(msg)
})

router.patch('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  res.json(await prisma.message.update({ where: { id: req.params.id }, data: { read: true } }))
})

export default router
