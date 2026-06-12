// netlify/functions/import-students.js v6
// Fix: Supabase auto-creates a blank profile on auth.signUp via handle_new_user trigger
// Solution: Use UPDATE after insert to set full_name, or pass metadata to auth

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

function cleanStr(val) {
  if (!val) return ''
  return String(val).replace(/\r/g, '').replace(/\n/g, '').trim()
}

async function createAuthUser(email, password, fullName) {
  // Pass full_name in user_metadata so handle_new_user trigger can use it
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
      email_confirm: true,
      user_metadata: { full_name: fullName },
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.msg || `Auth failed (${res.status})`)
  return data
}

async function upsertProfile(profile) {
  // Use PATCH (update) first in case trigger already created a blank row
  const patchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${profile.id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(profile),
    }
  )

  if (patchRes.ok) return // Update succeeded

  // If no row exists yet, insert
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(profile),
  })

  if (!insertRes.ok) {
    const err = await insertRes.json().catch(() => ({}))
    throw new Error(err.message || err.details || `Profile upsert failed (${insertRes.status})`)
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
  const row = {}
  for (const [k, v] of Object.entries(rawRow)) {
    const cleanKey = cleanStr(k).toLowerCase().replace(/[^a-z0-9_]/g, '')
    row[cleanKey] = cleanStr(v)
  }

  const email = (row.email || '').toLowerCase().trim()
  const fullName = (row.full_name || row.fullname || row.name || '').trim()

  if (!email) return { success: false, email: '(missing)', reason: 'Email is required' }
  if (!fullName) return {
    success: false,
    email,
    reason: `Full name missing. Keys: ${Object.keys(row).join(', ')}`
  }

  try {
    if (await emailExists(email)) {
      return { success: false, email, reason: 'Email already exists' }
    }

    const password = generatePassword()
    const token = crypto.randomUUID()

    // Create auth user WITH full_name in metadata
    const authUser = await createAuthUser(email, password, fullName)
    const userId = authUser.id

    // Wait briefly for any trigger to fire
    await new Promise(r => setTimeout(r, 300))

    // Now upsert the full profile (PATCH first, then INSERT)
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

    const idNumber = await getIdNumber(userId)
    const admissionLink = `${APP_URL}/admit/${token}`

    return {
      success: true,
      name: fullName,
      email,
      password,
      admissionLink,
      student_id: userId,
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
      body: JSON.stringify({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY env var' }),
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

  const BATCH_SIZE = 3
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
    body: JSON.stringify({ ok, fail, version: 'v6' }),
  }
}
