// netlify/functions/send-profile-reminder.js
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

function buildHTML({ full_name, id_number, missing_fields }) {
  const logo = `${APP_URL}/logo.png`
  const portal = APP_URL
  const missingList = (missing_fields || ['Passport photograph', 'Bank account details', 'Next of kin information', 'NIN / BVN'])
    .map(f => `<li style="margin-bottom:6px;color:#334155;font-size:14px;">${f}</li>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Complete Your Profile — IDEAS-TVET</title></head>
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
  <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Friendly Reminder</p>
  <h1 style="margin:0 0 20px;font-size:24px;font-weight:bold;color:#0a2e14;">Your Profile Is Incomplete</h1>
  <p style="margin:0 0 14px;font-size:15px;color:#334155;line-height:1.7;">Dear <strong>${full_name}</strong>,</p>
  <p style="margin:0 0 14px;font-size:15px;color:#334155;line-height:1.7;">
    Your trainee profile on the IDEAS-TVET portal is not yet complete. A complete profile is required to process your stipend payments, generate your ID card, and issue your Certificate of Completion.
  </p>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbea;border:1px solid #fde68a;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:18px 22px;">
    <div style="font-size:12px;font-weight:bold;color:#92400e;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">⚠️ Items Still Needed:</div>
    <ul style="margin:0;padding-left:20px;">${missingList}</ul>
  </td></tr></table>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
  <tr><td style="padding:12px 18px;">
    <span style="font-size:12px;color:#94a3b8;">Your Trainee ID: </span>
    <span style="font-size:14px;font-weight:bold;color:#0a2e14;">${id_number}</span>
  </td></tr></table>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
  <tr><td align="center">
    <a href="${portal}" style="display:inline-block;background:linear-gradient(135deg,#0a2e14,#1a7a3c);color:#fff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 36px;border-radius:10px;">
      📝 Complete My Profile Now
    </a>
  </td></tr></table>

  <p style="margin:0;font-size:13px;color:#64748b;line-height:1.7;">
    Help: <a href="mailto:ideas@theweb3alliance.org" style="color:#1a7a3c;">ideas@theweb3alliance.org</a> · 
    Telegram: <a href="https://t.me/+pORFwMgPhCMyZmRk" style="color:#1a7a3c;">t.me/+pORFwMgPhCMyZmRk</a>
  </p>
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

  const { full_name, email, id_number, missing_fields } = body
  if (!full_name || !email || !id_number) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'full_name, email, id_number required' }) }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: `IDEAS-TVET Portal <${FROM_EMAIL}>`,
        to: [email],
        subject: `⚠️ Action Required — Complete Your IDEAS-TVET Profile, ${full_name}`,
        html: buildHTML({ full_name, id_number, missing_fields }),
      }),
    })
    const result = await res.json()
    if (!res.ok) return { statusCode: res.status, headers: CORS, body: JSON.stringify({ error: result.message || 'Resend error' }) }
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, id: result.id }) }
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) }
  }
}
