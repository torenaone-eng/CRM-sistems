import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { uploadToS3, getPresignedUrl, downloadAndStore } from '../services/storage'

const router = Router()
const prisma = new PrismaClient()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } })

// GET /api/calls — история звонков
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { siteId, managerId, status, limit = '50', offset = '0' } = req.query as Record<string, string>
  const calls = await prisma.call.findMany({
    where: {
      ...(siteId    && { siteId }),
      ...(managerId && { managerId }),
      ...(status    && { status: status as any }),
    },
    include: { contact: true, manager: { select: { id: true, name: true, color: true } } },
    orderBy: { startedAt: 'desc' },
    take: parseInt(limit),
    skip: parseInt(offset),
  })
  res.json(calls)
})

// POST /api/calls/webhook — Twilio/Asterisk webhook
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { CallSid, CallStatus, From, To, CallDuration, SiteApiKey } = req.body

    // Найти сайт по API ключу (передаётся из TwiML)
    const site = SiteApiKey
      ? await prisma.site.findUnique({ where: { apiKey: SiteApiKey } })
      : null

    // Найти контакт по номеру
    const contact = await prisma.contact.findFirst({
      where: { phone: { contains: From?.replace(/\D/g, '').slice(-10) } }
    })

    const statusMap: Record<string, string> = {
      completed: 'COMPLETED', 'no-answer': 'MISSED', busy: 'BUSY', failed: 'MISSED',
    }

    const call = await prisma.call.upsert({
      where: { id: CallSid || 'new-' + Date.now() },
      create: {
        id: CallSid,
        contactId:   contact?.id,
        managerId:   contact?.managerId || (await prisma.user.findFirst())!.id,
        siteId:      site?.id || (await prisma.site.findFirst())!.id,
        direction:   'INBOUND',
        status:      (statusMap[CallStatus] || 'COMPLETED') as any,
        phoneFrom:   From || '',
        phoneTo:     To || '',
        durationSec: parseInt(CallDuration || '0'),
        disclaimerPlayed: site?.disclaimerEnabled || false,
      },
      update: {
        status:      (statusMap[CallStatus] || 'COMPLETED') as any,
        durationSec: parseInt(CallDuration || '0'),
      },
    })

    // Скачать запись с задержкой (Twilio формирует файл ~10 сек)
    if (CallStatus === 'completed' && CallSid) {
      setTimeout(async () => {
        try {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Recordings/${CallSid}.mp3`
          const authHeader = 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')
          const key = await downloadAndStore(call.id, twilioUrl, authHeader)
          await prisma.call.update({ where: { id: call.id }, data: { recordingKey: key } })
        } catch (e) {
          console.error('Recording download failed:', e)
        }
      }, 12_000)
    }

    res.sendStatus(200)
  } catch (e) {
    console.error('Webhook error:', e)
    res.sendStatus(500)
  }
})

// POST /api/calls/:id/upload — загрузить аудиофайл вручную
router.post('/:id/upload', authMiddleware, upload.single('audio'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file' })
  const key = `recordings/${req.params.id}.mp3`
  await uploadToS3(key, req.file.buffer, req.file.mimetype || 'audio/mpeg')
  await prisma.call.update({ where: { id: req.params.id }, data: { recordingKey: key } })
  res.json({ key })
})

// GET /api/calls/:id/recording — получить ссылку на запись
router.get('/:id/recording', authMiddleware, async (req: AuthRequest, res: Response) => {
  const call = await prisma.call.findUnique({ where: { id: req.params.id } })
  if (!call?.recordingKey) return res.status(404).json({ error: 'No recording' })
  const url = await getPresignedUrl(call.recordingKey, 3600)
  res.json({ url, expiresIn: 3600 })
})

// POST /api/calls — создать звонок вручную
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const call = await prisma.call.create({
    data: { ...req.body, managerId: req.body.managerId || req.userId },
    include: { contact: true, manager: { select: { id: true, name: true, color: true } } },
  })
  res.status(201).json(call)
})

// GET /api/calls/:id — детали звонка
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const call = await prisma.call.findUnique({
    where: { id: req.params.id },
    include: { contact: true, manager: { select: { id: true, name: true } }, site: true },
  })
  if (!call) return res.status(404).json({ error: 'Not found' })
  res.json(call)
})

export default router
