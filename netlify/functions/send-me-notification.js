// netlify/functions/send-me-notification.js
// Sends M&E officer notification emails to instructors

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@theweb3alliance.org'
const APP_URL = process.env.VITE_APP_URL || 'https://ideas.theweb3alliance.org'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method Not Allowed' }) }

  let body
  try { body = JSON.parse(event.body) } catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  const { to_email, to_name, message, from_name } = body
  if (!to_email || !message) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'to_email and message required' }) }

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);max-width:600px;width:100%;">

<tr><td style="background:linear-gradient(135deg,#1e1b4b,#3730a3);padding:28px 40px 20px;">
  <div style="color:#fff;font-size:18px;font-weight:bold;">IDEAS-TVET PROGRAMME</div>
  <div style="color:rgba(255,255,255,0.7);font-size:12px;margin-top:2px;">Monitoring & Evaluation — Official Notice</div>
</td></tr>
<tr><td style="height:4px;background:linear-gradient(90deg,#c8a82a,#3730a3);"></td></tr>

<tr><td style="padding:32px 40px;">
  <p style="font-size:15px;color:#334155;margin:0 0 12px;">Dear <strong>${to_name}</strong>,</p>
  <p style="font-size:13px;color:#64748b;margin:0 0 20px;">You have received an official notice from the <strong>M&E Officer</strong> of the IDEAS-TVET Programme:</p>

  <div style="background:#f8fafc;border-left:4px solid #3730a3;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
    <p style="font-size:15px;color:#0a1628;line-height:1.7;margin:0;">${message.replace(/\n/g, '<br/>')}</p>
  </div>

  <p style="font-size:13px;color:#64748b;margin:0 0 8px;">Please log in to the portal to take the necessary action:</p>
  <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#1e1b4b,#3730a3);color:#fff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:8px;">
    Open Portal
  </a>
</td></tr>

<tr><td style="background:#1e1b4b;padding:20px 40px;">
  <div style="color:rgba(255,255,255,0.9);font-size:13px;font-weight:bold;">${from_name} — M&E Officer</div>
  <div style="color:rgba(255,255,255,0.6);font-size:11px;margin-top:2px;">IDEAS-TVET Programme · Web3.0 Alliance Limited · ideas.theweb3alliance.org</div>
</td></tr>

</table>
</td></tr></table>
</body></html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: `IDEAS-TVET M&E <${FROM_EMAIL}>`,
        to: [to_email],
        subject: `📢 M&E Notice — IDEAS-TVET Programme`,
        html,
      }),
    })
    const result = await res.json()
    if (!res.ok) return { statusCode: res.status, headers: CORS, body: JSON.stringify({ error: result.message }) }
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) }
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) }
  }
}
