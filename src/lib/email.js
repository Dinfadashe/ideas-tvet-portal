// src/lib/email.js
// Calls the Netlify send-email function from the frontend
// All email sending goes through here — never call Resend directly from the browser

import { supabase } from './supabase'

const FUNCTION_URL = '/.netlify/functions/send-email'

/**
 * Send an admission offer email to a newly imported student.
 * @param {{ full_name: string, email: string, admission_link: string, temp_password: string, student_id?: string }} params
 */
export async function sendAdmissionEmail({ full_name, email, admission_link, temp_password, student_id }) {
  // Log the email attempt in Supabase first
  const { data: log } = await supabase
    .from('email_logs')
    .insert({
      student_id: student_id || null,
      email_to: email,
      subject: 'Your IDEAS-TVET Admission Offer',
      status: 'pending',
    })
    .select('id')
    .single()

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'admission',
      log_id: log?.id,
      data: { full_name, email, admission_link, temp_password },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Email send failed (${res.status})`)
  }

  return res.json()
}

/**
 * Send an internship activation email when admin marks student as intern.
 * @param {{ full_name: string, email: string, student_id: string, internship_started_at: string }} params
 */
export async function sendInternshipEmail({ full_name, email, student_id, internship_started_at }) {
  const startDate = new Date(internship_started_at)
  const endDate = new Date(internship_started_at)
  endDate.setMonth(endDate.getMonth() + 3)

  const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const { data: log } = await supabase
    .from('email_logs')
    .insert({
      student_id,
      email_to: email,
      subject: 'Your Internship Has Been Activated',
      status: 'pending',
    })
    .select('id')
    .single()

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'internship_started',
      log_id: log?.id,
      data: {
        full_name,
        email,
        start_date: fmt(startDate),
        end_date: fmt(endDate),
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Email send failed (${res.status})`)
  }

  return res.json()
}

/**
 * Send the official admission letter email to a student.
 * @param {{ full_name: string, email: string, id_number: string, student_id: string }} params
 */
export async function sendAdmissionLetter({ full_name, email, id_number, student_id }) {
  const { data: log } = await supabase
    .from('email_logs')
    .insert({
      student_id: student_id || null,
      email_to: email,
      subject: `${id_number} — Your IDEAS-TVET Admission Letter`,
      status: 'pending',
    })
    .select('id')
    .single()

  const res = await fetch('/.netlify/functions/send-admission-letter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name,
      email,
      id_number,
      log_id: log?.id,
      issued_date: new Date().toISOString(),
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Admission letter send failed (${res.status})`)
  }

  return res.json()
}