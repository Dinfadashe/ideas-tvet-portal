// netlify/functions/accept-admission.js
// Accepts admission server-side using service role key to bypass RLS

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' }

  let token, action
  try {
    const body = JSON.parse(event.body)
    token = body.token
    action = body.action || 'accept'
    if (!token) throw new Error('Token is required')
  } catch (err) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: err.message }) }
  }

  // Look up student by token
  const lookupRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?admission_token=eq.${token}&select=id,full_name,email,admission_accepted`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    }
  )
  const students = await lookupRes.json()

  if (!Array.isArray(students) || students.length === 0) {
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid admission token' }),
    }
  }

  const student = students[0]

  // If just verifying, return student info
  if (action === 'verify') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        already_accepted: student.admission_accepted,
        student: { full_name: student.full_name, email: student.email },
      }),
    }
  }

  // Update admission status
  const updateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${student.id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        admission_accepted: true,
        admission_accepted_at: new Date().toISOString(),
        status: 'admitted',
      }),
    }
  )

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}))
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message || 'Failed to update admission status' }),
    }
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      student: { full_name: student.full_name, email: student.email },
    }),
  }
}
