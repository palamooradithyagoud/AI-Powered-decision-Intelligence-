import json
import os
import uuid
from datetime import datetime
from typing import List, Optional, Dict
from models.schemas import (
    Project, ProjectCreate, DashboardKPIs, User, UserRole,
    TaskItem, TaskStatus, MeetingItem, MeetingCreate
)
from services.ai_analyzer import analyzer_instance

STORAGE_FILE = os.path.join(os.path.dirname(__file__), "projects_db.json")
TASKS_FILE = os.path.join(os.path.dirname(__file__), "tasks_db.json")
MEETINGS_FILE = os.path.join(os.path.dirname(__file__), "meetings_db.json")

# Predefined Demo Users for the 3 Roles
DEMO_USERS: Dict[str, User] = {
    "manager@company.ai": User(
        id="usr_manager_01",
        email="manager@company.ai",
        name="Alexander Vance",
        role="manager",
        title="VP of Engineering / Portfolio Manager",
        avatar_color="bg-blue-600"
    ),
    "lead@company.ai": User(
        id="usr_lead_01",
        email="lead@company.ai",
        name="Elena Rostova",
        role="project_lead",
        title="Senior Technical Project Lead",
        avatar_color="bg-purple-600"
    ),
    "shivanallella@gmail.com": User(
        id="emp_01",
        email="shivanallella@gmail.com",
        name="Emma Watson",
        role="employee",
        title="UI/UX Engineer",
        avatar_color="bg-emerald-600"
    )
}

EMPLOYEES_PROFILES = {
    1: {
        "name": "Emma Watson",
        "designation": "UI/UX Engineer",
        "skills": ["Figma", "Adobe XD", "Prototyping", "User Research", "Wireframing"],
        "experience": "4 Years",
        "workload": 65,
        "availability": "Available (35% bandwidth)",
        "prev_projects": ["Kuiper Rebranding Design", "SwiftPay UI Redesign"]
    },
    2: {
        "name": "James Smith",
        "designation": "Backend Engineer",
        "skills": ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker", "gRPC"],
        "experience": "6 Years",
        "workload": 80,
        "availability": "Available (20% bandwidth)",
        "prev_projects": ["FinPay Ledger API", "MedAI Audit Service"]
    },
    3: {
        "name": "Sarah Jenkins",
        "designation": "Frontend Engineer",
        "skills": ["React", "Next.js", "TypeScript", "Tailwind CSS", "Redux", "HTML5"],
        "experience": "3 Years",
        "workload": 70,
        "availability": "Available (30% bandwidth)",
        "prev_projects": ["SmartFleet Portal UI", "AdDashboard v2"]
    },
    4: {
        "name": "Alisha Shah",
        "designation": "AI Engineer",
        "skills": ["Python", "PyTorch", "TensorFlow", "Hugging Face", "LLMs", "Google Gemini API"],
        "experience": "5 Years",
        "workload": 95,
        "availability": "Busy (5% bandwidth)",
        "prev_projects": ["Radiology Image Segmenter", "NLP EHR Summary"]
    },
    5: {
        "name": "Marcus Johnson",
        "designation": "DevOps Engineer",
        "skills": ["AWS", "Kubernetes", "Docker", "CI/CD", "Terraform", "GitHub Actions"],
        "experience": "7 Years",
        "workload": 85,
        "availability": "Available (15% bandwidth)",
        "prev_projects": ["CloudMigration SwiftPay", "MedAI Compliance Deploy"]
    },
    10: {
        "name": "Devon Chen",
        "designation": "Full-Stack & AI Engineer",
        "skills": ["Next.js", "FastAPI", "React", "TypeScript", "Python", "Google Gemini API"],
        "experience": "5 Years",
        "workload": 85,
        "availability": "Available (15% bandwidth)",
        "prev_projects": ["MedAI Diagnostic Phase 1", "FinPay Core Ledger"]
    },
    11: {
        "name": "Sarah Jenkins",
        "designation": "Frontend Developer",
        "skills": ["React", "TypeScript", "Tailwind CSS", "Next.js", "Redux", "Figma"],
        "experience": "3 Years",
        "workload": 70,
        "availability": "Available (30% bandwidth)",
        "prev_projects": ["SmartFleet Portal UI", "AdDashboard v2"]
    },
    12: {
        "name": "Michael Chang",
        "designation": "Backend Developer",
        "skills": ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker", "Node.js"],
        "experience": "4 Years",
        "workload": 90,
        "availability": "Busy (10% bandwidth)",
        "prev_projects": ["PayGateway Engine", "UserAuth Microservice"]
    },
    13: {
        "name": "Priya Patel",
        "designation": "QA Engineer",
        "skills": ["Selenium", "Jest", "Cypress", "Python", "API Testing", "LoadRunner"],
        "experience": "3 Years",
        "workload": 60,
        "availability": "Available (40% bandwidth)",
        "prev_projects": ["SwiftPay Automation", "FleetIoT Load Tests"]
    },
    14: {
        "name": "Marcus Johnson",
        "designation": "DevOps Engineer",
        "skills": ["AWS", "Kubernetes", "Docker", "GitHub Actions", "Terraform", "Linux"],
        "experience": "6 Years",
        "workload": 80,
        "availability": "Available (20% bandwidth)",
        "prev_projects": ["CloudMigration SwiftPay", "MedAI Compliance Deploy"]
    },
    15: {
        "name": "Alisha Shah",
        "designation": "AI/ML Engineer",
        "skills": ["PyTorch", "TensorFlow", "Hugging Face", "Python", "OpenCV", "NLP"],
        "experience": "4 Years",
        "workload": 95,
        "availability": "Busy (5% bandwidth)",
        "prev_projects": ["Radiology Image Segmenter", "NLP EHR Summary"]
    }
}

def get_employee_profile(num: int) -> dict:
    if num in EMPLOYEES_PROFILES:
        return EMPLOYEES_PROFILES[num]
    
    designations = ["Frontend Developer", "Backend Developer", "QA Engineer", "DevOps Engineer", "AI/ML Engineer", "Data Scientist", "UI/UX Designer"]
    skills_map = {
        "Frontend Developer": ["React", "Next.js", "TypeScript", "Tailwind CSS", "CSS3", "HTML5"],
        "Backend Developer": ["Python", "FastAPI", "PostgreSQL", "MongoDB", "Redis", "Docker"],
        "QA Engineer": ["Jest", "Cypress", "Selenium", "API Testing", "Postman", "CI/CD"],
        "DevOps Engineer": ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform", "GitHub Actions"],
        "AI/ML Engineer": ["Python", "PyTorch", "TensorFlow", "scikit-learn", "Hugging Face", "LLMs"],
        "Data Scientist": ["Python", "Pandas", "NumPy", "SQL", "Data Visualization", "R"],
        "UI/UX Designer": ["Figma", "Adobe XD", "Prototyping", "User Research", "Wireframing"]
    }
    
    designation = designations[num % len(designations)]
    skills = skills_map[designation]
    first_names = ["James", "Emma", "John", "Olivia", "Robert", "Sophia", "William", "Isabella", "David", "Mia", "Richard", "Charlotte", "Joseph", "Amelia", "Thomas", "Evelyn"]
    last_names = ["Smith", "Jones", "Taylor", "Brown", "Wilson", "White", "Miller", "Davis", "Garcia", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Anderson"]
    
    name = f"{first_names[num % len(first_names)]} {last_names[(num + 3) % len(last_names)]}"
    workload = (num * 7) % 50 + 50 # 50% - 99%
    band = 100 - workload
    availability = f"Available ({band}% bandwidth)" if band > 10 else "Busy (Fully Allocated)"
    experience = f"{((num * 3) % 8) + 2} Years"
    
    return {
        "name": name,
        "designation": designation,
        "skills": skills,
        "experience": experience,
        "workload": workload,
        "availability": availability,
        "prev_projects": [f"Legacy Platform v{num % 3 + 1}", f"Internal Tool Setup"]
    }

class ProjectStorage:
    def __init__(self):
        self._ensure_storage()

    def _ensure_storage(self):
        os.makedirs(os.path.dirname(STORAGE_FILE), exist_ok=True)
        if not os.path.exists(STORAGE_FILE) or os.path.getsize(STORAGE_FILE) == 0:
            self._seed_default_projects()
        if not os.path.exists(TASKS_FILE) or os.path.getsize(TASKS_FILE) == 0:
            self._seed_default_tasks()
        if not os.path.exists(MEETINGS_FILE) or os.path.getsize(MEETINGS_FILE) == 0:
            self._seed_default_meetings()

    def _seed_default_projects(self):
        """Seed realistic projects so the manager dashboard looks rich and functional out-of-the-box."""
        seeds = [
            {
                "name": "MedAI Clinical Diagnostic Assistant",
                "description": "HIPAA-compliant AI diagnostic recommendation portal for radiologists and clinical oncologists with automated DICOM image segmentation and EHR report summarization.",
                "expected_days": 75,
                "available_employees": 7,
                "requirements": """1. DICOM medical imaging viewer with automated AI lesion segmentation
2. Patient electronic health record (EHR) ingestion and FHIR format interoperability
3. HIPAA-compliant role-based access control, audit trails, and multi-factor authentication
4. Real-time radiologist collaborative review annotations and report generator
5. High-throughput asynchronous LLM diagnostic differential summary pipeline
6. Automated clinical safety guardrails, disclaimer validation, and QA verification
7. Multi-cloud deployment with encrypted at-rest PostgreSQL and S3-compatible imaging storage"""
            },
            {
                "name": "SwiftPay Global Micro-Merchant POS",
                "description": "Omnichannel payment gateway and real-time ledger engine for small retail merchants with instant settlement, QR code checkouts, and fraud anomaly detection.",
                "expected_days": 45,
                "available_employees": 4,
                "requirements": """1. Multi-currency transaction processing with Stripe & Adyen payment gateway fallbacks
2. Merchant mobile-first PWA dashboard with real-time sales telemetry and settlement tracking
3. PCI-DSS compliant tokenization vault and AES-256 data encryption
4. Fraud detection rule engine and transaction velocity anomaly scoring
5. Automated daily PDF reconciliation statements and tax ledger exports
6. High-availability Redis caching layer for sub-50ms checkout authorization"""
            },
            {
                "name": "SmartFleet Autonomous Logistics IoT Hub",
                "description": "Real-time cold-chain freight tracking telemetry hub supporting 50,000+ IoT GPS/temperature sensors with predictive maintenance alerts and dynamic route optimization.",
                "expected_days": 20,
                "available_employees": 2,
                "requirements": """1. High-throughput MQTT and WebSocket telemetry ingestion pipeline (10,000 msgs/sec)
2. Live interactive geospatial map with real-time vehicle clustering and route playback
3. Sensor temperature breach alerting and automated driver dispatch SMS webhooks
4. Predictive maintenance machine learning model for refrigeration unit failures
5. Dynamic route re-routing algorithm based on traffic, weather, and battery metrics
6. Enterprise customer multi-tenant portal with custom webhook triggers and SLA reports
7. Kubernetes auto-scaling cluster with TimescaleDB time-series persistence"""
            }
        ]

        projects: Dict[str, dict] = {}
        for seed in seeds:
            proj_id = str(uuid.uuid4())
            now_iso = datetime.now().isoformat()
            
            analysis = analyzer_instance.analyze_project(
                name=seed["name"],
                description=seed["description"],
                expected_days=seed["expected_days"],
                available_employees=seed["available_employees"],
                requirements=seed["requirements"]
            )

            proj_status = "At-Risk" if analysis.feasibility.status == "NOT FEASIBLE" else "Active"

            proj = {
                "id": proj_id,
                "name": seed["name"],
                "description": seed["description"],
                "expected_days": seed["expected_days"],
                "available_employees": seed["available_employees"],
                "requirements": seed["requirements"],
                "status": proj_status,
                "created_at": now_iso,
                "updated_at": now_iso,
                "analysis": analysis.model_dump()
            }
            projects[proj_id] = proj

        with open(STORAGE_FILE, "w", encoding="utf-8") as f:
            json.dump(projects, f, indent=2)

    def _seed_default_tasks(self):
        """Seed tasks linked to projects and assigned to roles / Devon Chen."""
        projects = self.list_projects()
        tasks: Dict[str, dict] = {}

        for proj in projects:
            for p in proj.analysis.timeline_breakdown.phases:
                for deliv in p.key_deliverables:
                    task_id = str(uuid.uuid4())
                    
                    # Assign roles intelligently
                    if "ui" in p.phase_name.lower():
                        role = "UI/UX Engineer"
                        assigned_to = "Emma Watson"
                    elif "frontend" in p.phase_name.lower():
                        role = "Frontend Engineer"
                        assigned_to = "Sarah Jenkins"
                    elif "backend" in p.phase_name.lower() or "api" in p.phase_name.lower():
                        role = "Backend Engineer"
                        assigned_to = "James Smith"
                    elif "ai" in p.phase_name.lower() or "ml" in p.phase_name.lower():
                        role = "AI Engineer"
                        assigned_to = "Alisha Shah"
                    elif "testing" in p.phase_name.lower() or "qa" in p.phase_name.lower():
                        role = "QA Engineer"
                        assigned_to = "Priya Patel"
                    else:
                        role = "DevOps Engineer"
                        assigned_to = "Marcus Johnson"

                    status = "Completed" if p.end_day < 15 else ("In Progress" if p.start_day <= 25 else "To Do")

                    task = TaskItem(
                        id=task_id,
                        project_id=proj.id,
                        project_name=proj.name,
                        phase_name=p.phase_name,
                        title=deliv,
                        description=f"Implement and verify {deliv} as part of Phase: {p.phase_name}",
                        assigned_role=role,
                        assigned_to=assigned_to,
                        status=status,
                        priority="High" if "architecture" in p.phase_name.lower() or "core" in p.phase_name.lower() else "Medium",
                        due_day=p.end_day
                    )
                    tasks[task_id] = task.model_dump()

        with open(TASKS_FILE, "w", encoding="utf-8") as f:
            json.dump(tasks, f, indent=2)

    def _read_all(self) -> Dict[str, dict]:
        try:
            with open(STORAGE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    def _write_all(self, data: Dict[str, dict]):
        with open(STORAGE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def _read_tasks(self) -> Dict[str, dict]:
        try:
            with open(TASKS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    def _write_tasks(self, data: Dict[str, dict]):
        with open(TASKS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def list_projects(self) -> List[Project]:
        raw = self._read_all()
        projects = []
        for p in raw.values():
            try:
                projects.append(Project(**p))
            except Exception as e:
                print(f"Error deserializing project {p.get('id')}: {e}")
        projects.sort(key=lambda x: x.created_at, reverse=True)
        return projects

    def get_project(self, project_id: str) -> Optional[Project]:
        raw = self._read_all()
        p = raw.get(project_id)
        if not p:
            return None
        return Project(**p)

    def create_project(self, data: ProjectCreate) -> Project:
        proj_id = str(uuid.uuid4())
        now_iso = datetime.now().isoformat()

        analysis = analyzer_instance.analyze_project(
            name=data.name,
            description=data.description,
            expected_days=data.expected_days,
            available_employees=data.available_employees,
            requirements=data.requirements
        )

        status = "At-Risk" if analysis.feasibility.status == "NOT FEASIBLE" else "Active"

        project = Project(
            id=proj_id,
            name=data.name,
            description=data.description,
            expected_days=data.expected_days,
            available_employees=data.available_employees,
            requirements=data.requirements,
            status=status,
            created_at=now_iso,
            updated_at=now_iso,
            analysis=analysis
        )

        raw = self._read_all()
        raw[proj_id] = project.model_dump()
        self._write_all(raw)

        # Generate default sprint tasks for the new project
        tasks_raw = self._read_tasks()
        for p in analysis.timeline_breakdown.phases:
            for deliv in p.key_deliverables:
                task_id = str(uuid.uuid4())
                if "ui" in p.phase_name.lower():
                    role = "UI/UX Engineer"
                    assigned_to = "Emma Watson"
                elif "frontend" in p.phase_name.lower():
                    role = "Frontend Engineer"
                    assigned_to = "Sarah Jenkins"
                elif "backend" in p.phase_name.lower() or "api" in p.phase_name.lower():
                    role = "Backend Engineer"
                    assigned_to = "James Smith"
                elif "ai" in p.phase_name.lower() or "ml" in p.phase_name.lower():
                    role = "AI Engineer"
                    assigned_to = "Alisha Shah"
                elif "testing" in p.phase_name.lower() or "qa" in p.phase_name.lower():
                    role = "QA Engineer"
                    assigned_to = "Priya Patel"
                else:
                    role = "DevOps Engineer"
                    assigned_to = "Marcus Johnson"

                task = TaskItem(
                    id=task_id,
                    project_id=proj_id,
                    project_name=data.name,
                    phase_name=p.phase_name,
                    title=deliv,
                    description=f"Deliverable for {p.phase_name}: {deliv}",
                    assigned_role=role,
                    assigned_to=assigned_to,
                    status="To Do",
                    priority="High" if "core" in p.phase_name.lower() or "planning" in p.phase_name.lower() else "Medium",
                    due_day=p.end_day
                )
                tasks_raw[task_id] = task.model_dump()
        self._write_tasks(tasks_raw)

        return project

    def reanalyze_project(self, project_id: str, new_data: Optional[ProjectCreate] = None) -> Optional[Project]:
        project = self.get_project(project_id)
        if not project:
            return None

        name = new_data.name if new_data else project.name
        description = new_data.description if new_data else project.description
        expected_days = new_data.expected_days if new_data else project.expected_days
        available_employees = new_data.available_employees if new_data else project.available_employees
        requirements = new_data.requirements if new_data else project.requirements

        analysis = analyzer_instance.analyze_project(
            name=name,
            description=description,
            expected_days=expected_days,
            available_employees=available_employees,
            requirements=requirements
        )

        status = "At-Risk" if analysis.feasibility.status == "NOT FEASIBLE" else "Active"
        now_iso = datetime.now().isoformat()

        updated_project = Project(
            id=project.id,
            name=name,
            description=description,
            expected_days=expected_days,
            available_employees=available_employees,
            requirements=requirements,
            status=status,
            created_at=project.created_at,
            updated_at=now_iso,
            analysis=analysis
        )

        raw = self._read_all()
        raw[project_id] = updated_project.model_dump()
        self._write_all(raw)
        return updated_project

    def delete_project(self, project_id: str) -> bool:
        raw = self._read_all()
        if project_id in raw:
            del raw[project_id]
            self._write_all(raw)
            return True
        return False

    def get_kpis(self) -> DashboardKPIs:
        projects = self.list_projects()
        total = len(projects)
        active = sum(1 for p in projects if p.status == "Active")
        completed = sum(1 for p in projects if p.status == "Completed")
        at_risk = sum(1 for p in projects if p.status == "At-Risk" or p.analysis.feasibility.status == "NOT FEASIBLE")
        
        feasible_count = sum(1 for p in projects if p.analysis.feasibility.status == "FEASIBLE")
        feasible_changes_count = sum(1 for p in projects if p.analysis.feasibility.status == "FEASIBLE WITH CHANGES")
        not_feasible_count = sum(1 for p in projects if p.analysis.feasibility.status == "NOT FEASIBLE")

        return DashboardKPIs(
            total_projects=total,
            active_projects=active,
            completed_projects=completed,
            at_risk_projects=at_risk,
            feasible_count=feasible_count,
            feasible_with_changes_count=feasible_changes_count,
            not_feasible_count=not_feasible_count
        )

    # Auth Methods
    def authenticate_user(self, email: str, role: Optional[UserRole] = None) -> Optional[User]:
        user = DEMO_USERS.get(email.lower().strip())
        if user:
            return user
        
        # Fallback dynamic user generation if custom email
        role_to_assign: UserRole = role or "employee"
        name = email.split("@")[0].replace(".", " ").title()
        return User(
            id=f"usr_{uuid.uuid4().hex[:8]}",
            email=email,
            name=name,
            role=role_to_assign,
            title="Team Member",
            avatar_color="bg-slate-600"
        )

    # Task Management Methods for Project Lead & Employee
    def list_tasks(self, project_id: Optional[str] = None, assigned_to: Optional[str] = None, status: Optional[str] = None) -> List[TaskItem]:
        raw = self._read_tasks()
        tasks = [TaskItem(**t) for t in raw.values()]

        if project_id:
            tasks = [t for t in tasks if t.project_id == project_id]
        if assigned_to:
            tasks = [t for t in tasks if assigned_to.lower() in t.assigned_to.lower()]
        if status and status != "ALL":
            tasks = [t for t in tasks if t.status.lower() == status.lower()]

        return tasks

    def update_task_status(self, task_id: str, new_status: TaskStatus) -> Optional[TaskItem]:
        raw = self._read_tasks()
        if task_id not in raw:
            return None
        raw[task_id]["status"] = new_status
        self._write_tasks(raw)
        return TaskItem(**raw[task_id])

    def get_employee_user(self, emp_num: int, email: Optional[str] = None) -> User:
        profile = get_employee_profile(emp_num)
        avatar_colors = ["bg-emerald-600", "bg-indigo-600", "bg-teal-600", "bg-cyan-600", "bg-sky-600", "bg-pink-600", "bg-purple-600"]
        color = avatar_colors[emp_num % len(avatar_colors)]
        return User(
            id=f"emp_{emp_num:02d}",
            email=email if email else f"emp_{emp_num:02d}@company.ai",
            name=profile["name"],
            role="employee",
            title=profile["designation"],
            avatar_color=color
        )

    def get_assigned_project_for_employee(self, emp_num: int) -> Optional[Project]:
        projects = self.list_projects()
        if not projects:
            return None
        # Deterministically assign employee to a project
        proj_idx = emp_num % len(projects)
        return projects[proj_idx]

    def get_project_stages(self, project_id: str) -> Dict[str, str]:
        stages_file = os.path.join(os.path.dirname(__file__), "project_stages.json")
        if os.path.exists(stages_file):
            try:
                with open(stages_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if project_id in data:
                        return data[project_id]
            except Exception:
                pass
        
        # Default stages if not exists
        default_stages = {
            "Planning": "Completed",
            "Development": "In Progress",
            "Testing": "To Do",
            "Review": "To Do",
            "Deployment": "To Do"
        }
        return default_stages

    def update_project_stage(self, project_id: str, stage_name: str, status: str) -> Dict[str, str]:
        stages_file = os.path.join(os.path.dirname(__file__), "project_stages.json")
        data = {}
        if os.path.exists(stages_file):
            try:
                with open(stages_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception:
                pass
        
        if project_id not in data:
            data[project_id] = {
                "Planning": "Completed",
                "Development": "In Progress",
                "Testing": "To Do",
                "Review": "To Do",
                "Deployment": "To Do"
            }
        
        if stage_name in data[project_id]:
            data[project_id][stage_name] = status
            
        with open(stages_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
            
        return data[project_id]

    # ================= MEETING STORAGE & CALENDAR =================
    def _seed_default_meetings(self):
        default_meetings = {
            "meet_01": {
                "id": "meet_01",
                "title": "MedAI Architecture & Safety Review",
                "project_id": "proj_medai",
                "project_name": "MedAI Clinical Diagnostic Assistant",
                "date": "2026-08-24",
                "start_time": "10:30 AM",
                "end_time": "11:30 AM",
                "duration_minutes": 60,
                "type": "Architecture Sync",
                "attendees": ["Alexander Vance", "Elena Rostova", "Devon Chen"],
                "location_or_link": "Google Meet (meet.google.com/kuiper-medai)",
                "agenda": "Review DICOM segmentation pipeline safety guardrails and FHIR interoperability specs.",
                "created_at": datetime.now().isoformat()
            },
            "meet_02": {
                "id": "meet_02",
                "title": "Sprint Planning & Deliverables Review",
                "project_id": "proj_swiftpay",
                "project_name": "SwiftPay Global Micro-Merchant POS",
                "date": "2026-08-25",
                "start_time": "02:00 PM",
                "end_time": "03:00 PM",
                "duration_minutes": 60,
                "type": "Sprint Planning",
                "attendees": ["Alexander Vance", "Devon Chen"],
                "location_or_link": "Room 4A • Kuiper HQ & Zoom",
                "agenda": "Assign upcoming sprint milestone deliverables and test fraud anomaly engine.",
                "created_at": datetime.now().isoformat()
            },
            "meet_03": {
                "id": "meet_03",
                "title": "Executive AI Feasibility Briefing",
                "project_id": "proj_smartfleet",
                "project_name": "SmartFleet Autonomous Logistics IoT Hub",
                "date": "2026-08-28",
                "start_time": "11:00 AM",
                "end_time": "12:00 PM",
                "duration_minutes": 60,
                "type": "Executive Briefing",
                "attendees": ["Alexander Vance", "Elena Rostova"],
                "location_or_link": "Boardroom Alpha • Hybrid Link",
                "agenda": "Present 5-dimension AI feasibility radar score and timeline buffer analysis to leadership.",
                "created_at": datetime.now().isoformat()
            }
        }
        self._write_meetings(default_meetings)

    def _read_meetings(self) -> Dict[str, dict]:
        if not os.path.exists(MEETINGS_FILE):
            return {}
        try:
            with open(MEETINGS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    def _write_meetings(self, data: Dict[str, dict]):
        with open(MEETINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def list_meetings(self, date: Optional[str] = None, project_id: Optional[str] = None) -> List[MeetingItem]:
        raw = self._read_meetings()
        meets = [MeetingItem(**m) for m in raw.values()]
        if date:
            meets = [m for m in meets if m.date == date]
        if project_id:
            meets = [m for m in meets if m.project_id == project_id]
        
        # Sort by date and start time
        meets.sort(key=lambda m: (m.date, m.start_time))
        return meets

    def create_meeting(self, payload: MeetingCreate) -> MeetingItem:
        raw = self._read_meetings()
        meet_id = f"meet_{uuid.uuid4().hex[:8]}"
        now_iso = datetime.now().isoformat()

        meeting_data = {
            "id": meet_id,
            "title": payload.title,
            "project_id": payload.project_id,
            "project_name": payload.project_name or "General Sprint Planning",
            "date": payload.date,
            "start_time": payload.start_time,
            "end_time": payload.end_time,
            "duration_minutes": payload.duration_minutes,
            "type": payload.type,
            "attendees": payload.attendees if payload.attendees else ["Alexander Vance"],
            "location_or_link": payload.location_or_link or "Google Meet (meet.google.com/kuiper-sync)",
            "agenda": payload.agenda or "",
            "created_at": now_iso
        }

        raw[meet_id] = meeting_data
        self._write_meetings(raw)
        return MeetingItem(**meeting_data)

    def delete_meeting(self, meeting_id: str) -> bool:
        raw = self._read_meetings()
        if meeting_id in raw:
            del raw[meeting_id]
            self._write_meetings(raw)
            return True
        return False

storage = ProjectStorage()

