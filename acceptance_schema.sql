-- ─── ACCEPTANCE LETTER APPROVAL SCHEMA ───────────────────────────────────────

-- 1. Add approval status to documents table
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. IN-APP NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  type        TEXT NOT NULL, -- 'acceptance_letter_uploaded', 'profile_complete', etc.
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  student_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID,
  read        BOOLEAN DEFAULT false,
  action_url  TEXT
);

-- 3. RLS on admin_notifications
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to notifications"
  ON public.admin_notifications FOR ALL
  USING (auth.jwt() ->> 'email' = 'dinfadashe@gmail.com');

-- 4. RLS on documents — students can only see their own
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own documents" ON public.documents;
DROP POLICY IF EXISTS "Students can insert own documents" ON public.documents;
DROP POLICY IF EXISTS "Admin full access to documents" ON public.documents;

CREATE POLICY "Admin full access to documents"
  ON public.documents FOR ALL
  USING (auth.jwt() ->> 'email' = 'dinfadashe@gmail.com');

CREATE POLICY "Students can view own documents"
  ON public.documents FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert own documents"
  ON public.documents FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- 5. Function to notify admin when acceptance letter is uploaded
CREATE OR REPLACE FUNCTION public.notify_admin_acceptance_letter()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.document_type = 'acceptance_letter' THEN
    INSERT INTO public.admin_notifications (
      type, title, message, student_id, document_id, action_url
    )
    SELECT
      'acceptance_letter_uploaded',
      'New Acceptance Letter Uploaded',
      p.full_name || ' (' || COALESCE(p.id_number, 'No ID') || ') has uploaded an Internship Acceptance Letter for review.',
      NEW.student_id,
      NEW.id,
      '/admin/acceptance-letters'
    FROM public.profiles p
    WHERE p.id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger on documents insert
DROP TRIGGER IF EXISTS on_acceptance_letter_upload ON public.documents;
CREATE TRIGGER on_acceptance_letter_upload
  AFTER INSERT ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_acceptance_letter();

-- Verify
SELECT 'Schema created successfully' AS status;
