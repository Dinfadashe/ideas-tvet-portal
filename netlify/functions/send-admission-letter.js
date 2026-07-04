// netlify/functions/send-admission-letter.js
// Sends branded admission offer email via Resend
// Called from: src/lib/email.js → sendAdmissionLetter()

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@theweb3alliance.org'
const APP_URL = process.env.VITE_APP_URL || 'https://ideas.theweb3alliance.org'
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

async function updateEmailLog(logId, status) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !logId) return
  await fetch(`${SUPABASE_URL}/rest/v1/email_logs?id=eq.${logId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ status, sent_at: status === 'sent' ? new Date().toISOString() : null }),
  })
}

function buildHTML({ full_name, id_number, admission_link, email }) {
  const LOGO = `${APP_URL}/logo.png`
  const telegramLink = 'https://t.me/+pORFwMgPhCMyZmRk'

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Admission Offer — IDEAS-TVET</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);max-width:600px;width:100%;">

      <!-- HEADER -->
      <tr><td style="background:linear-gradient(135deg,#0a2e14 0%,#1a7a3c 100%);padding:28px 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <img src="${LOGO}" alt="Web3.0 Alliance Ltd" style="height:48px;width:auto;display:block;margin-bottom:8px;" />
              <div style="color:#ffffff;font-size:18px;font-weight:bold;">WEB3.0 ALLIANCE LIMITED</div>
              <div style="color:rgba(255,255,255,0.7);font-size:12px;margin-top:2px;">IDEAS-TVET Programme — Plateau State</div>
            </td>
            <td align="right" valign="top">
              <div style="background:rgba(200,168,42,0.3);border-radius:8px;padding:6px 12px;display:inline-block;">
                <div style="color:#c8a82a;font-size:11px;font-weight:bold;letter-spacing:1px;">ADMISSION OFFER</div>
              </div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- GOLD STRIPE -->
      <tr><td style="height:4px;background:linear-gradient(90deg,#c8a82a,#1a7a3c);"></td></tr>

      <!-- BODY -->
      <tr><td style="padding:36px 40px 24px;">
        <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Congratulations!</p>
        <h1 style="margin:0 0 20px;font-size:24px;font-weight:bold;color:#0a2e14;line-height:1.3;">You Have Been Admitted</h1>

        <p style="margin:0 0 14px;font-size:15px;color:#334155;line-height:1.7;">Dear <strong>${full_name}</strong>,</p>
        <p style="margin:0 0 14px;font-size:15px;color:#334155;line-height:1.7;">
          We are delighted to inform you that you have been selected for admission into the
          <strong>IDEAS-TVET Computer Hardware &amp; Cellphone Repairs Training Programme</strong>,
          funded by the <strong>World Bank</strong> and implemented by Web3.0 Alliance Limited
          in partnership with the Federal Ministry of Education.
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.7;">
          This programme is <strong>completely FREE</strong> of charge.
        </p>

        <!-- ID BOX -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:28px;">
          <tr><td style="padding:18px 22px;">
            <div style="font-size:11px;color:#16a34a;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Your Trainee ID Number</div>
            <div style="font-size:26px;font-weight:bold;color:#0a2e14;letter-spacing:2px;">${id_number}</div>
            <div style="font-size:11px;color:#64748b;margin-top:4px;">Keep this ID for all official correspondence</div>
          </td></tr>
        </table>

        <!-- STEPS -->
        <p style="margin:0 0 14px;font-size:15px;font-weight:bold;color:#0a2e14;">Next Steps:</p>

        <!-- Step 1 -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
          <tr>
            <td width="40" valign="top">
              <div style="width:30px;height:30px;background:#1a7a3c;border-radius:50%;color:#fff;font-weight:bold;font-size:13px;text-align:center;line-height:30px;">1</div>
            </td>
            <td valign="top" style="padding-left:12px;">
              <div style="font-weight:bold;color:#0a2e14;font-size:14px;margin-bottom:3px;">Accept Your Admission</div>
              <div style="color:#64748b;font-size:13px;line-height:1.6;">Click the button below — this link is unique to you, do not share it.</div>
            </td>
          </tr>
        </table>

        <!-- Step 2 -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
          <tr>
            <td width="40" valign="top">
              <div style="width:30px;height:30px;background:#1a7a3c;border-radius:50%;color:#fff;font-weight:bold;font-size:13px;text-align:center;line-height:30px;">2</div>
            </td>
            <td valign="top" style="padding-left:12px;">
              <div style="font-weight:bold;color:#0a2e14;font-size:14px;margin-bottom:3px;">Log In &amp; Complete Your Profile</div>
              <div style="color:#64748b;font-size:13px;line-height:1.6;">
                Visit <a href="${APP_URL}" style="color:#1a7a3c;">ideas.theweb3alliance.org</a>
                &nbsp;·&nbsp; Email: ${email} &nbsp;·&nbsp; Default password: <strong>pass</strong>
              </div>
            </td>
          </tr>
        </table>

        <!-- Step 3 -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px;">
          <tr>
            <td width="40" valign="top">
              <div style="width:30px;height:30px;background:#1a7a3c;border-radius:50%;color:#fff;font-weight:bold;font-size:13px;text-align:center;line-height:30px;">3</div>
            </td>
            <td valign="top" style="padding-left:12px;">
              <div style="font-weight:bold;color:#0a2e14;font-size:14px;margin-bottom:3px;">Join the Private Classroom</div>
              <div style="color:#64748b;font-size:13px;line-height:1.6;">
                Join your private Telegram classroom to connect with instructors and classmates:
                <a href="${telegramLink}" style="color:#1a7a3c;font-weight:bold;">${telegramLink}</a>
              </div>
            </td>
          </tr>
        </table>

        <!-- CTA BUTTON -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr><td align="center">
            <a href="${admission_link}" style="display:inline-block;background:linear-gradient(135deg,#0a2e14,#1a7a3c);color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:16px 40px;border-radius:10px;letter-spacing:0.5px;">
              ✅ Accept My Admission Now
            </a>
          </td></tr>
        </table>

        <!-- WARNING -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbea;border:1px solid #fde68a;border-radius:8px;margin-bottom:22px;">
          <tr><td style="padding:14px 18px;">
            <div style="color:#92400e;font-size:13px;line-height:1.6;">
              ⚠️ <strong>Important:</strong> This offer must be accepted within <strong>24 hours</strong>. 
              Failure to accept will result in your slot being reallocated to another qualified applicant.
            </div>
          </td></tr>
        </table>

        <p style="margin:0;font-size:13px;color:#64748b;line-height:1.7;">
          Need help? Contact us at <a href="mailto:ideas@theweb3alliance.org" style="color:#1a7a3c;">ideas@theweb3alliance.org</a>
        </p>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background:linear-gradient(135deg,#0a2e14,#1a7a3c);padding:22px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div style="color:rgba(255,255,255,0.9);font-size:13px;font-weight:bold;">Web3.0 Alliance Limited</div>
              <div style="color:rgba(255,255,255,0.6);font-size:11px;margin-top:2px;">IDEAS-TVET Initiative · Plateau State Polytechnic, Jos</div>
              <div style="color:rgba(255,255,255,0.6);font-size:11px;margin-top:2px;">ideas@theweb3alliance.org · ideas.theweb3alliance.org</div>
            </td>
            <td align="right">
              <div style="color:rgba(255,255,255,0.4);font-size:10px;">World Bank Funded<br/>Federal Ministry of Education</div>
            </td>
          </tr>
        </table>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }
  if (!RESEND_API_KEY) {
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'RESEND_API_KEY not configured' }) }
  }

  let body
  try { body = JSON.parse(event.body) }
  catch { return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  // Support both call signatures:
  // 1. Direct: { full_name, email, id_number, admission_token, log_id }
  // 2. Via email.js: { full_name, email, id_number, admission_link, log_id }
  const { full_name, email, id_number, admission_token, admission_link, log_id } = body

  if (!full_name || !email || !id_number) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'full_name, email, and id_number are required' }),
    }
  }

  const finalAdmissionLink = admission_link || (admission_token
    ? `${APP_URL}/admit/${admission_token}`
    : `${APP_URL}/dashboard`)

  try {
    const html = buildHTML({ full_name, id_number, admission_link: finalAdmissionLink, email })

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `IDEAS-TVET Programme <${FROM_EMAIL}>`,
        to: [email],
        subject: `🎓 Congratulations ${full_name} — Your IDEAS-TVET Admission Offer`,
        html,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      await updateEmailLog(log_id, 'failed')
      return {
        statusCode: res.status,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: result.message || 'Resend error', detail: result }),
      }
    }

    await updateEmailLog(log_id, 'sent')
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: true, id: result.id }),
    }
  } catch (err) {
    console.error('send-admission-letter error:', err)
    await updateEmailLog(log_id, 'failed')
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
