// netlify/functions/import-students.js
// Handles bulk student creation server-side using service role key
// This bypasses RLS and can create auth users + profiles safely

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.VITE_APP_URL || 'https://ideas.theweb3alliance.org'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return 'IDEA$' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// Supabase Admin API helpers
async function createAuthUser(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true, // skip confirmation email from Supabase
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.msg || `Auth user creation failed: ${res.status}`)
  return data
}

async function upsertProfile(profile) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(profile),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || err.details || `Profile insert failed: ${res.status}`)
  }
}

async function checkEmailExists(email) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    }
  )
  const data = await res.json()
  return Array.isArray(data) && data.length > 0
}

async function logEmail(studentId, email, subject) {
  await fetch(`${SUPABASE_URL}/rest/v1/email_logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      student_id: studentId || null,
      email_to: email,
      subject,
      status: 'pending',
    }),
  })
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Server configuration missing. Check SUPABASE_SERVICE_ROLE_KEY env var.' }),
    }
  }

  let rows
  try {
    const body = JSON.parse(event.body)
    rows = body.rows
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('No rows provided')
  } catch (err) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: err.message }) }
  }

  const ok = []
  const fail = []

  for (const row of rows) {
    const email = row.email?.toLowerCase().trim()
    const fullName = row.full_name?.trim()

    if (!email) { fail.push({ email: '(missing)', reason: 'Email is required' }); continue }
    if (!fullName) { fail.push({ email, reason: 'Full name is required' }); continue }

    try {
      // Check duplicate
      const exists = await checkEmailExists(email)
      if (exists) { fail.push({ email, reason: 'Email already exists' }); continue }

      const password = generatePassword()
      const token = crypto.randomUUID()

      // Create auth user via Admin API (no email confirmation needed)
      const authUser = await createAuthUser(email, password)
      const userId = authUser.id

      // Insert profile (trigger will auto-assign id_number)
      await upsertProfile({
        id: userId,
        email,
        full_name: fullName,
        phone: row.phone || null,
        gender: row.gender || null,
        state_of_origin: row.state_of_origin || null,
        lga: row.lga || null,
        role: 'student',
        status: 'pending',
        admission_token: token,
        profile_updated: false,
        password_changed: false,
      })

      // Fetch the assigned id_number back
      const profileRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=id_number`,
        {
          headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
        }
      )
      const profileData = await profileRes.json()
      const idNumber = profileData?.[0]?.id_number || null

      const admissionLink = `${APP_URL}/admit/${token}`

      await logEmail(userId, email, 'Your IDEAS-TVET Admission Offer')

      ok.push({ name: fullName, email, password, admissionLink, student_id: userId, id_number: idNumber })

    } catch (err) {
      fail.push({ email, reason: err.message })
    }
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ ok, fail }),
  }
}