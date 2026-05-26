import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { siteId, managerId, status, q } = req.query as Record<string,string>
  res.json(await prisma.contact.findMany({
    where: {
      ...(siteId    && { siteId }),
      ...(managerId && { managerId }),
      ...(status    && { status: status as any }),
      ...(q && { OR: [{ name: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }, { email: { contains: q, mode: 'insensitive' } }] }),
    },
    include: { manager: { select: { id: true, name: true, color: true } }, site: { select: { id: true, name: true, color: true } } },
    orderBy: { createdAt: 'desc' },
  }))
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const contact = await prisma.contact.create({ data: req.body, include: { manager: { select: { id: true, name: true } } } })
  res.status(201).json(contact)
})

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const c = await prisma.contact.findUnique({ where: { id: req.params.id }, include: { calls: { orderBy: { startedAt: 'desc' }, take: 10 }, messages: { orderBy: { createdAt: 'desc' }, take: 20 }, deals: true, tasks: true } })
  if (!c) return res.status(404).json({ error: 'Not found' })
  res.json(c)
})

router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  res.json(await prisma.contact.update({ where: { id: req.params.id }, data: req.body }))
})

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  await prisma.contact.delete({ where: { id: req.params.id } })
  res.sendStatus(204)
})

export default router
