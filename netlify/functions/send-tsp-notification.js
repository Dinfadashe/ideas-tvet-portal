// netlify/functions/send-tsp-notification.js
// Handles all TSP-related emails (approval, rejection, renewal, expiry)

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@theweb3alliance.org'
const APP_URL = process.env.VITE_APP_URL || 'https://ideas.theweb3alliance.org'
const ADMIN_EMAIL = 'dinfadashe@gmail.com'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: `IDEAS-TVET Portal <${FROM_EMAIL}>`, to: [to], subject, html }),
  })
  return res.json()
}

function header(logo) {
  return `
  <div style="background:linear-gradient(135deg,#0a2e14,#1a7a3c);padding:24px 40px;">
    <img src="${logo}" alt="Web3.0 Alliance" style="height:40px;width:auto;display:block;margin-bottom:8px;"/>
    <div style="color:#fff;font-size:17px;font-weight:bold;">WEB3.0 ALLIANCE LIMITED</div>
    <div style="color:rgba(255,255,255,0.6);font-size:11px;">IDEAS-TVET Platform · ideas.theweb3alliance.org</div>
  </div>
  <div style="height:3px;background:linear-gradient(90deg,#c8a82a,#1a7a3c);"></div>`
}

function footer() {
  return `
  <div style="background:#071a0c;padding:18px 40px;margin-top:0;">
    <div style="color:rgba(255,255,255,0.8);font-size:12px;font-weight:bold;">Web3.0 Alliance Limited</div>
    <div style="color:rgba(255,255,255,0.5);font-size:11px;">official@theweb3alliance.org · ideas.theweb3alliance.org</div>
  </div>`
}

const logo = `${APP_URL}/logo.png`

const templates = {
  // Admin notified of new TSP registration
  new_registration: ({ org_name, email }) => ({
    to: ADMIN_EMAIL,
    subject: `🆕 New TSP Registration: ${org_name}`,
    html: `<div style="font-family:Arial,sans-serif;background:#f0f4f8;padding:32px 0;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">
    ${header(logo)}
    <div style="padding:32px 40px;">
      <h2 style="color:#0a2e14;font-size:20px;margin:0 0 16px;">New TSP Registration</h2>
      <p style="color:#334155;font-size:14px;line-height:1.7;margin:0 0 16px;"><strong>${org_name}</strong> (${email}) has submitted a TSP registration and payment receipt for review.</p>
      <a href="${APP_URL}/admin/tsps" style="display:inline-block;background:linear-gradient(135deg,#0a2e14,#1a7a3c);color:#fff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:8px;">Review Registration →</a>
    </div>${footer()}</div></div>`,
  }),

  // TSP approved
  approved: ({ org_name, email, expiry_date }) => ({
    to: email,
    subject: `✅ Your IDEAS-TVET TSP Account is Approved — ${org_name}`,
    html: `<div style="font-family:Arial,sans-serif;background:#f0f4f8;padding:32px 0;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">
    ${header(logo)}
    <div style="padding:32px 40px;">
      <h2 style="color:#0a2e14;font-size:22px;margin:0 0 12px;">Your Account is Approved! 🎉</h2>
      <p style="color:#334155;font-size:14px;line-height:1.7;margin:0 0 20px;">Dear <strong>${org_name}</strong>,<br/><br/>Your payment has been verified and your IDEAS-TVET TSP portal account is now <strong>active</strong>. You can now log in and start managing your trainees.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
        <div style="font-size:11px;color:#16a34a;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Subscription Active Until</div>
        <div style="font-size:22px;font-weight:bold;color:#0a2e14;">${expiry_date}</div>
      </div>
      <a href="${APP_URL}/tsp/dashboard" style="display:inline-block;background:linear-gradient(135deg,#0a2e14,#1a7a3c);color:#fff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:8px;">Go to My Dashboard →</a>
    </div>${footer()}</div></div>`,
  }),

  // TSP rejected
  rejected: ({ org_name, email, reason }) => ({
    to: email,
    subject: `❌ TSP Registration Not Approved — ${org_name}`,
    html: `<div style="font-family:Arial,sans-serif;background:#f0f4f8;padding:32px 0;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">
    ${header(logo)}
    <div style="padding:32px 40px;">
      <h2 style="color:#dc2626;font-size:20px;margin:0 0 12px;">Registration Not Approved</h2>
      <p style="color:#334155;font-size:14px;line-height:1.7;margin:0 0 16px;">Dear <strong>${org_name}</strong>,<br/><br/>Unfortunately your TSP registration could not be approved at this time.</p>
      ${reason ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 18px;margin-bottom:20px;font-size:13px;color:#991b1b;"><strong>Reason:</strong> ${reason}</div>` : ''}
      <p style="color:#64748b;font-size:13px;">Please contact us at <a href="mailto:official@theweb3alliance.org" style="color:#1a7a3c;">official@theweb3alliance.org</a> to resolve this issue and reapply.</p>
    </div>${footer()}</div></div>`,
  }),

  // Admin notified of renewal submission
  renewal_submitted: ({ org_name, email }) => ({
    to: ADMIN_EMAIL,
    subject: `🔄 Renewal Receipt Submitted: ${org_name}`,
    html: `<div style="font-family:Arial,sans-serif;background:#f0f4f8;padding:32px 0;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">
    ${header(logo)}
    <div style="padding:32px 40px;">
      <h2 style="color:#0a2e14;font-size:20px;margin:0 0 16px;">Renewal Receipt Submitted</h2>
      <p style="color:#334155;font-size:14px;line-height:1.7;margin:0 0 16px;"><strong>${org_name}</strong> (${email}) has submitted a renewal receipt for review.</p>
      <a href="${APP_URL}/admin/tsps" style="display:inline-block;background:linear-gradient(135deg,#c8a82a,#e8c84a);color:#0a2e14;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:8px;">Review Renewal →</a>
    </div>${footer()}</div></div>`,
  }),

  // Renewal approved
  renewal_approved: ({ org_name, email, expiry_date }) => ({
    to: email,
    subject: `🔄 Subscription Renewed — ${org_name}`,
    html: `<div style="font-family:Arial,sans-serif;background:#f0f4f8;padding:32px 0;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">
    ${header(logo)}
    <div style="padding:32px 40px;">
      <h2 style="color:#0a2e14;font-size:22px;margin:0 0 12px;">Subscription Renewed! 🎉</h2>
      <p style="color:#334155;font-size:14px;line-height:1.7;margin:0 0 20px;">Dear <strong>${org_name}</strong>,<br/><br/>Your renewal payment has been verified. Your subscription has been extended for another 365 days.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
        <div style="font-size:11px;color:#16a34a;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">New Expiry Date</div>
        <div style="font-size:22px;font-weight:bold;color:#0a2e14;">${expiry_date}</div>
      </div>
      <a href="${APP_URL}/tsp/dashboard" style="display:inline-block;background:linear-gradient(135deg,#0a2e14,#1a7a3c);color:#fff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:8px;">Go to Dashboard →</a>
    </div>${footer()}</div></div>`,
  }),

  // 30-day expiry warning
  expiry_warning: ({ org_name, email, days_left, expiry_date }) => ({
    to: email,
    subject: `⚠️ Your IDEAS-TVET Subscription Expires in ${days_left} Days — ${org_name}`,
    html: `<div style="font-family:Arial,sans-serif;background:#f0f4f8;padding:32px 0;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">
    ${header(logo)}
    <div style="padding:32px 40px;">
      <h2 style="color:#92400e;font-size:20px;margin:0 0 12px;">⚠️ Subscription Expiring Soon</h2>
      <p style="color:#334155;font-size:14px;line-height:1.7;margin:0 0 20px;">Dear <strong>${org_name}</strong>,<br/><br/>Your IDEAS-TVET TSP portal subscription expires on <strong>${expiry_date}</strong> — in <strong>${days_left} days</strong>. Renew now to avoid any interruption.</p>
      <div style="background:linear-gradient(135deg,#0a2e14,#1a7a3c);border-radius:10px;padding:18px 22px;color:#fff;margin-bottom:24px;">
        <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:4px;">Pay ₦50,000 to</div>
        <div style="font-size:18px;font-weight:bold;">Web3.0 Alliance Ltd</div>
        <div style="font-size:22px;font-weight:bold;color:#c8a82a;letter-spacing:2px;margin:4px 0;">1027821555</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.6);">UBA</div>
      </div>
      <a href="${APP_URL}/tsp/renew" style="display:inline-block;background:linear-gradient(135deg,#c8a82a,#e8c84a);color:#0a2e14;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:8px;">Renew Now →</a>
    </div>${footer()}</div></div>`,
  }),
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  if (!RESEND_API_KEY) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'RESEND_API_KEY not set' }) }

  let body
  try { body = JSON.parse(event.body) }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  const { type, ...data } = body
  const template = templates[type]
  if (!template) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: `Unknown notification type: ${type}` }) }

  try {
    const { to, subject, html } = template(data)
    const result = await sendEmail(to, subject, html)
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, id: result.id }) }
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) }
  }
}
