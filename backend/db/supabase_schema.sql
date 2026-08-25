-- ====================================================================
-- AI Project Planning & Decision Intelligence - Complete Supabase Schema
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

-- 2. Tasks & Sprint Deliverables Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    project_name TEXT,
    phase_name TEXT,
    title TEXT NOT NULL,
    description TEXT,
    assigned_role TEXT,
    assigned_to TEXT,
    assigned_emp_id TEXT,
    match_score INTEGER DEFAULT 85,
    ai_rationale TEXT,
    status TEXT NOT NULL DEFAULT 'To Do',
    priority TEXT NOT NULL DEFAULT 'Medium',
    due_day INTEGER NOT NULL DEFAULT 10,
    confidence INTEGER DEFAULT 85,
    confidence_level TEXT DEFAULT 'HIGH',
    risk TEXT DEFAULT 'LOW',
    projected_workload NUMERIC(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all new columns exist if table was previously created
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_emp_id TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS match_score INTEGER DEFAULT 85;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS ai_rationale TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS confidence INTEGER DEFAULT 85;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS confidence_level TEXT DEFAULT 'HIGH';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS risk TEXT DEFAULT 'LOW';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS projected_workload NUMERIC(5,2);

-- 3. Employees Catalog & Profiles Table (40 Team Members)
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY,
    num INTEGER UNIQUE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee',
    designation TEXT NOT NULL,
    skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    experience TEXT NOT NULL DEFAULT '3 Years',
    experience_years NUMERIC(4,1) NOT NULL DEFAULT 3.0,
    workload INTEGER NOT NULL DEFAULT 50,
    availability TEXT NOT NULL DEFAULT 'Available',
    availability_status TEXT NOT NULL DEFAULT 'Available',
    avatar_color TEXT NOT NULL DEFAULT 'bg-indigo-600',
    prev_projects JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Activity Logs & Real-Time Progress Stream
CREATE TABLE IF NOT EXISTS public.activities (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    project_id TEXT NOT NULL,
    project_name TEXT NOT NULL,
    task_id TEXT,
    task_title TEXT,
    employee_id TEXT,
    employee_name TEXT,
    employee_role TEXT,
    from_status TEXT,
    to_status TEXT,
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Meetings & Calendar Table
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

-- 6. Project Execution Stages Table
CREATE TABLE IF NOT EXISTS public.project_stages (
    project_id TEXT NOT NULL,
    stage_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'To Do',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, stage_name)
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on projects" ON public.projects;
CREATE POLICY "Allow all on projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on tasks" ON public.tasks;
CREATE POLICY "Allow all on tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on employees" ON public.employees;
CREATE POLICY "Allow all on employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on activities" ON public.activities;
CREATE POLICY "Allow all on activities" ON public.activities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on meetings" ON public.meetings;
CREATE POLICY "Allow all on meetings" ON public.meetings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on project_stages" ON public.project_stages;
CREATE POLICY "Allow all on project_stages" ON public.project_stages FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_emp_id ON public.tasks(assigned_emp_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_activities_project_id ON public.activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON public.activities(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON public.meetings(date);
CREATE INDEX IF NOT EXISTS idx_meetings_project ON public.meetings(project_id);

-- ====================================================================
-- SEED DATA: 40 EMPLOYEES
-- ====================================================================
INSERT INTO public.employees (id, num, name, email, role, designation, skills, experience, experience_years, workload, availability, availability_status, avatar_color, prev_projects)
VALUES
('emp_01', 1, 'Arjun Reddy', 'emp_01@company.ai', 'manager', 'Project Manager', '["Project Management", "Agile", "Scrum", "Risk Management"]'::jsonb, '7 Years', 7.0, 85, 'Partial (15% bandwidth)', 'Partial', 'bg-indigo-600', '["Digital Banking Platform", "ERP Modernization"]'::jsonb),
('emp_02', 2, 'Priya Sharma', 'emp_02@company.ai', 'employee', 'Business Analyst', '["Requirements Analysis", "UML", "SQL", "Documentation"]'::jsonb, '5 Years', 5.0, 62, 'Available (38% bandwidth)', 'Available', 'bg-purple-600', '["Healthcare Management System", "E-Commerce Portal"]'::jsonb),
('emp_03', 3, 'Rahul Kumar', 'emp_03@company.ai', 'employee', 'Frontend Developer', '["React", "JavaScript", "TypeScript", "HTML", "CSS"]'::jsonb, '4 Years', 4.0, 78, 'Partial (22% bandwidth)', 'Partial', 'bg-emerald-600', '["E-Commerce Portal", "Employee Management System"]'::jsonb),
('emp_04', 4, 'Sneha Patel', 'emp_04@company.ai', 'employee', 'Backend Developer', '["Python", "FastAPI", "REST API", "PostgreSQL"]'::jsonb, '5 Years', 5.0, 55, 'Available (45% bandwidth)', 'Available', 'bg-blue-600', '["FinTech API Platform", "Inventory Management System"]'::jsonb),
('emp_05', 5, 'Vikram Singh', 'emp_05@company.ai', 'employee', 'Full Stack Developer', '["React", "Node.js", "Express", "MongoDB", "REST API"]'::jsonb, '6 Years', 6.0, 91, 'Partial (9% bandwidth)', 'Partial', 'bg-teal-600', '["Learning Management System", "CRM Platform"]'::jsonb),
('emp_06', 6, 'Ananya Rao', 'emp_06@company.ai', 'employee', 'UI/UX Designer', '["Figma", "Wireframing", "Prototyping", "User Research"]'::jsonb, '3 Years', 3.0, 35, 'Available (65% bandwidth)', 'Available', 'bg-cyan-600', '["Mobile Banking App", "Food Delivery Platform"]'::jsonb),
('emp_07', 7, 'Karthik Nair', 'emp_07@company.ai', 'employee', 'DevOps Engineer', '["Docker", "Kubernetes", "Jenkins", "AWS", "CI/CD"]'::jsonb, '6 Years', 6.0, 96, 'Busy (Fully Allocated)', 'Not Available', 'bg-sky-600', '["Cloud Migration Project", "Microservices Platform"]'::jsonb),
('emp_08', 8, 'Meera Iyer', 'emp_08@company.ai', 'employee', 'QA Engineer', '["Manual Testing", "Selenium", "API Testing", "PyTest"]'::jsonb, '4 Years', 4.0, 82, 'Partial (18% bandwidth)', 'Partial', 'bg-pink-600', '["Banking Application", "E-Commerce Platform"]'::jsonb),
('emp_09', 9, 'Rohit Verma', 'emp_09@company.ai', 'employee', 'Data Engineer', '["Python", "SQL", "ETL", "Apache Spark", "Airflow"]'::jsonb, '5 Years', 5.0, 58, 'Available (42% bandwidth)', 'Available', 'bg-rose-600', '["Customer Analytics Platform", "Data Warehouse"]'::jsonb),
('emp_10', 10, 'Divya Menon', 'emp_10@company.ai', 'employee', 'Machine Learning Engineer', '["Python", "Scikit-learn", "TensorFlow", "ML", "Pandas"]'::jsonb, '4 Years', 4.0, 32, 'Available (68% bandwidth)', 'Available', 'bg-amber-600', '["Fraud Detection System", "Recommendation Engine"]'::jsonb),
('emp_11', 11, 'Sanjay Gupta', 'emp_11@company.ai', 'employee', 'Cloud Engineer', '["AWS", "Azure", "Terraform", "Networking", "Linux"]'::jsonb, '7 Years', 7.0, 94, 'Busy (Fully Allocated)', 'Not Available', 'bg-orange-600', '["Cloud Infrastructure Migration", "Disaster Recovery System"]'::jsonb),
('emp_12', 12, 'Pooja Shah', 'emp_12@company.ai', 'employee', 'Database Administrator', '["PostgreSQL", "MySQL", "Oracle", "Database Tuning", "Backup"]'::jsonb, '6 Years', 6.0, 64, 'Available (36% bandwidth)', 'Available', 'bg-violet-600', '["Banking Database Migration", "ERP Database Upgrade"]'::jsonb),
('emp_13', 13, 'Manish Yadav', 'emp_13@company.ai', 'employee', 'Mobile App Developer', '["Flutter", "Dart", "Android", "REST API", "Firebase"]'::jsonb, '3 Years', 3.0, 41, 'Available (59% bandwidth)', 'Available', 'bg-indigo-600', '["Healthcare Mobile App", "Campus Companion App"]'::jsonb),
('emp_14', 14, 'Lakshmi Devi', 'emp_14@company.ai', 'employee', 'Cybersecurity Engineer', '["Network Security", "OWASP", "SIEM", "Vulnerability Assessment"]'::jsonb, '5 Years', 5.0, 57, 'Available (43% bandwidth)', 'Available', 'bg-purple-600', '["Secure Banking Portal", "Security Audit Platform"]'::jsonb),
('emp_15', 15, 'Aditya Joshi', 'emp_15@company.ai', 'project_lead', 'Software Architect', '["System Design", "Microservices", "Java", "Cloud Architecture"]'::jsonb, '9 Years', 9.0, 98, 'Busy (Fully Allocated)', 'Not Available', 'bg-emerald-600', '["Enterprise CRM", "Distributed Payment Platform"]'::jsonb),
('emp_16', 16, 'Nisha Kapoor', 'emp_16@company.ai', 'employee', 'Technical Writer', '["Technical Documentation", "API Documentation", "Markdown", "Git"]'::jsonb, '4 Years', 4.0, 28, 'Available (72% bandwidth)', 'Available', 'bg-blue-600', '["Developer Portal", "API Documentation Project"]'::jsonb),
('emp_17', 17, 'Varun Reddy', 'emp_17@company.ai', 'employee', 'Site Reliability Engineer', '["Linux", "Kubernetes", "Monitoring", "Prometheus", "Grafana"]'::jsonb, '5 Years', 5.0, 61, 'Available (39% bandwidth)', 'Available', 'bg-teal-600', '["Cloud Reliability Platform", "Production Monitoring System"]'::jsonb),
('emp_18', 18, 'Ishita Rao', 'emp_18@company.ai', 'project_lead', 'Product Manager', '["Product Strategy", "Roadmapping", "Agile", "Market Research"]'::jsonb, '6 Years', 6.0, 88, 'Partial (12% bandwidth)', 'Partial', 'bg-cyan-600', '["SaaS Product Launch", "Customer Experience Platform"]'::jsonb),
('emp_19', 19, 'Abhishek Das', 'emp_19@company.ai', 'employee', 'AI Engineer', '["Python", "LLMs", "RAG", "LangChain", "Vector Databases"]'::jsonb, '3 Years', 3.0, 38, 'Available (62% bandwidth)', 'Available', 'bg-sky-600', '["AI Customer Support Bot", "Document Intelligence System"]'::jsonb),
('emp_20', 20, 'Neha Rani', 'emp_20@company.ai', 'employee', 'Integration Engineer', '["REST API", "Webhooks", "OAuth", "Postman", "JSON"]'::jsonb, '4 Years', 4.0, 52, 'Available (48% bandwidth)', 'Available', 'bg-pink-600', '["Payment Gateway Integration", "Government Services Portal"]'::jsonb),
('emp_21', 21, 'Suresh Kumar', 'emp_21@company.ai', 'employee', 'Frontend Developer', '["React", "JavaScript", "TypeScript", "Next.js", "CSS"]'::jsonb, '3 Years', 3.0, 100, 'Busy (Fully Allocated)', 'Not Available', 'bg-rose-600', '["Travel Booking Portal", "Retail Dashboard"]'::jsonb),
('emp_22', 22, 'Kavya Reddy', 'emp_22@company.ai', 'employee', 'Backend Developer', '["Java", "Spring Boot", "REST API", "MySQL", "Redis"]'::jsonb, '4 Years', 4.0, 73, 'Partial (27% bandwidth)', 'Partial', 'bg-amber-600', '["Insurance Management System", "Payment API"]'::jsonb),
('emp_23', 23, 'Mohammed Faisal', 'emp_23@company.ai', 'employee', 'QA Engineer', '["Selenium", "Cypress", "API Testing", "JMeter", "SQL"]'::jsonb, '5 Years', 5.0, 86, 'Available (14% bandwidth)', 'Available', 'bg-orange-600', '["Telecom Portal", "Banking Application"]'::jsonb),
('emp_24', 24, 'Aditi Sharma', 'emp_24@company.ai', 'employee', 'Full Stack Developer', '["React", "Node.js", "Python", "PostgreSQL", "Docker"]'::jsonb, '4 Years', 4.0, 93, 'Busy (Fully Allocated)', 'Not Available', 'bg-violet-600', '["Healthcare Portal", "E-Commerce Platform"]'::jsonb),
('emp_25', 25, 'Ramesh Babu', 'emp_25@company.ai', 'employee', 'Data Engineer', '["Python", "SQL", "ETL", "Spark", "Kafka"]'::jsonb, '6 Years', 6.0, 79, 'Partial (21% bandwidth)', 'Partial', 'bg-indigo-600', '["Real-Time Analytics Platform", "Data Lake"]'::jsonb),
('emp_26', 26, 'Swathi Nair', 'emp_26@company.ai', 'employee', 'Machine Learning Engineer', '["Python", "PyTorch", "TensorFlow", "NLP", "Pandas"]'::jsonb, '5 Years', 5.0, 47, 'Available (53% bandwidth)', 'Available', 'bg-purple-600', '["NLP Classification System", "Predictive Analytics"]'::jsonb),
('emp_27', 27, 'Deepak Rao', 'emp_27@company.ai', 'employee', 'DevOps Engineer', '["AWS", "Docker", "Kubernetes", "GitHub Actions", "Terraform"]'::jsonb, '4 Years', 4.0, 68, 'Available (32% bandwidth)', 'Available', 'bg-emerald-600', '["Cloud Deployment Platform", "CI/CD Migration"]'::jsonb),
('emp_28', 28, 'Harini Gupta', 'emp_28@company.ai', 'employee', 'UI/UX Designer', '["Figma", "UX Research", "Prototyping", "Design Systems"]'::jsonb, '4 Years', 4.0, 44, 'Available (56% bandwidth)', 'Available', 'bg-blue-600', '["Education App", "Healthcare Dashboard"]'::jsonb),
('emp_29', 29, 'Ajay Singh', 'emp_29@company.ai', 'employee', 'Cloud Engineer', '["AWS", "Azure", "Linux", "Terraform", "Cloud Security"]'::jsonb, '5 Years', 5.0, 97, 'Busy (Fully Allocated)', 'Not Available', 'bg-teal-600', '["Cloud Migration", "Serverless Application"]'::jsonb),
('emp_30', 30, 'Sneha Reddy', 'emp_30@company.ai', 'employee', 'Database Administrator', '["MySQL", "PostgreSQL", "Oracle", "SQL Optimization", "Backup"]'::jsonb, '7 Years', 7.0, 71, 'Partial (29% bandwidth)', 'Partial', 'bg-cyan-600', '["ERP Database Migration", "Financial Reporting System"]'::jsonb),
('emp_31', 31, 'Ravi Teja', 'emp_31@company.ai', 'employee', 'Mobile App Developer', '["Flutter", "Dart", "Android", "Firebase", "REST API"]'::jsonb, '3 Years', 3.0, 36, 'Available (64% bandwidth)', 'Available', 'bg-sky-600', '["Delivery Tracking App", "Student App"]'::jsonb),
('emp_32', 32, 'Madhavi Rao', 'emp_32@company.ai', 'employee', 'Cybersecurity Engineer', '["Penetration Testing", "OWASP", "SIEM", "Network Security"]'::jsonb, '4 Years', 4.0, 89, 'Busy (Fully Allocated)', 'Not Available', 'bg-pink-600', '["Cybersecurity Assessment", "Secure API Gateway"]'::jsonb),
('emp_33', 33, 'Naveen Kumar', 'emp_33@company.ai', 'project_lead', 'Software Architect', '["System Design", "Microservices", "Java", "AWS", "Kubernetes"]'::jsonb, '8 Years', 8.0, 95, 'Busy (Fully Allocated)', 'Not Available', 'bg-rose-600', '["Enterprise Banking Platform", "Microservices Migration"]'::jsonb),
('emp_34', 34, 'Pallavi Joshi', 'emp_34@company.ai', 'employee', 'Technical Writer', '["API Documentation", "Technical Writing", "Git", "Markdown"]'::jsonb, '3 Years', 3.0, 25, 'Available (75% bandwidth)', 'Available', 'bg-amber-600', '["Developer Documentation Portal", "Product Knowledge Base"]'::jsonb),
('emp_35', 35, 'Chandra Sekhar', 'emp_35@company.ai', 'employee', 'Site Reliability Engineer', '["Kubernetes", "Linux", "Prometheus", "Grafana", "Incident Management"]'::jsonb, '6 Years', 6.0, 92, 'Busy (Fully Allocated)', 'Not Available', 'bg-orange-600', '["Production Monitoring", "Cloud Reliability Platform"]'::jsonb),
('emp_36', 36, 'Keerthi Menon', 'emp_36@company.ai', 'project_lead', 'Product Manager', '["Product Strategy", "Agile", "Roadmapping", "Analytics"]'::jsonb, '5 Years', 5.0, 63, 'Available (37% bandwidth)', 'Available', 'bg-violet-600', '["SaaS Platform", "Digital Marketplace"]'::jsonb),
('emp_37', 37, 'Tarun Das', 'emp_37@company.ai', 'employee', 'AI Engineer', '["Python", "LLMs", "RAG", "LangChain", "Vector Databases"]'::jsonb, '4 Years', 4.0, 84, 'Partial (16% bandwidth)', 'Partial', 'bg-indigo-600', '["AI Knowledge Assistant", "Intelligent Document Search"]'::jsonb),
('emp_38', 38, 'Divya Rao', 'emp_38@company.ai', 'employee', 'Integration Engineer', '["REST API", "OAuth", "Webhooks", "JSON", "Postman"]'::jsonb, '3 Years', 3.0, 59, 'Available (41% bandwidth)', 'Available', 'bg-purple-600', '["Payment Integration", "CRM Integration"]'::jsonb),
('emp_39', 39, 'Gautham Reddy', 'emp_39@company.ai', 'employee', 'Backend Developer', '["Python", "Django", "REST API", "PostgreSQL", "Redis"]'::jsonb, '6 Years', 6.0, 99, 'Busy (Fully Allocated)', 'Not Available', 'bg-emerald-600', '["Hospital Management System", "Logistics API"]'::jsonb),
('emp_40', 40, 'Sowmya Patel', 'emp_40@company.ai', 'employee', 'QA Engineer', '["Manual Testing", "Selenium", "Cypress", "API Testing"]'::jsonb, '3 Years', 3.0, 67, 'Available (33% bandwidth)', 'Available', 'bg-blue-600', '["Mobile Banking App", "Online Shopping Platform"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    designation = EXCLUDED.designation,
    skills = EXCLUDED.skills,
    experience = EXCLUDED.experience,
    experience_years = EXCLUDED.experience_years,
    workload = EXCLUDED.workload,
    availability = EXCLUDED.availability,
    availability_status = EXCLUDED.availability_status,
    avatar_color = EXCLUDED.avatar_color,
    prev_projects = EXCLUDED.prev_projects,
    updated_at = NOW();
