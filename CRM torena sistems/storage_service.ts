import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  endpoint:  process.env.S3_ENDPOINT,
  region:    'us-east-1',
  credentials: {
    accessKeyId:     process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true, // required for MinIO
})

const BUCKET = process.env.S3_BUCKET || 'crm-recordings'

export async function uploadToS3(key: string, body: Buffer, contentType: string): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: body, ContentType: contentType,
  }))
  return key
}

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn })
}

export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

export async function downloadAndStore(callId: string, externalUrl: string, authHeader?: string): Promise<string> {
  const headers: Record<string, string> = {}
  if (authHeader) headers['Authorization'] = authHeader

  const resp = await fetch(externalUrl, { headers })
  if (!resp.ok) throw new Error(`Failed to download: ${resp.status}`)

  const buffer = Buffer.from(await resp.arrayBuffer())
  const key = `recordings/${callId}.mp3`
  return uploadToS3(key, buffer, 'audio/mpeg')
}
