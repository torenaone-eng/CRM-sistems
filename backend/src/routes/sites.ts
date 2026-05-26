// routes/sites.ts
import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import crypto from 'crypto'

const router = Router()
const prisma = new PrismaClient()

router.get('/', authMiddleware, async (_, res: Response) => {
  res.json(await prisma.site.findMany({ orderBy: { createdAt: 'desc' } }))
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const site = await prisma.site.create({
    data: { ...req.body, apiKey: 'sk_live_' + crypto.randomBytes(16).toString('hex') }
  })
  res.status(201).json(site)
})

router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const site = await prisma.site.update({ where: { id: req.params.id }, data: req.body })
  res.json(site)
})

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  await prisma.site.delete({ where: { id: req.params.id } })
  res.sendStatus(204)
})

export default router
