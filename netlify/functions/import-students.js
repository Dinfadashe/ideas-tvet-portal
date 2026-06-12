// netlify/functions/import-students.js
// Server-side bulk student import using Supabase Admin API
// Processes all students in one function call with parallel batching

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.VITE_APP_URL || 'https://ideas.theweb3alliance.org'

const FUNCTION_VERSION = 'v4-crlf-fix'

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

async function createAuthUser(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.msg || `Auth failed (${res.status})`)
  return data
}

async function insertProfile(profile) {
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
    throw new Error(err.message || err.details || `Profile insert failed (${res.status})`)
  }
}

async function getIdNumber(userId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=id_number`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  )
  const data = await res.json()
  return data?.[0]?.id_number || null
}

async function emailExists(email) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  )
  const data = await res.json()
  return Array.isArray(data) && data.length > 0
}

async function processStudent(rawRow) {
  // Strip \r from all keys and values (Windows CSV line endings)
  const row = {}
  for (const [k, v] of Object.entries(rawRow)) {
    row[k.replace(/\r/g, '').trim()] = typeof v === 'string' ? v.replace(/\r/g, '').trim() : v
  }

  const email = (row.email || '').toLowerCase().trim()
  const fullName = (row.full_name || '').trim()

  if (!email) return { success: false, email: '(missing)', reason: 'Email is required' }
  if (!fullName) return { success: false, email, reason: 'Full name is required' }

  try {
    if (await emailExists(email)) {
      return { success: false, email, reason: 'Email already exists' }
    }

    const password = generatePassword()
    const token = crypto.randomUUID()
    const authUser = await createAuthUser(email, password)

    await insertProfile({
      id: authUser.id,
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

    const idNumber = await getIdNumber(authUser.id)
    const admissionLink = `${APP_URL}/admit/${token}`

    return {
      success: true,
      name: fullName,
      email,
      password,
      admissionLink,
      student_id: authUser.id,
      id_number: idNumber,
    }
  } catch (err) {
    return { success: false, email, reason: err.message }
  }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY env var on Netlify' }),
    }
  }

  let rows
  try {
    const body = JSON.parse(event.body)
    rows = body.rows
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('No rows provided')
    // Debug: log first row keys and values to see what's arriving
    console.log('First row received:', JSON.stringify(rows[0]))
    console.log('Row keys:', Object.keys(rows[0]))
  } catch (err) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: err.message }) }
  }

  // Process in parallel batches of 5 to stay within timeout
  const BATCH_SIZE = 5
  const ok = []
  const fail = []

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(batch.map(processStudent))
    for (const r of results) {
      if (r.success) ok.push(r)
      else fail.push(r)
    }
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ ok, fail, version: FUNCTION_VERSION }),
  }
}
