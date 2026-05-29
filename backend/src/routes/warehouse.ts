import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

const asDate = (value: unknown) => value ? new Date(value as string) : null

function productData(body: any) {
  return {
    sku: body.sku || '',
    name: body.name,
    category: body.category || 'Товары',
    unit: body.unit || 'шт',
    stock: parseInt(body.stock) || 0,
    reserved: parseInt(body.reserved) || 0,
    price: parseInt(body.price) || 0,
    cost: parseInt(body.cost) || 0,
    tags: body.tags || [],
  }
}

function positionData(body: any) {
  return {
    status: body.status || 'На складе',
    serial: body.serial || '',
    orderedAt: asDate(body.orderedAt),
    receivedAt: asDate(body.receivedAt),
    soldAt: asDate(body.soldAt),
    name: body.name,
    category: body.category || 'Товары',
    price: parseInt(body.price) || 0,
    paid: parseInt(body.paid) || 0,
    balance: parseInt(body.balance) || 0,
    paymentMethod: body.paymentMethod || '',
    paymentFee: parseFloat(body.paymentFee) || 0,
    movementType: body.movementType || '',
    contactName: body.contactName || '',
    phone: body.phone || '',
    place: body.place || '',
    source: body.source || '',
    manager: body.manager || '',
    notes: body.notes || '',
  }
}

function documentData(body: any) {
  return {
    type: body.type,
    number: body.number,
    contactId: body.contactId || null,
    contactName: body.contactName || '',
    amount: parseInt(body.amount) || 0,
    status: body.status || 'Подготовлен',
    items: body.items || null,
    createdAt: asDate(body.createdAt) || new Date(),
  }
}

router.get('/products', authMiddleware, async (_, res: Response) => {
  res.json(await prisma.warehouseProduct.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] }))
})

router.post('/products', authMiddleware, async (req: AuthRequest, res: Response) => {
  res.status(201).json(await prisma.warehouseProduct.create({ data: productData(req.body) }))
})

router.patch('/products/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  res.json(await prisma.warehouseProduct.update({ where: { id: req.params.id }, data: productData(req.body) }))
})

router.delete('/products/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  await prisma.warehouseProduct.delete({ where: { id: req.params.id } })
  res.sendStatus(204)
})

router.get('/positions', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { status, category, q } = req.query as Record<string, string>
  res.json(await prisma.warehousePosition.findMany({
    where: {
      ...(status && { status }),
      ...(category && { category }),
      ...(q && { OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { serial: { contains: q, mode: 'insensitive' } },
        { contactName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ] }),
    },
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
  }))
})

router.post('/positions', authMiddleware, async (req: AuthRequest, res: Response) => {
  res.status(201).json(await prisma.warehousePosition.create({ data: positionData(req.body) }))
})

router.patch('/positions/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  res.json(await prisma.warehousePosition.update({ where: { id: req.params.id }, data: positionData(req.body) }))
})

router.delete('/positions/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  await prisma.warehousePosition.delete({ where: { id: req.params.id } })
  res.sendStatus(204)
})

router.get('/documents', authMiddleware, async (_, res: Response) => {
  res.json(await prisma.warehouseDocument.findMany({ orderBy: { createdAt: 'desc' } }))
})

router.post('/documents', authMiddleware, async (req: AuthRequest, res: Response) => {
  res.status(201).json(await prisma.warehouseDocument.create({ data: documentData(req.body) }))
})

router.patch('/documents/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  res.json(await prisma.warehouseDocument.update({ where: { id: req.params.id }, data: documentData(req.body) }))
})

router.delete('/documents/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  await prisma.warehouseDocument.delete({ where: { id: req.params.id } })
  res.sendStatus(204)
})

export default router
