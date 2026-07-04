// netlify/functions/send-password-reset.js
// Uses fetch directly — no npm packages needed

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@theweb3alliance.org'
const APP_URL = process.env.VITE_APP_URL || 'https://ideas.theweb3alliance.org'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

function buildHTML({ full_name, reset_link }) {
  const logo = `${APP_URL}/logo.png`
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Reset Your Password — IDEAS-TVET</title></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);max-width:600px;width:100%;">

<tr><td style="background:linear-gradient(135deg,#0a2e14,#1a7a3c);padding:28px 40px 20px;">
  <img src="${logo}" alt="Web3.0 Alliance" style="height:44px;width:auto;display:block;margin-bottom:8px;"/>
  <div style="color:#fff;font-size:18px;font-weight:bold;">WEB3.0 ALLIANCE LIMITED</div>
  <div style="color:rgba(255,255,255,0.7);font-size:12px;margin-top:2px;">IDEAS-TVET Programme — Plateau State</div>
</td></tr>
<tr><td style="height:4px;background:linear-gradient(90deg,#c8a82a,#1a7a3c);"></td></tr>

<tr><td style="padding:36px 40px 24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
  <tr><td align="center">
    <div style="width:72px;height:72px;background:#f0fdf4;border:2px solid #bbf7d0;border-radius:50%;text-align:center;line-height:72px;font-size:32px;display:inline-block;">🔐</div>
  </td></tr></table>

  <h1 style="margin:0 0 16px;font-size:24px;font-weight:bold;color:#0a2e14;text-align:center;">Reset Your Password</h1>
  <p style="margin:0 0 14px;font-size:15px;color:#334155;line-height:1.7;">Dear <strong>${full_name}</strong>,</p>
  <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.7;">
    We received a request to reset your IDEAS-TVET portal password. Click the button below to set a new password. This link will expire in <strong>1 hour</strong>.
  </p>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
  <tr><td align="center">
    <a href="${reset_link}" style="display:inline-block;background:linear-gradient(135deg,#0a2e14,#1a7a3c);color:#fff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 36px;border-radius:10px;">
      🔑 Reset My Password
    </a>
  </td></tr></table>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:20px;">
  <tr><td style="padding:14px 18px;font-size:13px;color:#991b1b;line-height:1.6;">
    🛡️ <strong>Security Notice:</strong> If you did not request this, ignore this email. Your account remains secure. Do not share this link.
  </td></tr></table>

  <p style="margin:0 0 8px;font-size:13px;color:#64748b;">If the button doesn't work, copy and paste this link:</p>
  <p style="margin:0 0 20px;font-size:12px;color:#1a7a3c;word-break:break-all;">${reset_link}</p>
  <p style="margin:0;font-size:13px;color:#64748b;">Help: <a href="mailto:ideas@theweb3alliance.org" style="color:#1a7a3c;">ideas@theweb3alliance.org</a></p>
</td></tr>

<tr><td style="background:linear-gradient(135deg,#0a2e14,#1a7a3c);padding:20px 40px;">
  <div style="color:rgba(255,255,255,0.9);font-size:13px;font-weight:bold;">Web3.0 Alliance Limited</div>
  <div style="color:rgba(255,255,255,0.6);font-size:11px;margin-top:2px;">IDEAS-TVET Initiative · Plateau State Polytechnic, Jos</div>
  <div style="color:rgba(255,255,255,0.6);font-size:11px;">ideas@theweb3alliance.org · ideas.theweb3alliance.org</div>
</td></tr>

</table>
</td></tr></table>
</body></html>`
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  if (!RESEND_API_KEY) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'RESEND_API_KEY not set' }) }

  let body
  try { body = JSON.parse(event.body) }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  const { full_name, email, reset_link } = body
  if (!full_name || !email || !reset_link) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'full_name, email, reset_link required' }) }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: `IDEAS-TVET Portal <${FROM_EMAIL}>`,
        to: [email],
        subject: `🔐 Reset Your IDEAS-TVET Portal Password`,
        html: buildHTML({ full_name, reset_link }),
      }),
    })
    const result = await res.json()
    if (!res.ok) return { statusCode: res.status, headers: CORS, body: JSON.stringify({ error: result.message || 'Resend error' }) }
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, id: result.id }) }
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) }
  }
}
