import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

async function findSite(apiKey: string | undefined) {
  if (!apiKey) return null
  return prisma.site.findUnique({ where: { apiKey } })
}

async function firstManagerId(site: { assignedManagerIds: string[] } | null) {
  if (site?.assignedManagerIds?.[0]) return site.assignedManagerIds[0]
  const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } })
  return user?.id || null
}

router.get('/catalog', async (req: Request, res: Response) => {
  const apiKey = (req.query.apiKey || req.header('x-site-key')) as string | undefined
  const site = await findSite(apiKey)
  if (!site || !site.active) return res.status(404).json({ error: 'Site not found' })

  const products = await prisma.warehouseProduct.findMany({
    where: { stock: { gt: 0 } },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    take: 24,
  })

  res.json({
    site: { id: site.id, name: site.name, domain: site.domain, channels: site.channels },
    products,
  })
})

router.post('/lead', async (req: Request, res: Response) => {
  const apiKey = req.body.apiKey || req.header('x-site-key')
  const site = await findSite(apiKey)
  if (!site || !site.active) return res.status(404).json({ error: 'Site not found' })

  const managerId = await firstManagerId(site)
  if (!managerId) return res.status(400).json({ error: 'No manager available' })

  const name = String(req.body.name || '').trim()
  const phone = String(req.body.phone || '').trim()
  const interest = String(req.body.interest || '').trim()
  const productId = req.body.productId ? String(req.body.productId) : null
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' })

  const product = productId ? await prisma.warehouseProduct.findUnique({ where: { id: productId } }) : null
  const title = product ? `${product.name} · заявка с сайта` : `Заявка с сайта · ${interest || name}`
  const tags = ['Сайт', 'Каталог', ...(product ? [product.category, product.name] : []), ...(interest ? [interest] : [])]

  const contact = await prisma.contact.create({
    data: {
      name,
      phone,
      email: req.body.email || null,
      company: req.body.company || null,
      status: 'LEAD',
      leadStage: 'new',
      tags,
      managerId,
      siteId: site.id,
    },
  })

  const message = await prisma.message.create({
    data: {
      contactId: contact.id,
      managerId,
      siteId: site.id,
      channel: req.body.channel || 'site',
      incoming: true,
      read: false,
      text: [
        'Новая заявка с сайта',
        product ? `Товар: ${product.name}` : null,
        interest ? `Интерес: ${interest}` : null,
        req.body.comment ? `Комментарий: ${req.body.comment}` : null,
      ].filter(Boolean).join('\n'),
    },
  })

  const deal = await prisma.deal.create({
    data: {
      title,
      contactId: contact.id,
      managerId,
      siteId: site.id,
      amount: product?.price || 0,
      stage: 'Новый',
      tags,
    },
  })

  res.status(201).json({ ok: true, contact, message, deal })
})

export default router
