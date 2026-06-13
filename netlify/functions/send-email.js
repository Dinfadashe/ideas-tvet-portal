// netlify/functions/send-email.js
// Handles all transactional emails for IDEAS-TVET Portal via Resend

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@ideas.theweb3alliance.org'
const APP_URL = process.env.VITE_APP_URL || 'https://ideas.theweb3alliance.org'
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// ─── Email Templates ──────────────────────────────────────────────────────────

function admissionEmailHtml({ full_name, admission_link, temp_password, email }) {
  const firstName = full_name?.split(' ')[0] || 'Applicant'
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr><td style="background:#0a1628;padding:28px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="color:white;font-size:18px;font-weight:800;font-family:Arial,sans-serif;letter-spacing:0.5px;">WEB3.0 ALLIANCE LTD</div>
                <div style="color:rgba(255,255,255,0.55);font-size:12px;margin-top:2px;">IDEAS-TVET Initiative</div>
              </td>
              <td align="right">
                <div style="background:#2db84b;color:white;font-size:10px;font-weight:700;padding:4px 12px;border-radius:20px;display:inline-block;">ADMISSION OFFER</div>
              </td>
            </tr>
          </table>
          <div style="height:3px;background:linear-gradient(90deg,#2db84b,#f5a623);margin-top:20px;border-radius:2px;"></div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <h1 style="color:#0a1628;font-size:22px;font-weight:800;margin:0 0 8px;">Congratulations, ${firstName}! 🎉</h1>
          <p style="color:#64748b;font-size:14px;margin:0 0 24px;line-height:1.6;">
            You have been selected for admission into the <strong style="color:#0a1628;">IDEAS-TVET Computer Hardware & Cellphone Repairs Training Program</strong>, 
            funded by the World Bank through the Federal Ministry of Education.
          </p>

          <!-- Program Details Box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <div style="font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">PROGRAM DETAILS</div>
              ${[
                ['Program', 'Computer Hardware & Cellphone Repairs'],
                ['Venue', 'Plateau State Polytechnic, Jos'],
                ['Duration', 'Minimum 6 months'],
                ['Cost', 'FREE (World Bank Funded)'],
              ].map(([l, v]) => `
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                  <tr>
                    <td width="120" style="color:#94a3b8;font-size:13px;">${l}:</td>
                    <td style="color:#1e293b;font-size:13px;font-weight:600;">${v}</td>
                  </tr>
                </table>
              `).join('')}
            </td></tr>
          </table>

          <!-- CTA Button -->
          <div style="text-align:center;margin-bottom:28px;">
            <a href="${admission_link}" style="display:inline-block;background:#2db84b;color:white;text-decoration:none;padding:14px 40px;border-radius:10px;font-size:15px;font-weight:700;font-family:Arial,sans-serif;">
              ✓ Accept Your Admission Offer
            </a>
            <p style="color:#94a3b8;font-size:12px;margin-top:10px;">Button not working? Copy and paste this link:<br>
              <a href="${admission_link}" style="color:#2db84b;font-size:11px;word-break:break-all;">${admission_link}</a>
            </p>
          </div>

          <!-- Login Credentials -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <div style="font-size:11px;color:#92400e;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">⚠️ YOUR LOGIN CREDENTIALS — KEEP PRIVATE</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="130" style="color:#92400e;font-size:13px;">Email:</td>
                  <td style="color:#1e293b;font-size:13px;font-weight:700;font-family:monospace;">${email}</td>
                </tr>
                <tr><td colspan="2" style="height:6px;"></td></tr>
                <tr>
                  <td style="color:#92400e;font-size:13px;">Temp Password:</td>
                  <td style="color:#1e293b;font-size:13px;font-weight:700;font-family:monospace;">${temp_password}</td>
                </tr>
              </table>
              <div style="margin-top:12px;font-size:12px;color:#92400e;">You will be required to change this password on first login.</div>
            </td></tr>
          </table>

          <!-- Steps -->
          <div style="margin-bottom:8px;">
            <div style="font-size:13px;font-weight:700;color:#0a1628;margin-bottom:12px;">Next Steps:</div>
            ${[
              'Click the button above to accept your admission offer',
              'Log in using the credentials provided',
              'Change your password (mandatory on first login)',
              'Complete your profile with personal and banking details',
              'Await further instructions from your program coordinator',
            ].map((s, i) => `
              <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;">
                <div style="min-width:22px;height:22px;background:#0a1628;color:white;border-radius:50%;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px;">${i+1}</div>
                <div style="font-size:13px;color:#475569;line-height:1.5;">${s}</div>
              </div>
            `).join('')}
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0a1628;padding:24px 40px;text-align:center;">
          <div style="color:rgba(255,255,255,0.5);font-size:12px;line-height:1.8;">
            Web3.0 Alliance Limited | IDEAS-TVET Initiative<br>
            131 Angwan Dabba Bukuru, Jos, Plateau State<br>
            <a href="mailto:ideas@theweb3alliance.org" style="color:#2db84b;text-decoration:none;">ideas@theweb3alliance.org</a> | 
            <a href="${APP_URL}" style="color:#2db84b;text-decoration:none;">ideas.theweb3alliance.org</a>
          </div>
          <div style="margin-top:12px;font-size:11px;color:rgba(255,255,255,0.25);">
            Contract: IDEAS-TVET2/NPCU/PLATEAU/05.26/304
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function internshipEmailHtml({ full_name, start_date, end_date, portal_url }) {
  const firstName = full_name?.split(' ')[0] || 'Trainee'
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr><td style="background:#0a1628;padding:28px 40px;">
          <div style="color:white;font-size:18px;font-weight:800;font-family:Arial,sans-serif;">WEB3.0 ALLIANCE LTD</div>
          <div style="color:rgba(255,255,255,0.55);font-size:12px;margin-top:2px;">IDEAS-TVET Initiative</div>
          <div style="height:3px;background:linear-gradient(90deg,#f5a623,#2db84b);margin-top:20px;border-radius:2px;"></div>
        </td></tr>

        <tr><td style="padding:36px 40px;">
          <div style="text-align:center;margin-bottom:28px;">
            <div style="font-size:40px;margin-bottom:12px;">🎓</div>
            <h1 style="color:#0a1628;font-size:22px;font-weight:800;margin:0 0 8px;">Internship Placement Notice</h1>
            <p style="color:#64748b;font-size:14px;margin:0;">Congratulations ${firstName}, your internship has been activated!</p>
          </div>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <div style="font-size:11px;color:#92400e;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">INTERNSHIP DETAILS</div>
              ${[
                ['Start Date', start_date],
                ['End Date', end_date],
                ['Duration', '3 Months'],
                ['Type', 'Practical / Industrial'],
              ].map(([l, v]) => `
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
                  <tr>
                    <td width="120" style="color:#92400e;font-size:13px;">${l}:</td>
                    <td style="color:#1e293b;font-size:13px;font-weight:700;">${v}</td>
                  </tr>
                </table>
              `).join('')}
            </td></tr>
          </table>

          <p style="color:#475569;font-size:14px;line-height:1.7;margin-bottom:24px;">
            Your 3-month internship logbook is now active on your student portal. 
            You are required to fill in your logbook entries <strong>daily (weekdays only)</strong> throughout the internship period.
            Your internship letter is also available for download from the Documents section.
          </p>

          <div style="text-align:center;margin-bottom:28px;">
            <a href="${portal_url}" style="display:inline-block;background:#f5a623;color:white;text-decoration:none;padding:14px 40px;border-radius:10px;font-size:15px;font-weight:700;">
              Open My Logbook →
            </a>
          </div>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;">
            <tr><td style="padding:16px 20px;">
              <div style="font-size:13px;color:#15803d;line-height:1.7;">
                <strong>Important reminders:</strong><br>
                • Fill your logbook entry every working day<br>
                • Download and present your internship letter to your host organisation<br>
                • Contact your coordinator for any issues: <a href="mailto:ideas@theweb3alliance.org" style="color:#15803d;">ideas@theweb3alliance.org</a>
              </div>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0a1628;padding:24px 40px;text-align:center;">
          <div style="color:rgba(255,255,255,0.5);font-size:12px;line-height:1.8;">
            Web3.0 Alliance Limited | IDEAS-TVET Initiative<br>
            <a href="mailto:ideas@theweb3alliance.org" style="color:#2db84b;text-decoration:none;">ideas@theweb3alliance.org</a>
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Supabase helper (update email_log status) ───────────────────────────────

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

// ─── Main Handler ─────────────────────────────────────────────────────────────

export const handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  if (!RESEND_API_KEY) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
    }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) }
  }

  const { type, data, log_id } = body

  let emailPayload = null

  try {
    if (type === 'admission') {
      // data: { full_name, email, admission_link, temp_password }
      emailPayload = {
        from: `IDEAS-TVET Portal <${FROM_EMAIL}>`,
        to: [data.email],
        subject: '🎓 Your IDEAS-TVET Admission Offer — Web3.0 Alliance Ltd',
        html: admissionEmailHtml(data),
      }
    } else if (type === 'internship_started') {
      // data: { full_name, email, start_date, end_date }
      emailPayload = {
        from: `IDEAS-TVET Portal <${FROM_EMAIL}>`,
        to: [data.email],
        subject: '📋 Your Internship Has Been Activated — IDEAS-TVET Portal',
        html: internshipEmailHtml({ ...data, portal_url: `${APP_URL}/dashboard/logbook` }),
      }
    } else {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `Unknown email type: ${type}` }),
      }
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    })

    const result = await res.json()

    if (!res.ok) {
      await updateEmailLog(log_id, 'failed')
      return {
        statusCode: res.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: result.message || 'Resend API error', detail: result }),
      }
    }

    await updateEmailLog(log_id, 'sent')

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, id: result.id }),
    }
  } catch (err) {
    await updateEmailLog(log_id, 'failed')
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
