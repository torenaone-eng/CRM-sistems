import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import warehouseData from './warehouse-data.json'

const prisma = new PrismaClient()
const toInt = (value: unknown) => Number.parseInt(String(value ?? 0), 10) || 0
const toFloat = (value: unknown) => Number.parseFloat(String(value ?? 0)) || 0

async function main() {
  const passwordHash = await bcrypt.hash('TorenaOne2026!', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@torenaone.ru' },
    update: {},
    create: {
      name: 'Алексей Морозов',
      email: 'admin@torenaone.ru',
      passwordHash,
      role: 'ADMIN',
      color: '#2f8f36',
      theme: 'midnight',
      board: { stats: true, sites: true, managers: true, pipeline: true },
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@torenaone.ru' },
    update: {},
    create: {
      name: 'Светлана Петрова',
      email: 'manager@torenaone.ru',
      passwordHash,
      role: 'MANAGER',
      color: '#50b743',
      theme: 'emerald',
      board: { stats: true, sites: false, managers: true, pipeline: true },
    },
  })

  const site = await prisma.site.upsert({
    where: { apiKey: 'sk_live_torenaone_main' },
    update: {},
    create: {
      name: 'Главный сайт',
      domain: 'мировые-мощности.рф',
      color: '#50b743',
      active: true,
      apiKey: 'sk_live_torenaone_main',
      channels: ['whatsapp', 'telegram', 'max'],
      assignedManagerIds: [admin.id, manager.id],
      recordingEnabled: true,
      disclaimerEnabled: true,
      disclaimerText: 'Уважаемый клиент, данный разговор записывается в целях контроля качества обслуживания.',
      disclaimerVoice: true,
      disclaimerVoiceGender: 'female',
      disclaimerVoiceDelay: 3,
      disclaimerShowInChat: true,
    },
  })

  const lead = await prisma.contact.upsert({
    where: { id: 'seed-lead-mikhail' },
    update: {},
    create: {
      id: 'seed-lead-mikhail',
      name: 'Михаил Соколов',
      phone: '+7 903 111-22-33',
      email: 'm.sokolov@mail.ru',
      company: 'ИП Соколов',
      status: 'LEAD',
      leadStage: 'new',
      tags: ['Демо', 'магазин'],
      managerId: manager.id,
      siteId: site.id,
    },
  })

  const meetingLead = await prisma.contact.upsert({
    where: { id: 'seed-lead-ekaterina' },
    update: {},
    create: {
      id: 'seed-lead-ekaterina',
      name: 'Екатерина Лебедева',
      phone: '+7 926 555-44-33',
      email: 'lebed@stroy.ru',
      company: 'СтройТех',
      status: 'LEAD',
      leadStage: 'meeting',
      tags: ['Тендер', 'оборудование'],
      managerId: admin.id,
      siteId: site.id,
    },
  })

  await prisma.deal.upsert({
    where: { id: 'seed-deal-stroytech' },
    update: {},
    create: {
      id: 'seed-deal-stroytech',
      title: 'Поставка оборудования · СтройТех',
      contactId: meetingLead.id,
      managerId: admin.id,
      siteId: site.id,
      amount: 340000,
      stage: 'КП отправлено',
      tags: ['склад', 'тендер'],
    },
  })

  await prisma.task.upsert({
    where: { id: 'seed-task-mikhail' },
    update: {},
    create: {
      id: 'seed-task-mikhail',
      title: 'Квалифицировать интерес Михаила',
      contactId: lead.id,
      managerId: manager.id,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      done: false,
    },
  })

  await prisma.message.upsert({
    where: { id: 'seed-message-max' },
    update: {},
    create: {
      id: 'seed-message-max',
      contactId: lead.id,
      managerId: manager.id,
      siteId: site.id,
      channel: 'max',
      text: 'Здравствуйте! Хочу уточнить условия подключения.',
      incoming: true,
      read: false,
    },
  })

  for (const product of warehouseData.products) {
    await prisma.warehouseProduct.upsert({
      where: { id: product.id },
      update: {},
      create: product,
    })
  }

  for (const position of warehouseData.positions) {
    await prisma.warehousePosition.upsert({
      where: { id: position.id },
      update: {},
      create: {
        id: position.id,
        status: position.status,
        serial: position.serial || '',
        name: position.name,
        category: position.category || 'Товары',
        price: toInt(position.price),
        paid: toInt(position.paid),
        balance: toInt(position.balance),
        paymentMethod: position.paymentMethod || '',
        paymentFee: toFloat(position.paymentFee),
        movementType: position.movementType || '',
        contactName: position.contactName || '',
        phone: String(position.phone || ''),
        place: position.place || '',
        source: position.source || '',
        manager: position.manager || '',
        notes: position.notes || '',
        orderedAt: position.orderedAt ? new Date(position.orderedAt) : null,
        receivedAt: position.receivedAt ? new Date(position.receivedAt) : null,
        soldAt: position.soldAt ? new Date(position.soldAt) : null,
      },
    })
  }

  for (const document of warehouseData.documents) {
    await prisma.warehouseDocument.upsert({
      where: { id: document.id },
      update: {},
      create: {
        ...document,
        createdAt: document.createdAt ? new Date(document.createdAt) : new Date(),
      },
    })
  }

  console.log('Seed complete')
  console.log('Login: admin@torenaone.ru / TorenaOne2026!')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
