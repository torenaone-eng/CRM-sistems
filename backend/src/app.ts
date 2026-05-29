import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

dotenv.config()

import authRoutes    from './routes/auth'
import sitesRoutes   from './routes/sites'
import contactsRoutes from './routes/contacts'
import callsRoutes   from './routes/calls'
import messagesRoutes from './routes/messages'
import dealsRoutes   from './routes/deals'
import tasksRoutes   from './routes/tasks'
import usersRoutes   from './routes/users'
import warehouseRoutes from './routes/warehouse'
import publicRoutes from './routes/public'

const app = express()
const corsOrigins = (process.env.CORS_ORIGIN || '*').split(',').map(origin => origin.trim())

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: corsOrigins.length === 1 && corsOrigins[0] === '*' ? '*' : corsOrigins }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/api/health', (_, res) => res.json({ ok: true, ts: Date.now() }))

// Routes
app.use('/api/auth',     authRoutes)
app.use('/api/sites',    sitesRoutes)
app.use('/api/contacts', contactsRoutes)
app.use('/api/calls',    callsRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/deals',    dealsRoutes)
app.use('/api/tasks',    tasksRoutes)
app.use('/api/users',    usersRoutes)
app.use('/api/warehouse', warehouseRoutes)
app.use('/api/public', publicRoutes)

// 404
app.use((_, res) => res.status(404).json({ error: 'Not found' }))

const PORT = parseInt(process.env.PORT || '3001')
const HOST = process.env.HOST || '127.0.0.1'
app.listen(PORT, HOST, () => {
  console.log(`🚀 CRM API running on http://${HOST}:${PORT}`)
  console.log(`   ENV: ${process.env.NODE_ENV || 'development'}`)
})

export default app
