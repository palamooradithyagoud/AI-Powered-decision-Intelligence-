import os
import uuid
from datetime import datetime
from typing import List, Optional, Dict
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

from models.schemas import (
    Project, ProjectCreate, DashboardKPIs, User, UserRole,
    TaskItem, TaskStatus, MeetingItem, MeetingCreate
)
from services.ai_analyzer import analyzer_instance

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ezigpxtfnkzdhekrlmkd.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

# Predefined Authentication Users
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
        "prev_projects": []
    },
    2: {
        "name": "James Smith",
        "designation": "Backend Engineer",
        "skills": ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker", "gRPC"],
        "experience": "6 Years",
        "workload": 80,
        "availability": "Available (20% bandwidth)",
        "prev_projects": []
    },
    3: {
        "name": "Sarah Jenkins",
        "designation": "Frontend Engineer",
        "skills": ["React", "Next.js", "TypeScript", "Tailwind CSS", "Redux", "HTML5"],
        "experience": "3 Years",
        "workload": 70,
        "availability": "Available (30% bandwidth)",
        "prev_projects": []
    },
    4: {
        "name": "Alisha Shah",
        "designation": "AI Engineer",
        "skills": ["Python", "PyTorch", "TensorFlow", "Hugging Face", "LLMs", "Google Gemini API"],
        "experience": "5 Years",
        "workload": 95,
        "availability": "Busy (5% bandwidth)",
        "prev_projects": []
    },
    5: {
        "name": "Marcus Johnson",
        "designation": "DevOps Engineer",
        "skills": ["AWS", "Kubernetes", "Docker", "CI/CD", "Terraform", "GitHub Actions"],
        "experience": "7 Years",
        "workload": 85,
        "availability": "Available (15% bandwidth)",
        "prev_projects": []
    },
    10: {
        "name": "Devon Chen",
        "designation": "Full-Stack & AI Engineer",
        "skills": ["Next.js", "FastAPI", "React", "TypeScript", "Python", "Google Gemini API"],
        "experience": "5 Years",
        "workload": 85,
        "availability": "Available (15% bandwidth)",
        "prev_projects": []
    },
    11: {
        "name": "Sarah Jenkins",
        "designation": "Frontend Developer",
        "skills": ["React", "TypeScript", "Tailwind CSS", "Next.js", "Redux", "Figma"],
        "experience": "3 Years",
        "workload": 70,
        "availability": "Available (30% bandwidth)",
        "prev_projects": []
    },
    12: {
        "name": "Michael Chang",
        "designation": "Backend Developer",
        "skills": ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker", "Node.js"],
        "experience": "4 Years",
        "workload": 90,
        "availability": "Busy (10% bandwidth)",
        "prev_projects": []
    },
    13: {
        "name": "Priya Patel",
        "designation": "QA Engineer",
        "skills": ["Selenium", "Jest", "Cypress", "Python", "API Testing", "LoadRunner"],
        "experience": "3 Years",
        "workload": 60,
        "availability": "Available (40% bandwidth)",
        "prev_projects": []
    },
    14: {
        "name": "Marcus Johnson",
        "designation": "DevOps Engineer",
        "skills": ["AWS", "Kubernetes", "Docker", "GitHub Actions", "Terraform", "Linux"],
        "experience": "6 Years",
        "workload": 80,
        "availability": "Available (20% bandwidth)",
        "prev_projects": []
    },
    15: {
        "name": "Alisha Shah",
        "designation": "AI/ML Engineer",
        "skills": ["PyTorch", "TensorFlow", "Hugging Face", "Python", "OpenCV", "NLP"],
        "experience": "4 Years",
        "workload": 95,
        "availability": "Busy (5% bandwidth)",
        "prev_projects": []
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
    workload = (num * 7) % 50 + 50
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
        "prev_projects": []
    }


class SupabaseStorage:
    def __init__(self):
        self.client: Optional[Client] = None
        self._init_client()

    def _init_client(self):
        try:
            if SUPABASE_URL and SUPABASE_KEY:
                self.client = create_client(SUPABASE_URL, SUPABASE_KEY)
                print(f"[SupabaseStorage] Connected to Supabase at {SUPABASE_URL}")
            else:
                print("[SupabaseStorage] Missing SUPABASE_URL or SUPABASE_KEY in environment.")
        except Exception as e:
            print(f"[SupabaseStorage] Error connecting to Supabase: {e}")

    # ================= PROJECTS =================
    def _deserialize_project(self, row: dict) -> Project:
        row_copy = dict(row)
        analysis_data = row_copy.get("analysis") or {}
        if isinstance(analysis_data, dict):
            if row_copy.get("sent_to_lead") is None:
                row_copy["sent_to_lead"] = analysis_data.get("sent_to_lead", False)
            if row_copy.get("lead_assigned") is None:
                row_copy["lead_assigned"] = analysis_data.get("lead_assigned", "Elena Rostova")
            if row_copy.get("sent_to_lead_at") is None:
                row_copy["sent_to_lead_at"] = analysis_data.get("sent_to_lead_at")
        else:
            row_copy["sent_to_lead"] = row_copy.get("sent_to_lead", False)
            row_copy["lead_assigned"] = row_copy.get("lead_assigned", "Elena Rostova")
        return Project(**row_copy)

    def _serialize_project_row(self, project: Project) -> dict:
        d = project.model_dump()
        if isinstance(d.get("analysis"), dict):
            d["analysis"]["sent_to_lead"] = project.sent_to_lead
            d["analysis"]["lead_assigned"] = project.lead_assigned
            d["analysis"]["sent_to_lead_at"] = project.sent_to_lead_at
        
        # Keep base SQL table columns
        base_keys = {
            "id", "name", "description", "expected_days", "available_employees",
            "requirements", "status", "created_at", "updated_at", "analysis"
        }
        return {k: v for k, v in d.items() if k in base_keys}

    def list_projects(self) -> List[Project]:
        if not self.client:
            return []
        try:
            res = self.client.table("projects").select("*").order("created_at", desc=True).execute()
            projects = []
            for row in res.data:
                try:
                    projects.append(self._deserialize_project(row))
                except Exception as e:
                    print(f"[SupabaseStorage] Error deserializing project {row.get('id')}: {e}")
            return projects
        except Exception as e:
            print(f"[SupabaseStorage] list_projects error: {e}")
            return []

    def get_project(self, project_id: str) -> Optional[Project]:
        if not self.client:
            return None
        try:
            res = self.client.table("projects").select("*").eq("id", project_id).limit(1).execute()
            if res.data:
                return self._deserialize_project(res.data[0])
            return None
        except Exception as e:
            print(f"[SupabaseStorage] get_project error: {e}")
            return None

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
            sent_to_lead=False,
            lead_assigned="Elena Rostova",
            sent_to_lead_at=None,
            created_at=now_iso,
            updated_at=now_iso,
            analysis=analysis
        )

        if self.client:
            try:
                row_data = self._serialize_project_row(project)
                self.client.table("projects").insert(row_data).execute()

                # Insert sprint tasks generated for this project
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

                        task_data = {
                            "id": task_id,
                            "project_id": proj_id,
                            "project_name": data.name,
                            "phase_name": p.phase_name,
                            "title": deliv,
                            "description": f"Deliverable for {p.phase_name}: {deliv}",
                            "assigned_role": role,
                            "assigned_to": assigned_to,
                            "status": "To Do",
                            "priority": "High" if "core" in p.phase_name.lower() or "planning" in p.phase_name.lower() else "Medium",
                            "due_day": p.end_day,
                            "created_at": now_iso
                        }
                        try:
                            self.client.table("tasks").insert(task_data).execute()
                        except Exception:
                            pass
            except Exception as e:
                print(f"[SupabaseStorage] create_project error: {e}")

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
            sent_to_lead=project.sent_to_lead,
            lead_assigned=project.lead_assigned,
            sent_to_lead_at=project.sent_to_lead_at,
            created_at=project.created_at,
            updated_at=now_iso,
            analysis=analysis
        )

        if self.client:
            try:
                row_data = self._serialize_project_row(updated_project)
                self.client.table("projects").update(row_data).eq("id", project_id).execute()
            except Exception as e:
                print(f"[SupabaseStorage] reanalyze_project error: {e}")

        return updated_project

    def send_to_lead(self, project_id: str) -> Optional[Project]:
        project = self.get_project(project_id)
        if not project:
            return None

        now_iso = datetime.now().isoformat()
        updated_dict = project.model_dump()
        updated_dict["sent_to_lead"] = True
        updated_dict["lead_assigned"] = "Elena Rostova"
        updated_dict["sent_to_lead_at"] = now_iso
        updated_dict["status"] = "Active"
        updated_dict["updated_at"] = now_iso

        updated_project = Project(**updated_dict)

        if self.client:
            try:
                row_data = self._serialize_project_row(updated_project)
                self.client.table("projects").update(row_data).eq("id", project_id).execute()
                
                # Automatically schedule Sprint Kickoff meeting with Project Lead Elena Rostova
                today_str = datetime.now().strftime("%Y-%m-%d")
                self.create_meeting(MeetingCreate(
                    title=f"Sprint Kickoff & Architecture Review: {project.name}",
                    project_id=project.id,
                    project_name=project.name,
                    date=today_str,
                    start_time="10:00 AM",
                    end_time="11:00 AM",
                    duration_minutes=60,
                    type="Sprint Planning",
                    attendees=["Alexander Vance", "Elena Rostova"],
                    location_or_link="Google Meet (meet.google.com/kuiper-handoff)",
                    agenda=f"Formal Manager-to-Lead sprint handoff for {project.name}. Review deliverables, resource assignments, and activate execution milestones."
                ))
            except Exception as e:
                print(f"[SupabaseStorage] send_to_lead error: {e}")

        return updated_project

    def delete_project(self, project_id: str) -> bool:
        if not self.client:
            return False
        try:
            self.client.table("tasks").delete().eq("project_id", project_id).execute()
            self.client.table("project_stages").delete().eq("project_id", project_id).execute()
            self.client.table("projects").delete().eq("id", project_id).execute()
            return True
        except Exception as e:
            print(f"[SupabaseStorage] delete_project error: {e}")
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

    # ================= AUTH =================
    def authenticate_user(self, email: str, role: Optional[UserRole] = None) -> Optional[User]:
        user = DEMO_USERS.get(email.lower().strip())
        if user:
            return user
        
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
        proj_idx = emp_num % len(projects)
        return projects[proj_idx]

    # ================= TASKS =================
    def list_tasks(self, project_id: Optional[str] = None, assigned_to: Optional[str] = None, status: Optional[str] = None) -> List[TaskItem]:
        if not self.client:
            return []
        try:
            query = self.client.table("tasks").select("*")
            if project_id:
                query = query.eq("project_id", project_id)
            if assigned_to:
                query = query.ilike("assigned_to", f"%{assigned_to}%")
            if status and status != "ALL":
                query = query.eq("status", status)

            res = query.order("created_at", desc=True).execute()
            if not res.data:
                return []
            return [TaskItem(**t) for t in res.data if isinstance(t, dict)]
        except Exception as e:
            print(f"[SupabaseStorage] list_tasks error: {e}")
            return []

    def update_task_status(self, task_id: str, new_status: TaskStatus) -> Optional[TaskItem]:
        if not self.client:
            return None
        try:
            res = self.client.table("tasks").update({"status": new_status}).eq("id", task_id).execute()
            if res.data and len(res.data) > 0 and isinstance(res.data[0], dict):
                return TaskItem(**res.data[0])
            return None
        except Exception as e:
            print(f"[SupabaseStorage] update_task_status error: {e}")
            return None

    # ================= PROJECT STAGES =================
    def get_project_stages(self, project_id: str) -> Dict[str, str]:
        default_stages = {
            "Planning": "Completed",
            "Development": "In Progress",
            "Testing": "To Do",
            "Review": "To Do",
            "Deployment": "To Do"
        }
        if not self.client:
            return default_stages
        try:
            res = self.client.table("project_stages").select("*").eq("project_id", project_id).execute()
            if res.data:
                stages = {}
                for row in res.data:
                    stages[row["stage_name"]] = row["status"]
                for k, v in default_stages.items():
                    if k not in stages:
                        stages[k] = v
                return stages
            return default_stages
        except Exception as e:
            return default_stages

    def update_project_stage(self, project_id: str, stage_name: str, status: str) -> Dict[str, str]:
        if self.client:
            try:
                self.client.table("project_stages").upsert({
                    "project_id": project_id,
                    "stage_name": stage_name,
                    "status": status,
                    "updated_at": datetime.now().isoformat()
                }).execute()
            except Exception as e:
                print(f"[SupabaseStorage] update_project_stage error: {e}")
        return self.get_project_stages(project_id)

    # ================= MEETINGS =================
    def list_meetings(self, date: Optional[str] = None, project_id: Optional[str] = None) -> List[MeetingItem]:
        if not self.client:
            return []
        try:
            query = self.client.table("meetings").select("*")
            if date:
                query = query.eq("date", date)
            if project_id:
                query = query.eq("project_id", project_id)

            res = query.order("date").order("start_time").execute()
            if not res.data:
                return []
            return [MeetingItem(**m) for m in res.data if isinstance(m, dict)]
        except Exception as e:
            print(f"[SupabaseStorage] list_meetings error: {e}")
            return []

    def create_meeting(self, payload: MeetingCreate) -> MeetingItem:
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

        if self.client:
            try:
                self.client.table("meetings").insert(meeting_data).execute()
            except Exception as e:
                print(f"[SupabaseStorage] create_meeting error: {e}")

        return MeetingItem(**meeting_data)

    def delete_meeting(self, meeting_id: str) -> bool:
        if not self.client:
            return False
        try:
            self.client.table("meetings").delete().eq("id", meeting_id).execute()
            return True
        except Exception as e:
            print(f"[SupabaseStorage] delete_meeting error: {e}")
            return False
