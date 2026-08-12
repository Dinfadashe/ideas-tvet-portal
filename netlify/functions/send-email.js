// netlify/functions/send-email.js
// Handles acceptance_approved and acceptance_rejected email types

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@theweb3alliance.org'
const APP_URL = process.env.VITE_APP_URL || 'https://ideas.theweb3alliance.org'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

function approvedHTML({ full_name }) {
  const logo = `${APP_URL}/logo.png`
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
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
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
  <tr><td align="center">
    <div style="width:72px;height:72px;background:#f0fdf4;border:2px solid #bbf7d0;border-radius:50%;text-align:center;line-height:72px;font-size:36px;display:inline-block;">✅</div>
  </td></tr></table>

  <h1 style="margin:0 0 14px;font-size:24px;font-weight:bold;color:#0a2e14;text-align:center;">Acceptance Letter Approved!</h1>

  <p style="margin:0 0 14px;font-size:15px;color:#334155;line-height:1.7;">Dear <strong>${full_name}</strong>,</p>
  <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
    Great news! Your <strong>Internship Acceptance Letter</strong> has been reviewed and <strong>approved</strong> by the programme administration.
  </p>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:18px 22px;">
    <div style="font-size:13px;color:#166534;line-height:1.7;">
      🎉 Your <strong>Internship Logbook</strong> is now unlocked and available on your portal.<br/>
      Log in to <a href="${APP_URL}" style="color:#1a7a3c;font-weight:bold;">${APP_URL}</a> and go to <strong>Logbook</strong> to start recording your daily internship activities.
    </div>
  </td></tr></table>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
  <tr><td align="center">
    <a href="${APP_URL}/dashboard/logbook" style="display:inline-block;background:linear-gradient(135deg,#0a2e14,#1a7a3c);color:#fff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 36px;border-radius:10px;">
      📋 Open My Logbook
    </a>
  </td></tr></table>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbea;border:1px solid #fde68a;border-radius:8px;margin-bottom:20px;">
  <tr><td style="padding:12px 16px;font-size:13px;color:#92400e;line-height:1.6;">
    ⚠️ <strong>Remember:</strong> You are required to fill your logbook regularly throughout your 3-month internship (15 Sept – 15 Dec 2026). Your instructor will review your entries and submit monthly performance scores.
  </td></tr></table>

  <p style="margin:0;font-size:13px;color:#64748b;">Help: <a href="mailto:ideas@theweb3alliance.org" style="color:#1a7a3c;">ideas@theweb3alliance.org</a> · Tel: 09031799036 / 09034574203</p>
</td></tr>

<tr><td style="background:linear-gradient(135deg,#0a2e14,#1a7a3c);padding:20px 40px;">
  <div style="color:rgba(255,255,255,0.9);font-size:13px;font-weight:bold;">Web3.0 Alliance Limited</div>
  <div style="color:rgba(255,255,255,0.6);font-size:11px;margin-top:2px;">IDEAS-TVET Initiative · Plateau State Polytechnic, Jos</div>
  <div style="color:rgba(255,255,255,0.6);font-size:11px;">ideas@theweb3alliance.org · ideas.theweb3alliance.org</div>
</td></tr>
</table></td></tr></table>
</body></html>`
}

function rejectedHTML({ full_name, reason }) {
  const logo = `${APP_URL}/logo.png`
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
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
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
  <tr><td align="center">
    <div style="width:72px;height:72px;background:#fef2f2;border:2px solid #fecaca;border-radius:50%;text-align:center;line-height:72px;font-size:36px;display:inline-block;">❌</div>
  </td></tr></table>

  <h1 style="margin:0 0 14px;font-size:24px;font-weight:bold;color:#0a2e14;text-align:center;">Acceptance Letter Not Approved</h1>

  <p style="margin:0 0 14px;font-size:15px;color:#334155;line-height:1.7;">Dear <strong>${full_name}</strong>,</p>
  <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
    Your <strong>Internship Acceptance Letter</strong> has been reviewed by the programme administration and could not be approved at this time.
  </p>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-left:4px solid #dc2626;border-radius:8px;margin-bottom:24px;">
  <tr><td style="padding:18px 22px;">
    <div style="font-size:12px;color:#dc2626;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Reason for Rejection</div>
    <div style="font-size:14px;color:#334155;line-height:1.7;">${reason}</div>
  </td></tr></table>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbea;border:1px solid #fde68a;border-radius:8px;margin-bottom:24px;">
  <tr><td style="padding:14px 18px;font-size:13px;color:#92400e;line-height:1.7;">
    📋 <strong>What to do:</strong><br/>
    Please address the issue mentioned above, obtain a corrected Internship Acceptance Letter from your host organisation, and re-upload it on your portal under <strong>Documents</strong>.
  </td></tr></table>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
  <tr><td align="center">
    <a href="${APP_URL}/dashboard/documents" style="display:inline-block;background:linear-gradient(135deg,#0a2e14,#1a7a3c);color:#fff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 36px;border-radius:10px;">
      📤 Re-upload Acceptance Letter
    </a>
  </td></tr></table>

  <p style="margin:0;font-size:13px;color:#64748b;line-height:1.7;">
    If you need assistance or clarification, please contact us at:<br/>
    📧 <a href="mailto:ideas@theweb3alliance.org" style="color:#1a7a3c;">ideas@theweb3alliance.org</a> · 📞 09031799036 / 09034574203<br/>
    📲 Telegram: <a href="https://t.me/+pORFwMgPhCMyZmRk" style="color:#1a7a3c;">t.me/+pORFwMgPhCMyZmRk</a>
  </p>
</td></tr>

<tr><td style="background:linear-gradient(135deg,#0a2e14,#1a7a3c);padding:20px 40px;">
  <div style="color:rgba(255,255,255,0.9);font-size:13px;font-weight:bold;">Web3.0 Alliance Limited</div>
  <div style="color:rgba(255,255,255,0.6);font-size:11px;margin-top:2px;">IDEAS-TVET Initiative · Plateau State Polytechnic, Jos</div>
  <div style="color:rgba(255,255,255,0.6);font-size:11px;">ideas@theweb3alliance.org · ideas.theweb3alliance.org</div>
</td></tr>
</table></td></tr></table>
</body></html>`
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  if (!RESEND_API_KEY) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'RESEND_API_KEY not set' }) }

  let body
  try { body = JSON.parse(event.body) }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  const { to, subject, type, full_name, reason } = body

  if (!to || !type || !full_name) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'to, type and full_name required' }) }
  }

  let html
  if (type === 'acceptance_approved') {
    html = approvedHTML({ full_name })
  } else if (type === 'acceptance_rejected') {
    if (!reason) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'reason required for rejection' }) }
    html = rejectedHTML({ full_name, reason })
  } else {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: `Unknown type: ${type}` }) }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: `IDEAS-TVET Portal <${FROM_EMAIL}>`,
        to: [to],
        subject,
        html,
      }),
    })
    const result = await res.json()
    if (!res.ok) return { statusCode: res.status, headers: CORS, body: JSON.stringify({ error: result.message }) }
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, id: result.id }) }
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) }
  }
}
