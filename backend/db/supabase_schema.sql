-- ====================================================================
-- Kuiper AI Project Planning & Decision Intelligence - Supabase Schema
-- ====================================================================

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    expected_days INTEGER NOT NULL DEFAULT 30,
    available_employees INTEGER NOT NULL DEFAULT 4,
    requirements TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    analysis JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 2. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    project_name TEXT,
    phase_name TEXT,
    title TEXT NOT NULL,
    description TEXT,
    assigned_role TEXT,
    assigned_to TEXT,
    status TEXT NOT NULL DEFAULT 'To Do',
    priority TEXT NOT NULL DEFAULT 'Medium',
    due_day INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Meetings & Calendar Table
CREATE TABLE IF NOT EXISTS public.meetings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    project_id TEXT,
    project_name TEXT,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    type TEXT NOT NULL DEFAULT 'Sprint Planning',
    attendees JSONB NOT NULL DEFAULT '[]'::jsonb,
    location_or_link TEXT,
    agenda TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Project Execution Stages Table
CREATE TABLE IF NOT EXISTS public.project_stages (
    project_id TEXT NOT NULL,
    stage_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'To Do',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, stage_name)
);

-- 5. Enable Row Level Security (RLS) and grant open public access for demo app
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;

-- Allow unrestricted SELECT, INSERT, UPDATE, DELETE for anon and service_role
CREATE POLICY "Allow all on projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on meetings" ON public.meetings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on project_stages" ON public.project_stages FOR ALL USING (true) WITH CHECK (true);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON public.meetings(date);
CREATE INDEX IF NOT EXISTS idx_meetings_project ON public.meetings(project_id);
