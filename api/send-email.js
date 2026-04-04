// Vercel Serverless Function — proxy para Resend API
// Resend no acepta llamadas directas desde el browser (CORS)
// Este endpoint corre server-side en Vercel sin ese problema

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Vercel parsea el body automáticamente si Content-Type es application/json
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { resend_key, from, to, subject, html, reply_to } = body || {}

    if (!resend_key) return res.status(400).json({ error: 'resend_key requerida' })
    if (!to || !subject || !html) return res.status(400).json({ error: 'to, subject y html son requeridos' })

    const payload = { from: from || 'ermix <cotizaciones@ermix.app>', to, subject, html }
    if (reply_to) payload.reply_to = reply_to

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resend_key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    return res.status(response.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}
