type AmoLeadInput = {
  name: string
  phone: string
  email?: string | null
  comment?: string | null
  source?: string | null
  pageUrl?: string | null
  price?: number
}

type AmoCreateResult = {
  enabled: boolean
  contactId?: number
  leadId?: number
  taskId?: number
  error?: string
}

const config = {
  subdomain: process.env.AMOCRM_SUBDOMAIN || 'mmteplo.amocrm.ru',
  token: process.env.AMOCRM_TOKEN || '',
  pipelineId: process.env.AMOCRM_PIPELINE_ID || 'https://mmteplo.amocrm.ru/leads/pipeline/8701150/',
  statusId: process.env.AMOCRM_STATUS_ID || '8701150',
  tagName: process.env.AMOCRM_TAG_NAME || 'Заявка с сайта',
  createTask: (process.env.AMOCRM_CREATE_TASK || 'true') === 'true',
  taskText: process.env.AMOCRM_TASK_TEXT || 'Дать оценку стоимости и перезвонить клиенту!',
  taskHours: parseInt(process.env.AMOCRM_TASK_HOURS || '24', 10),
  taskResponsibleId: parseInt(process.env.AMOCRM_TASK_RESPONSIBLE_ID || '11593098', 10),
  fields: {
    pageUrl: parseInt(process.env.AMOCRM_FIELD_PAGE_URL || '785653', 10),
    name: parseInt(process.env.AMOCRM_FIELD_NAME || '857375', 10),
    phone: parseInt(process.env.AMOCRM_FIELD_PHONE || '857377', 10),
    email: parseInt(process.env.AMOCRM_FIELD_EMAIL || '0', 10),
    message: parseInt(process.env.AMOCRM_FIELD_MESSAGE || '0', 10),
  },
}

function apiBase() {
  return `https://${config.subdomain.replace(/^https?:\/\//, '').replace(/\/$/, '')}/api/v4`
}

function numericId(value: string) {
  const match = String(value || '').match(/(\d+)(?:\/)?$/)
  return match ? parseInt(match[1], 10) : 0
}

function fieldValue(fieldId: number, value: unknown) {
  const prepared = String(value || '').trim()
  if (!fieldId || !prepared) return null
  return { field_id: fieldId, values: [{ value: prepared }] }
}

async function amoRequest<T>(path: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: body == null ? undefined : JSON.stringify(body),
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) {
    const message = data?.detail || data?.title || `amoCRM request failed with ${response.status}`
    throw new Error(message)
  }
  return data as T
}

async function createContact(input: AmoLeadInput) {
  const payload = [{
    name: input.name,
    custom_fields_values: [{
      field_code: 'PHONE',
      values: [{ value: input.phone, enum_code: 'WORK' }],
    }],
  }]

  const data = await amoRequest<{ _embedded?: { contacts?: Array<{ id: number }> } }>('/contacts', 'POST', payload)
  return data._embedded?.contacts?.[0]?.id
}

async function createLead(input: AmoLeadInput, contactId: number, includePipeline = true) {
  const customFields = [
    fieldValue(config.fields.name, input.name),
    fieldValue(config.fields.phone, input.phone),
    fieldValue(config.fields.email, input.email),
    fieldValue(config.fields.pageUrl, input.pageUrl),
    fieldValue(config.fields.message, input.comment),
  ].filter(Boolean)

  const payload: Record<string, unknown> = {
    name: `Заявка с сайта - ${input.name}${input.source ? ` (${input.source})` : ''}`,
    price: input.price || 0,
    _embedded: {
      contacts: [{ id: contactId }],
      tags: [{ name: config.tagName }],
    },
    custom_fields_values: customFields,
  }

  if (includePipeline) {
    const pipelineId = numericId(config.pipelineId)
    const statusId = numericId(config.statusId)
    if (pipelineId) payload.pipeline_id = pipelineId
    if (statusId) payload.status_id = statusId
  }

  const data = await amoRequest<{ _embedded?: { leads?: Array<{ id: number }> } }>('/leads', 'POST', [payload])
  return data._embedded?.leads?.[0]?.id
}

async function createTask(leadId: number) {
  const completeTill = Math.floor(Date.now() / 1000) + Math.max(1, config.taskHours) * 60 * 60
  const payload: Record<string, unknown> = {
    entity_id: leadId,
    entity_type: 'leads',
    text: config.taskText,
    complete_till: completeTill,
    task_type_id: 1,
  }

  if (config.taskResponsibleId > 0) {
    payload.responsible_user_id = config.taskResponsibleId
  }

  const data = await amoRequest<{ _embedded?: { tasks?: Array<{ id: number }> } }>('/tasks', 'POST', [payload])
  return data._embedded?.tasks?.[0]?.id
}

export async function sendLeadToAmo(input: AmoLeadInput): Promise<AmoCreateResult> {
  if (!config.token) return { enabled: false }

  try {
    const contactId = await createContact(input)
    if (!contactId) throw new Error('amoCRM did not return contact id')

    let leadId: number | undefined
    try {
      leadId = await createLead(input, contactId, true)
    } catch (error) {
      console.warn('amoCRM pipeline/status rejected, retrying without them:', (error as Error).message)
      leadId = await createLead(input, contactId, false)
    }
    if (!leadId) throw new Error('amoCRM did not return lead id')

    const taskId = config.createTask ? await createTask(leadId) : undefined
    return { enabled: true, contactId, leadId, taskId }
  } catch (error) {
    const message = (error as Error).message
    console.error('amoCRM lead sync failed:', message)
    return { enabled: true, error: message }
  }
}
