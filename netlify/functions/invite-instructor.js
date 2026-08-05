// netlify/functions/invite-instructor.js
// Creates instructor account with default password 'pass' and sends invite email

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@theweb3alliance.org'
const APP_URL = process.env.VITE_APP_URL || 'https://ideas.theweb3alliance.org'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

async function supabaseAdmin(path, method, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

async function createAuthUser(email, full_name) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({
      email,
      password: 'pass',
      email_confirm: true,
      user_metadata: { full_name, role: 'instructor' },
    }),
  })
  return res.json()
}

function buildHTML({ full_name, email }) {
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
  <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">You're Invited!</p>
  <h1 style="margin:0 0 20px;font-size:24px;font-weight:bold;color:#0a2e14;">Welcome, ${full_name}!</h1>
  <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">You have been invited to join the <strong>IDEAS-TVET Portal</strong> as an <strong>Instructor</strong>. Your role is to supervise assigned trainees during their internship and submit monthly performance reviews.</p>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:28px;">
  <tr><td style="padding:20px 24px;">
    <div style="font-size:11px;color:#16a34a;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:14px;">Your Login Credentials</div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="font-size:13px;color:#64748b;padding-bottom:8px;width:120px;">Portal URL</td>
          <td style="font-size:13px;font-weight:600;padding-bottom:8px;"><a href="${APP_URL}" style="color:#1a7a3c;">${APP_URL}</a></td></tr>
      <tr><td style="font-size:13px;color:#64748b;padding-bottom:8px;">Email</td>
          <td style="font-size:13px;font-weight:600;padding-bottom:8px;color:#0a2e14;">${email}</td></tr>
      <tr><td style="font-size:13px;color:#64748b;">Password</td>
          <td style="font-size:18px;font-weight:900;letter-spacing:3px;color:#0a2e14;">pass</td></tr>
    </table>
  </td></tr></table>

  <p style="margin:0 0 14px;font-size:15px;font-weight:bold;color:#0a2e14;">Getting Started:</p>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
  <tr><td width="36" valign="top"><div style="width:28px;height:28px;background:#1a7a3c;border-radius:50%;color:#fff;font-weight:bold;font-size:13px;text-align:center;line-height:28px;">1</div></td>
  <td valign="top" style="padding-left:12px;"><div style="font-weight:bold;color:#0a2e14;font-size:14px;margin-bottom:2px;">Log In to the Portal</div>
  <div style="color:#64748b;font-size:13px;">Visit <a href="${APP_URL}" style="color:#1a7a3c;">${APP_URL}</a> and log in with your email and password <strong>pass</strong>.</div></td></tr></table>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
  <tr><td width="36" valign="top"><div style="width:28px;height:28px;background:#1a7a3c;border-radius:50%;color:#fff;font-weight:bold;font-size:13px;text-align:center;line-height:28px;">2</div></td>
  <td valign="top" style="padding-left:12px;"><div style="font-weight:bold;color:#0a2e14;font-size:14px;margin-bottom:2px;">Set a New Password</div>
  <div style="color:#64748b;font-size:13px;">You will be asked to change your password on first login.</div></td></tr></table>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
  <tr><td width="36" valign="top"><div style="width:28px;height:28px;background:#1a7a3c;border-radius:50%;color:#fff;font-weight:bold;font-size:13px;text-align:center;line-height:28px;">3</div></td>
  <td valign="top" style="padding-left:12px;"><div style="font-weight:bold;color:#0a2e14;font-size:14px;margin-bottom:2px;">Complete Profile & Access Dashboard</div>
  <div style="color:#64748b;font-size:13px;">Fill your profile details then access your instructor dashboard to view assigned trainees and submit monthly reviews.</div></td></tr></table>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
  <tr><td align="center">
    <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#0a2e14,#1a7a3c);color:#fff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 36px;border-radius:10px;">🏫 Access Instructor Portal</a>
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

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method Not Allowed' }) }

  let body
  try { body = JSON.parse(event.body) }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  const { full_name, email, phone } = body
  if (!full_name || !email) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'full_name and email required' }) }

  const cleanEmail = email.toLowerCase().trim()

  try {
    // 1. Create auth user with password 'pass' via Admin API
    const authUser = await createAuthUser(cleanEmail, full_name)
    if (authUser.error) throw new Error(authUser.error.message || authUser.msg || 'Failed to create auth user')

    const userId = authUser.id
    if (!userId) throw new Error('No user ID returned from auth creation')

    // 2. Update profile: set role=instructor, phone, password_changed=false
    await supabaseAdmin(
      `profiles?id=eq.${userId}`,
      'PATCH',
      {
        full_name,
        role: 'instructor',
        phone: phone || null,
        password_changed: false,
        profile_updated: false,
      }
    )

    // 3. Send invite email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `IDEAS-TVET Portal <${FROM_EMAIL}>`,
        to: [cleanEmail],
        subject: `🏫 You're Invited as an Instructor — IDEAS-TVET Portal`,
        html: buildHTML({ full_name, email: cleanEmail }),
      }),
    })

    const emailResult = await emailRes.json()
    if (!emailRes.ok) {
      // Account created but email failed — still return success with warning
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({
          success: true,
          warning: `Account created but email failed: ${emailResult.message}`,
          user_id: userId,
        }),
      }
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ success: true, user_id: userId, email_id: emailResult.id }),
    }

  } catch (err) {
    console.error('invite-instructor error:', err)
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
