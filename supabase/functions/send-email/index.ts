// Supabase Edge Function — proxy para Resend API
// Evita CORS al llamar la API de Resend desde el browser
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const { resend_key, from, to, subject, html, reply_to } = await req.json()

    if (!resend_key) {
      return new Response(JSON.stringify({ error: 'resend_key requerida' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }
    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: 'to, subject y html son requeridos' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const body: Record<string, unknown> = {
      from: from || 'ermix <onboarding@resend.dev>',
      to,
      subject,
      html,
    }
    if (reply_to) body.reply_to = reply_to

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resend_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
