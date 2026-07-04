// netlify/functions/send-admission-letter.js
// Uses fetch directly — no npm packages needed

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@theweb3alliance.org'
const APP_URL = process.env.VITE_APP_URL || 'https://ideas.theweb3alliance.org'
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

async function updateLog(logId, status) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !logId) return
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/email_logs?id=eq.${logId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
      body: JSON.stringify({ status, sent_at: status === 'sent' ? new Date().toISOString() : null }),
    })
  } catch (_) {}
}

function buildHTML({ full_name, id_number, admission_link, email }) {
  const logo = `${APP_URL}/logo.png`
  const tg = 'https://t.me/+pORFwMgPhCMyZmRk'
  const link = admission_link || `${APP_URL}/dashboard`

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Admission Offer — IDEAS-TVET</title></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);max-width:600px;width:100%;">

<!-- HEADER -->
<tr><td style="background:linear-gradient(135deg,#0a2e14,#1a7a3c);padding:28px 40px 20px;">
  <img src="${logo}" alt="Web3.0 Alliance" style="height:44px;width:auto;display:block;margin-bottom:8px;"/>
  <div style="color:#fff;font-size:18px;font-weight:bold;">WEB3.0 ALLIANCE LIMITED</div>
  <div style="color:rgba(255,255,255,0.7);font-size:12px;margin-top:2px;">IDEAS-TVET Programme — Plateau State</div>
</td></tr>
<tr><td style="height:4px;background:linear-gradient(90deg,#c8a82a,#1a7a3c);"></td></tr>

<!-- BODY -->
<tr><td style="padding:36px 40px 24px;">
  <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Congratulations!</p>
  <h1 style="margin:0 0 20px;font-size:24px;font-weight:bold;color:#0a2e14;">You Have Been Admitted</h1>
  <p style="margin:0 0 14px;font-size:15px;color:#334155;line-height:1.7;">Dear <strong>${full_name}</strong>,</p>
  <p style="margin:0 0 14px;font-size:15px;color:#334155;line-height:1.7;">
    You have been selected for admission into the <strong>IDEAS-TVET Computer Hardware &amp; Cellphone Repairs Training Programme</strong>, funded by the <strong>World Bank</strong> and implemented by Web3.0 Alliance Limited in partnership with the Federal Ministry of Education. This programme is <strong>completely FREE</strong>.
  </p>

  <!-- ID BOX -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:28px;">
  <tr><td style="padding:16px 20px;">
    <div style="font-size:11px;color:#16a34a;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Your Trainee ID</div>
    <div style="font-size:26px;font-weight:bold;color:#0a2e14;letter-spacing:2px;">${id_number}</div>
  </td></tr></table>

  <!-- STEPS -->
  <p style="margin:0 0 14px;font-size:15px;font-weight:bold;color:#0a2e14;">Next Steps:</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
  <tr><td width="36" valign="top"><div style="width:28px;height:28px;background:#1a7a3c;border-radius:50%;color:#fff;font-weight:bold;font-size:13px;text-align:center;line-height:28px;">1</div></td>
  <td valign="top" style="padding-left:10px;"><div style="font-weight:bold;color:#0a2e14;font-size:14px;margin-bottom:2px;">Accept Your Admission</div>
  <div style="color:#64748b;font-size:13px;">Click the button below — this link is unique to you.</div></td></tr></table>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
  <tr><td width="36" valign="top"><div style="width:28px;height:28px;background:#1a7a3c;border-radius:50%;color:#fff;font-weight:bold;font-size:13px;text-align:center;line-height:28px;">2</div></td>
  <td valign="top" style="padding-left:10px;"><div style="font-weight:bold;color:#0a2e14;font-size:14px;margin-bottom:2px;">Log In &amp; Complete Your Profile</div>
  <div style="color:#64748b;font-size:13px;"><a href="${APP_URL}" style="color:#1a7a3c;">ideas.theweb3alliance.org</a> · Email: ${email} · Password: <strong>pass</strong></div></td></tr></table>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
  <tr><td width="36" valign="top"><div style="width:28px;height:28px;background:#1a7a3c;border-radius:50%;color:#fff;font-weight:bold;font-size:13px;text-align:center;line-height:28px;">3</div></td>
  <td valign="top" style="padding-left:10px;"><div style="font-weight:bold;color:#0a2e14;font-size:14px;margin-bottom:2px;">Join the Private Classroom</div>
  <div style="color:#64748b;font-size:13px;"><a href="${tg}" style="color:#1a7a3c;font-weight:bold;">${tg}</a></div></td></tr></table>

  <!-- CTA -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
  <tr><td align="center">
    <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#0a2e14,#1a7a3c);color:#fff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 36px;border-radius:10px;">
      ✅ Accept My Admission Now
    </a>
  </td></tr></table>

  <!-- WARNING -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbea;border:1px solid #fde68a;border-radius:8px;margin-bottom:20px;">
  <tr><td style="padding:12px 16px;font-size:13px;color:#92400e;line-height:1.6;">
    ⚠️ <strong>This offer must be accepted within 24 hours.</strong> Failure to accept will result in your slot being reallocated to another qualified applicant from our reserve list.
  </td></tr></table>

  <p style="margin:0;font-size:13px;color:#64748b;">Help: <a href="mailto:ideas@theweb3alliance.org" style="color:#1a7a3c;">ideas@theweb3alliance.org</a></p>
</td></tr>

<!-- FOOTER -->
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

  const { full_name, email, id_number, admission_token, admission_link, log_id } = body

  if (!full_name || !email || !id_number) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'full_name, email, id_number required' }) }
  }

  const finalLink = admission_link || (admission_token ? `${APP_URL}/admit/${admission_token}` : `${APP_URL}/dashboard`)

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: `IDEAS-TVET Programme <${FROM_EMAIL}>`,
        to: [email],
        subject: `🎓 Congratulations ${full_name} — Your IDEAS-TVET Admission Offer`,
        html: buildHTML({ full_name, id_number, admission_link: finalLink, email }),
      }),
    })

    const result = await res.json()
    if (!res.ok) {
      await updateLog(log_id, 'failed')
      return { statusCode: res.status, headers: CORS, body: JSON.stringify({ error: result.message || 'Resend error' }) }
    }

    await updateLog(log_id, 'sent')
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, id: result.id }) }
  } catch (err) {
    await updateLog(log_id, 'failed')
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) }
  }
}
