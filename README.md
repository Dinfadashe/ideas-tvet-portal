# IDEAS-TVET Portal — Web3.0 Alliance Ltd

Student admission & internship management portal for the IDEAS-TVET Computer Hardware & Cellphone Repairs Training Program.

---

## Tech Stack
- **Frontend:** React 18 + Vite
- **Backend/DB:** Supabase (Auth + PostgreSQL + Storage)
- **Deployment:** Netlify
- **PDF Generation:** jsPDF (client-side)
- **Styling:** Pure CSS with CSS variables (no framework)

---

## Features

### Student Portal
- Accept admission via unique secure link (auto-generated per student)
- First-login password change (mandatory)
- One-time profile update (locked after submission)
- 3-month weekday logbook (activated when admin marks as Intern)
- Download internship letter (PDF, auto-generated)
- Upload acceptance letter

### Admin Portal
- Dashboard with live stats
- Bulk import students via CSV (auto-creates accounts with temp passwords)
- View & manage individual student profiles
- Change student status (pending → admitted → active → intern → graduated)
- Marking as Intern auto-generates logbook & notifies student
- Copy admission links per student
- View intern logbook progress

---

## Setup Instructions

### 1. Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of `supabase-schema.sql`
3. Go to **Storage** → create two buckets:
   - `acceptance-letters` (set to **Private**)
   - `documents` (set to **Private**)
4. Get your **Project URL** and **anon public key** from Settings → API

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=https://ideas.theweb3alliance.org
```

### 3. Create Admin Account

1. In Supabase → Auth → Users → **Add User** (use your admin email & a strong password)
2. Then in SQL Editor run:
   ```sql
   UPDATE public.profiles
   SET role = 'admin', status = 'active', password_changed = true
   WHERE email = 'your-admin@email.com';
   ```
   *(If no profile row appears yet, sign in once through the portal first, then run the update.)*

### 4. Local Development

```bash
npm install
npm run dev
```

### 5. Deploy to Netlify

1. Push this repo to GitHub
2. In Netlify: **New site from Git** → select your repo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables in Netlify → Site Settings → Environment Variables

---

## Student Import Workflow

1. Go to **Admin → Import Students**
2. Download the CSV template
3. Fill in student data (full_name, email, phone required; gender, state_of_origin, lga optional)
4. Upload the filled CSV
5. Click **Import**
6. **Download the Results CSV** — it contains each student's:
   - Temporary password
   - Unique admission link (`https://ideas.theweb3alliance.org/admit/<token>`)
7. Send each student their admission link and temporary password via email

---

## Email Sending (Production)

The portal logs all emails to `email_logs` table with status `pending`. To actually send emails:

**Option A — Supabase Edge Function (recommended):**
- Create a Supabase Edge Function that watches the `email_logs` table
- Use [Resend](https://resend.com), [SendGrid](https://sendgrid.com), or similar to dispatch

**Option B — Manual:**
- Export the results CSV after import
- Use your email client or bulk mail tool to send credentials

---

## Internship & Logbook Flow

1. Admin navigates to a student's detail page
2. Changes status to **Intern** and saves
3. System automatically:
   - Sets `internship_started_at` to today
   - Runs `generate_logbook_schedule()` to create all weekday entries for 3 months
   - Creates an in-portal notification for the student
4. Student logs in → Logbook page shows all entries
5. Student fills entries day by day
6. Admin can review progress from **Admin → Logbooks**

---

## Folder Structure

```
src/
├── components/
│   ├── admin/AdminLayout.jsx
│   └── student/StudentLayout.jsx
├── hooks/
│   └── useAuth.jsx        # Auth context & helpers
├── lib/
│   └── supabase.js        # Supabase client
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   ├── ChangePasswordPage.jsx
│   │   ├── ResetPasswordPage.jsx
│   │   └── AcceptAdmissionPage.jsx
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminStudents.jsx
│   │   ├── AdminStudentDetail.jsx
│   │   ├── AdminImportStudents.jsx
│   │   └── AdminLogbooks.jsx
│   └── student/
│       ├── StudentDashboard.jsx
│       ├── StudentProfile.jsx
│       ├── StudentLogbook.jsx
│       └── StudentDocuments.jsx
├── App.jsx
├── main.jsx
└── index.css
```

---

## Supabase RLS Notes

All tables use Row Level Security (RLS):
- Students can only read/write their own data
- Admins (role = 'admin') can read/write all data
- The `generate_logbook_schedule` function is `SECURITY DEFINER` so it bypasses RLS

---

## Support
Email: official@theweb3alliance.org  
Contract: IDEAS-TVET2/NPCU/PLATEAU/05.26/304
