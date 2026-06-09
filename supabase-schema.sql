-- IDEAS-TVET Portal: Complete Supabase Schema
-- Run this in your Supabase SQL Editor

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ============================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text not null,
  phone text,
  gender text check (gender in ('Male', 'Female', 'Other')),
  date_of_birth date,
  state_of_origin text,
  lga text,
  address text,
  nin text,
  bvn text,
  bank_name text,
  account_number text,
  next_of_kin_name text,
  next_of_kin_phone text,
  next_of_kin_relationship text,
  profile_updated boolean default false,
  password_changed boolean default false,
  role text not null default 'student' check (role in ('student', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'admitted', 'active', 'intern', 'graduated', 'inactive')),
  admission_token text unique,
  admission_accepted boolean default false,
  admission_accepted_at timestamptz,
  internship_started_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- LOGBOOK TABLE
-- ============================================================
create table public.logbook_entries (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  entry_date date not null,
  week_number integer not null,
  day_of_week text not null,
  arrival_time text,
  departure_time text,
  activities_performed text not null,
  skills_acquired text,
  challenges text,
  supervisor_comment text,
  is_submitted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(student_id, entry_date)
);

-- ============================================================
-- DOCUMENTS TABLE (acceptance letter uploads)
-- ============================================================
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  document_type text not null check (document_type in ('acceptance_letter', 'other')),
  file_name text not null,
  file_url text not null,
  file_size integer,
  uploaded_at timestamptz default now()
);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- EMAIL LOGS TABLE
-- ============================================================
create table public.email_logs (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete set null,
  email_to text not null,
  subject text not null,
  status text default 'pending' check (status in ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.logbook_entries enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;
alter table public.email_logs enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can insert profiles"
  on public.profiles for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Logbook policies
create policy "Students can manage own logbook"
  on public.logbook_entries for all
  using (auth.uid() = student_id);

create policy "Admins can view all logbook entries"
  on public.logbook_entries for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Documents policies
create policy "Students can manage own documents"
  on public.documents for all
  using (auth.uid() = student_id);

create policy "Admins can view all documents"
  on public.documents for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Notifications policies
create policy "Students can view own notifications"
  on public.notifications for select
  using (auth.uid() = student_id);

create policy "Students can update own notifications"
  on public.notifications for update
  using (auth.uid() = student_id);

create policy "Admins can manage all notifications"
  on public.notifications for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Email logs policies
create policy "Admins can manage email logs"
  on public.email_logs for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_logbook_updated_at
  before update on public.logbook_entries
  for each row execute procedure public.handle_updated_at();

-- Generate weekday dates for internship logbook (3 months from start date)
create or replace function public.generate_logbook_schedule(
  p_student_id uuid,
  p_start_date date
)
returns void as $$
declare
  v_current_date date := p_start_date;
  v_end_date date := p_start_date + interval '3 months';
  v_week_num integer := 1;
  v_day_name text;
  v_week_start date := p_start_date;
begin
  while v_current_date <= v_end_date loop
    -- Only weekdays (Mon-Fri)
    if extract(dow from v_current_date) between 1 and 5 then
      v_day_name := to_char(v_current_date, 'Day');
      -- Calculate week number
      v_week_num := floor((v_current_date - p_start_date) / 7) + 1;
      
      insert into public.logbook_entries (
        student_id, entry_date, week_number, day_of_week,
        activities_performed, is_submitted
      ) values (
        p_student_id, v_current_date, v_week_num,
        trim(v_day_name), '', false
      )
      on conflict (student_id, entry_date) do nothing;
    end if;
    v_current_date := v_current_date + interval '1 day';
  end loop;
end;
$$ language plpgsql security definer;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Run in Supabase Dashboard > Storage:
-- Create bucket: "acceptance-letters" (private)
-- Create bucket: "documents" (private)

-- ============================================================
-- ADMIN SEED (create initial admin user after signup)
-- ============================================================
-- After creating your admin account via Supabase Auth, run:
-- UPDATE public.profiles SET role = 'admin', status = 'active' WHERE email = 'admin@theweb3alliance.org';
