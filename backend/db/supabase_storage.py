import os
import uuid
from datetime import datetime
from typing import List, Optional, Dict
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

from models.schemas import (
    Project, ProjectCreate, DashboardKPIs, User, UserRole,
    TaskItem, TaskStatus, MeetingItem, MeetingCreate,
    ActivityLog, ActivityEventType, ProjectSprintSummary,
    EmployeeSprintStats
)
from services.ai_analyzer import analyzer_instance
try:
    from services.elite_allocator import get_elite_engine
    _ELITE_ENGINE_AVAILABLE = True
except ImportError as _e:
    print(f"[Storage] EliteAllocator not available: {_e} — will use legacy allocator")
    _ELITE_ENGINE_AVAILABLE = False

from db.employees_data import (
    EMPLOYEES_DATA,
    get_all_employees,
    get_employee_by_num,
    get_employee_by_id,
    get_employee_by_email_or_name,
    authenticate_employee
)

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ezigpxtfnkzdhekrlmkd.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

# Primary Role Users mapped to EMPLOYEE_ID.xlsx records
DEMO_USERS: Dict[str, User] = {
    "manager@company.ai": User(
        id="emp_01",
        email="emp_01@company.ai",
        name="Arjun Reddy",
        role="manager",
        title="Project Manager",
        avatar_color="bg-indigo-600"
    ),
    "lead@company.ai": User(
        id="emp_18",
        email="emp_18@company.ai",
        name="Ishita Rao",
        role="project_lead",
        title="Product Manager / Sprint Lead",
        avatar_color="bg-purple-600"
    ),
    "employee@company.ai": User(
        id="emp_03",
        email="emp_03@company.ai",
        name="Rahul Kumar",
        role="employee",
        title="Frontend Developer",
        avatar_color="bg-emerald-600"
    )
}

# Alias mapping for backwards compatibility
EMPLOYEES_PROFILES = EMPLOYEES_DATA

def get_employee_profile(num: int) -> dict:
    """Retrieve full employee profile directly from EMPLOYEE_ID.xlsx dataset."""
    emp = get_employee_by_num(num)
    if emp:
        return emp
    # Fallback to id lookup if needed
    emp_by_id = get_employee_by_id(f"emp_{num:02d}")
    if emp_by_id:
        return emp_by_id
    # Default fallback
    return EMPLOYEES_DATA.get(1, {
        "name": f"Employee {num}",
        "designation": "Software Engineer",
        "skills": ["Python", "JavaScript"],
        "experience": "3 Years",
        "workload": 60,
        "availability": "Available (40% bandwidth)",
        "prev_projects": []
    })



import time

class SupabaseStorage:
    def __init__(self):
        self.client: Optional[Client] = None
        self._activities: List[ActivityLog] = []
        self._projects_cache: List[Project] = []
        self._tasks_cache: Dict[str, TaskItem] = {}
        self._meetings_cache: List[MeetingItem] = []
        self._init_client()
        self.ensure_seeded_data()

    def _execute_with_retry(self, operation, retries: int = 3, delay: float = 0.05):
        """Execute a Supabase operation with retry for transient Windows socket errors."""
        last_err = None
        for attempt in range(retries):
            try:
                return operation()
            except Exception as e:
                last_err = e
                err_str = str(e)
                if "10035" in err_str or "timeout" in err_str.lower() or "reset" in err_str.lower():
                    time.sleep(delay * (attempt + 1))
                else:
                    break
        if last_err is not None:
            raise last_err
        raise RuntimeError("Operation failed without error or retries exhausted")

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
                row_copy["lead_assigned"] = analysis_data.get("lead_assigned", "Ishita Rao")
            if row_copy.get("sent_to_lead_at") is None:
                row_copy["sent_to_lead_at"] = analysis_data.get("sent_to_lead_at")
            if row_copy.get("lead_status") is None:
                row_copy["lead_status"] = analysis_data.get("lead_status", "Pending Review" if row_copy.get("sent_to_lead") else "None")
            if row_copy.get("rejection_reason") is None:
                row_copy["rejection_reason"] = analysis_data.get("rejection_reason")
            if row_copy.get("lead_accepted_at") is None:
                row_copy["lead_accepted_at"] = analysis_data.get("lead_accepted_at")
            if row_copy.get("lead_rejected_at") is None:
                row_copy["lead_rejected_at"] = analysis_data.get("lead_rejected_at")
            if row_copy.get("ai_work_allocated") is None:
                row_copy["ai_work_allocated"] = analysis_data.get("ai_work_allocated", False)
        else:
            row_copy["sent_to_lead"] = row_copy.get("sent_to_lead", False)
            row_copy["lead_assigned"] = row_copy.get("lead_assigned", "Ishita Rao")
            row_copy["lead_status"] = row_copy.get("lead_status", "None")
        return Project(**row_copy)

    def _serialize_project_row(self, project: Project) -> dict:
        d = project.model_dump()
        if isinstance(d.get("analysis"), dict):
            d["analysis"]["sent_to_lead"] = project.sent_to_lead
            d["analysis"]["lead_assigned"] = project.lead_assigned
            d["analysis"]["sent_to_lead_at"] = project.sent_to_lead_at
            d["analysis"]["lead_status"] = project.lead_status
            d["analysis"]["rejection_reason"] = project.rejection_reason
            d["analysis"]["lead_accepted_at"] = project.lead_accepted_at
            d["analysis"]["lead_rejected_at"] = project.lead_rejected_at
            d["analysis"]["ai_work_allocated"] = project.ai_work_allocated
        
        # Keep base SQL table columns
        base_keys = {
            "id", "name", "description", "expected_days", "available_employees",
            "requirements", "status", "created_at", "updated_at", "analysis"
        }
        return {k: v for k, v in d.items() if k in base_keys}

    def _deserialize_task(self, row: dict) -> TaskItem:
        row_copy = dict(row)
        assigned_to = row_copy.get("assigned_to", "Unassigned")
        assigned_emp_id = row_copy.get("assigned_emp_id")
        
        if not assigned_emp_id and assigned_to and assigned_to != "Unassigned":
            emp = get_employee_by_email_or_name(assigned_to)
            if emp:
                assigned_emp_id = emp.get("id")
                if not row_copy.get("assigned_role"):
                    row_copy["assigned_role"] = emp.get("designation")

        row_copy["assigned_emp_id"] = assigned_emp_id
        if not row_copy.get("match_score"):
            row_copy["match_score"] = 94
        if not row_copy.get("ai_rationale") and assigned_to != "Unassigned":
            role_desc = row_copy.get("assigned_role", "Staff Engineer")
            row_copy["ai_rationale"] = f"AI Multi-factor alignment: Assigned to {assigned_to} ({role_desc}) based on skill competence, available headroom, and experience."

        return TaskItem(**row_copy)

    def _serialize_task_row(self, task: TaskItem) -> dict:
        base_keys = {
            "id", "project_id", "project_name", "phase_name", "title",
            "description", "assigned_role", "assigned_to", "status",
            "priority", "due_day", "created_at"
        }
        d = task.model_dump()
        return {k: v for k, v in d.items() if k in base_keys}

    def list_projects(self) -> List[Project]:
        if not self.client:
            return self._projects_cache
        try:
            res = self._execute_with_retry(
                lambda: self.client.table("projects").select("*").order("created_at", desc=True).execute()
            )
            projects = []
            for row in res.data:
                try:
                    projects.append(self._deserialize_project(row))
                except Exception as e:
                    print(f"[SupabaseStorage] Error deserializing project {row.get('id')}: {e}")
            if projects:
                self._projects_cache = projects
            return projects
        except Exception as e:
            print(f"[SupabaseStorage] list_projects error: {e}")
            return self._projects_cache

    def get_project(self, project_id: str) -> Optional[Project]:
        # First check cache
        for p in self._projects_cache:
            if p.id == project_id:
                return p
        if not self.client:
            return None
        try:
            res = self._execute_with_retry(
                lambda: self.client.table("projects").select("*").eq("id", project_id).limit(1).execute()
            )
            if res.data:
                proj = self._deserialize_project(res.data[0])
                # Update in cache
                self._projects_cache = [p for p in self._projects_cache if p.id != project_id] + [proj]
                return proj
            return None
        except Exception as e:
            print(f"[SupabaseStorage] get_project error: {e}")
            for p in self._projects_cache:
                if p.id == project_id:
                    return p
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

        status = "At-Risk" if analysis.feasibility.status == "NOT FEASIBLE" else "Planning"

        project = Project(
            id=proj_id,
            name=data.name,
            description=data.description,
            expected_days=data.expected_days,
            available_employees=data.available_employees,
            requirements=data.requirements,
            status=status,
            sent_to_lead=False,
            lead_assigned="Ishita Rao",
            sent_to_lead_at=None,
            lead_status="None",
            rejection_reason=None,
            lead_accepted_at=None,
            lead_rejected_at=None,
            ai_work_allocated=False,
            created_at=now_iso,
            updated_at=now_iso,
            analysis=analysis
        )

        if self.client:
            try:
                row_data = self._serialize_project_row(project)
                self.client.table("projects").insert(row_data).execute()

                # Automatically generate intelligent AI task allocations using the 40 real employees
                all_employees = get_all_employees()
                tasks = analyzer_instance.allocate_tasks_to_employees(
                    project_id=proj_id,
                    project_name=data.name,
                    project_description=data.description,
                    phases=analysis.timeline_breakdown.phases,
                    employees=all_employees
                )

                for t in tasks:
                    task_dict = self._serialize_task_row(t)
                    task_dict["created_at"] = now_iso
                    try:
                        self.client.table("tasks").insert(task_dict).execute()
                    except Exception as task_err:
                        print(f"[SupabaseStorage] Task insert notice for {t.title}: {task_err}")
            except Exception as e:
                print(f"[SupabaseStorage] create_project error: {e}")

        return project

    def reanalyze_project(self, project_id: str, new_data: Optional[ProjectCreate] = None) -> Optional[Project]:
        project = self.get_project(project_id)
        if not project:
            return None

        data_to_use = new_data or ProjectCreate(
            name=project.name,
            description=project.description,
            expected_days=project.expected_days,
            available_employees=project.available_employees,
            requirements=project.requirements
        )

        new_analysis = analyzer_instance.analyze_project(
            name=data_to_use.name,
            description=data_to_use.description,
            expected_days=data_to_use.expected_days,
            available_employees=data_to_use.available_employees,
            requirements=data_to_use.requirements
        )

        now_iso = datetime.now().isoformat()
        status = "At-Risk" if new_analysis.feasibility.status == "NOT FEASIBLE" else "Planning"

        updated_dict = project.model_dump()
        updated_dict["name"] = data_to_use.name
        updated_dict["description"] = data_to_use.description
        updated_dict["expected_days"] = data_to_use.expected_days
        updated_dict["available_employees"] = data_to_use.available_employees
        updated_dict["requirements"] = data_to_use.requirements
        updated_dict["status"] = status
        updated_dict["updated_at"] = now_iso
        updated_dict["analysis"] = new_analysis

        updated_project = Project(**updated_dict)

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
        updated_dict["lead_status"] = "Pending Review"
        updated_dict["lead_assigned"] = "Ishita Rao"
        updated_dict["sent_to_lead_at"] = now_iso
        updated_dict["status"] = "Pending Lead Review"
        updated_dict["updated_at"] = now_iso

        updated_project = Project(**updated_dict)

        if self.client:
            try:
                row_data = self._serialize_project_row(updated_project)
                self.client.table("projects").update(row_data).eq("id", project_id).execute()
            except Exception as e:
                print(f"[SupabaseStorage] send_to_lead error: {e}")

        return updated_project

    def lead_action(self, project_id: str, action: str, rejection_reason: Optional[str] = None) -> Optional[Project]:
        """Process Lead decision: Accept or Reject project with structured reasoning."""
        project = self.get_project(project_id)
        if not project:
            return None

        now_iso = datetime.now().isoformat()
        updated_dict = project.model_dump()
        
        if action.lower() == "accept":
            updated_dict["lead_status"] = "Accepted"
            updated_dict["status"] = "Active"
            updated_dict["lead_accepted_at"] = now_iso
            updated_dict["rejection_reason"] = None
            
            # Automatically schedule kickoff meeting with Project Lead
            today_str = datetime.now().strftime("%Y-%m-%d")
            self.create_meeting(MeetingCreate(
                title=f"Sprint Kickoff & Architecture Alignment: {project.name}",
                project_id=project.id,
                project_name=project.name,
                date=today_str,
                start_time="10:00 AM",
                end_time="11:00 AM",
                duration_minutes=60,
                type="Sprint Planning",
                attendees=["Arjun Reddy", "Ishita Rao"],
                location_or_link="Google Meet (meet.google.com/kuiper-sprint)",
                agenda=f"Project Lead accepted {project.name}. Review AI work allocations, resource bandwidth, and kick off Sprint execution."
            ))
        else: # reject
            updated_dict["lead_status"] = "Rejected"
            updated_dict["status"] = "Rejected by Lead"
            updated_dict["rejection_reason"] = rejection_reason or "Scope and timeline requires refinement before execution."
            updated_dict["lead_rejected_at"] = now_iso

        updated_dict["updated_at"] = now_iso
        updated_project = Project(**updated_dict)

        if self.client:
            try:
                row_data = self._serialize_project_row(updated_project)
                self.client.table("projects").update(row_data).eq("id", project_id).execute()
            except Exception as e:
                print(f"[SupabaseStorage] lead_action error: {e}")

        return updated_project

    def ai_allocate_tasks(self, project_id: str) -> List[TaskItem]:
        """
        Run Dynamic AI Workforce Allocation:
        Sends dynamic project details and all 40 employee details to the AI model (Gemini / Groq),
        allocating work based on skill match, workload limit (<= 70%), experience, and previous project relevance.
        """
        project = self.get_project(project_id)
        if not project:
            return []

        all_employees = get_all_employees()
        phases = project.analysis.timeline_breakdown.phases

        # ── 1. Primary: Dynamic AI-Powered Allocator (Gemini / Groq) ───────────
        allocated_tasks: List[TaskItem] = []
        try:
            allocated_tasks = analyzer_instance.allocate_tasks_with_ai(
                project_id=project.id,
                project_name=project.name,
                project_description=project.description,
                project_requirements=project.requirements or "",
                phases=phases,
                employees=all_employees,
            )
            if allocated_tasks:
                print(f"[Storage] Dynamic AI allocated {len(allocated_tasks)} tasks for project {project_id}")
        except Exception as e:
            print(f"[Storage] Dynamic AI allocation error: {e} — cascading to fallback engine")

        # ── 2. Secondary Fallback: Elite Engine ────────────────────────────────
        if not allocated_tasks and _ELITE_ENGINE_AVAILABLE:
            try:
                llm_client = getattr(analyzer_instance, "client", None)
                elite_engine = get_elite_engine(llm_client=llm_client)
                allocated_tasks = elite_engine.allocate(
                    project_id=project.id,
                    project_name=project.name,
                    project_description=project.description,
                    phases=phases,
                    employees=all_employees,
                )
                if allocated_tasks:
                    print(f"[Storage] Elite engine allocated {len(allocated_tasks)} tasks for project {project_id}")
            except Exception as e:
                print(f"[Storage] Elite engine error: {e} — cascading to legacy allocator")

        # ── 3. Tertiary Fallback: Algorithmic Multi-Factor Allocator ───────────
        if not allocated_tasks:
            print(f"[Storage] Using algorithmic allocator for project {project_id}")
            allocated_tasks = analyzer_instance.allocate_tasks_to_employees(
                project_id=project.id,
                project_name=project.name,
                project_description=project.description,
                phases=phases,
                employees=all_employees,
            )

        # ── 4. Persist Allocated Tasks to Supabase & Local Cache ───────────────
        if allocated_tasks:
            for t in allocated_tasks:
                self._tasks_cache[t.id] = t

            if self.client:
                try:
                    now_iso = datetime.now().isoformat()
                    # Clean previous tasks for this project and insert newly allocated tasks
                    self.client.table("tasks").delete().eq("project_id", project_id).execute()
                    for t in allocated_tasks:
                        t_dict = self._serialize_task_row(t)
                        t_dict["created_at"] = now_iso
                        self.client.table("tasks").insert(t_dict).execute()
                    print(f"[Storage] Successfully stored {len(allocated_tasks)} tasks to Supabase for project {project_id}")
                except Exception as db_err:
                    print(f"[SupabaseStorage] Notice saving allocated tasks to Supabase: {db_err}")

        return allocated_tasks

    def confirm_task_allocation(self, project_id: str, tasks: List[TaskItem]) -> bool:
        """Save confirmed AI-allocated tasks to database and update project status."""
        project = self.get_project(project_id)
        if not project:
            return False

        now_iso = datetime.now().isoformat()
        
        # Mark project as ai_work_allocated
        updated_dict = project.model_dump()
        updated_dict["ai_work_allocated"] = True
        updated_dict["updated_at"] = now_iso
        updated_project = Project(**updated_dict)

        if self.client:
            try:
                row_data = self._serialize_project_row(updated_project)
                self.client.table("projects").update(row_data).eq("id", project_id).execute()

                # Replace old tasks for this project
                self.client.table("tasks").delete().eq("project_id", project_id).execute()

                for t in tasks:
                    t_dict = self._serialize_task_row(t)
                    t_dict["created_at"] = now_iso
                    self.client.table("tasks").insert(t_dict).execute()

                return True
            except Exception as e:
                print(f"[SupabaseStorage] confirm_task_allocation error: {e}")
                return False
        return True

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
        clean = email.lower().strip()
        user = DEMO_USERS.get(clean)
        if user:
            return user
        
        # Check against the 40 employees dataset
        emp = get_employee_by_email_or_name(clean)
        if emp:
            return User(
                id=emp["id"],
                email=emp["email"],
                name=emp["name"],
                role=role or emp.get("role", "employee"),
                title=emp["designation"],
                avatar_color=emp["avatar_color"]
            )
        
        role_to_assign: UserRole = role or "employee"
        name = clean.split("@")[0].replace(".", " ").title()
        return User(
            id=f"usr_{uuid.uuid4().hex[:8]}",
            email=email,
            name=name,
            role=role_to_assign,
            title="Team Member",
            avatar_color="bg-slate-600"
        )

    def get_employee_user(self, emp_num: int, email: Optional[str] = None) -> User:
        emp = get_employee_by_num(emp_num)
        if not emp:
            emp = get_employee_by_id(f"emp_{emp_num:02d}")
            
        if emp:
            return User(
                id=emp["id"],
                email=email if email else emp["email"],
                name=emp["name"],
                role=emp.get("role", "employee"),
                title=emp["designation"],
                avatar_color=emp["avatar_color"]
            )
            
        # Fallback default
        return User(
            id=f"emp_{emp_num:02d}",
            email=email if email else f"emp_{emp_num:02d}@company.ai",
            name=f"Employee {emp_num}",
            role="employee",
            title="Software Developer",
            avatar_color="bg-indigo-600"
        )

    def get_assigned_project_for_employee(self, emp_num: int) -> Optional[Project]:
        emp = get_employee_by_num(emp_num)
        emp_id = emp["id"] if emp else f"emp_{emp_num:02d}"
        emp_name = emp["name"] if emp else f"Employee {emp_num}"

        # Check if employee has direct assigned tasks
        if self.client:
            try:
                task_res = self.client.table("tasks").select("project_id").ilike("assigned_to", f"%{emp_name}%").limit(1).execute()
                if task_res.data and len(task_res.data) > 0:
                    matched_proj_id = task_res.data[0].get("project_id")
                    if matched_proj_id:
                        proj = self.get_project(matched_proj_id)
                        if proj:
                            return proj
            except Exception as e:
                print(f"[SupabaseStorage] get_assigned_project_for_employee query notice: {e}")

        projects = self.list_projects()
        if not projects:
            return None
        # Return first active project or fallback
        active_projects = [p for p in projects if p.status in ("Active", "Pending Lead Review", "Planning")]
        if active_projects:
            return active_projects[(emp_num - 1) % len(active_projects)]
        return projects[(emp_num - 1) % len(projects)]


    # ================= ACTIVITIES & MULTI-ROLE REAL-TIME NOTIFICATIONS =================
    def create_activity(
        self,
        event_type: ActivityEventType,
        project_id: str,
        project_name: str,
        task_id: Optional[str] = None,
        task_title: Optional[str] = None,
        employee_id: Optional[str] = None,
        employee_name: Optional[str] = None,
        employee_role: Optional[str] = None,
        from_status: Optional[str] = None,
        to_status: Optional[str] = None,
        message: Optional[str] = None
    ) -> ActivityLog:
        now_iso = datetime.now().isoformat()
        act_id = f"act_{uuid.uuid4().hex[:10]}"

        if not message:
            if event_type == "task_completed":
                message = f"{employee_name or 'Employee'} ({employee_role or 'Staff'}) marked deliverable '{task_title or 'Deliverable'}' as COMPLETED in {project_name} ✅"
            elif event_type == "task_started":
                message = f"{employee_name or 'Employee'} started working on '{task_title or 'Deliverable'}' in {project_name} ⚡"
            elif event_type == "task_reopened":
                message = f"{employee_name or 'Employee'} moved '{task_title or 'Deliverable'}' to {to_status or 'To Do'} in {project_name} ↺"
            elif event_type == "task_claimed":
                message = f"{employee_name or 'Employee'} ({employee_role or 'Staff'}) claimed deliverable '{task_title}' in {project_name} 📌"
            elif event_type == "project_accepted":
                message = f"Project Lead Ishita Rao accepted project '{project_name}' for active execution 🚀"
            else:
                message = f"Activity logged for project '{project_name}'"

        activity = ActivityLog(
            id=act_id,
            event_type=event_type,
            project_id=project_id,
            project_name=project_name,
            task_id=task_id,
            task_title=task_title,
            employee_id=employee_id,
            employee_name=employee_name,
            employee_role=employee_role,
            from_status=from_status,
            to_status=to_status,
            message=message,
            timestamp=now_iso
        )

        # Store in-memory for instant reactive access
        self._activities.insert(0, activity)
        if len(self._activities) > 200:
            self._activities = self._activities[:200]

        # Best-effort persist to Supabase activities table
        if self.client:
            try:
                self.client.table("activities").insert(activity.model_dump()).execute()
            except Exception:
                pass

        return activity

    def list_activities(self, project_id: Optional[str] = None, limit: int = 30) -> List[ActivityLog]:
        """Retrieve recent activity logs from Supabase or fallback memory store."""
        if self.client:
            try:
                q = self.client.table("activities").select("*").order("timestamp", desc=True)
                if project_id:
                    q = q.eq("project_id", project_id)
                res = q.limit(limit).execute()
                if res.data and len(res.data) > 0:
                    return [ActivityLog(**a) for a in res.data if isinstance(a, dict)]
            except Exception:
                pass

        if project_id:
            return [a for a in self._activities if a.project_id == project_id][:limit]
        return self._activities[:limit]

    # ================= TASKS & SPRINT DELIVERABLES =================
    def list_tasks(
        self, 
        project_id: Optional[str] = None, 
        assigned_to: Optional[str] = None, 
        assigned_emp_id: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[TaskItem]:
        cached_list = list(self._tasks_cache.values())
        if not self.client:
            tasks = cached_list
        else:
            try:
                def _do_query():
                    query = self.client.table("tasks").select("*")
                    if project_id:
                        query = query.eq("project_id", project_id)

                    resolved_name: Optional[str] = None

                    if assigned_emp_id:
                        emp = get_employee_by_id(assigned_emp_id)
                        if emp:
                            resolved_name = emp.get("name")
                        else:
                            resolved_name = assigned_emp_id
                    elif assigned_to:
                        emp = get_employee_by_email_or_name(assigned_to)
                        if emp:
                            resolved_name = emp.get("name")
                        else:
                            resolved_name = assigned_to

                    if resolved_name:
                        query = query.ilike("assigned_to", f"%{resolved_name}%")

                    if status and status != "ALL":
                        query = query.eq("status", status)

                    return query.order("due_day", desc=False).order("created_at", desc=True).execute()

                res = self._execute_with_retry(_do_query)
                if res.data:
                    tasks = [self._deserialize_task(t) for t in res.data if isinstance(t, dict)]
                    for t in tasks:
                        self._tasks_cache[t.id] = t
                    return tasks
                return []
            except Exception as e:
                print(f"[SupabaseStorage] list_tasks error: {e}")
                tasks = cached_list

        # Filter from cached list if query failed
        if project_id:
            tasks = [t for t in tasks if t.project_id == project_id]
        if status and status != "ALL":
            tasks = [t for t in tasks if t.status == status]
        if assigned_to:
            tasks = [t for t in tasks if assigned_to.lower() in t.assigned_to.lower()]
        return tasks

    def update_task_status(self, task_id: str, new_status: TaskStatus) -> Optional[TaskItem]:
        if not self.client:
            return None

        existing_task: Optional[TaskItem] = None
        try:
            res_prev = self.client.table("tasks").select("*").eq("id", task_id).limit(1).execute()
            if res_prev.data and len(res_prev.data) > 0 and isinstance(res_prev.data[0], dict):
                existing_task = self._deserialize_task(res_prev.data[0])
        except Exception as e:
            print(f"[SupabaseStorage] Notice fetching existing task {task_id}: {e}")

        try:
            res = self.client.table("tasks").update({
                "status": new_status
            }).eq("id", task_id).execute()

            if res.data and len(res.data) > 0 and isinstance(res.data[0], dict):
                updated_task = self._deserialize_task(res.data[0])
                from_stat = existing_task.status if existing_task else "To Do"

                if new_status == "Completed":
                    evt: ActivityEventType = "task_completed"
                    msg = f"{updated_task.assigned_to} ({updated_task.assigned_role}) marked '{updated_task.title}' as COMPLETED in {updated_task.project_name} ✅"
                elif new_status == "In Progress":
                    evt: ActivityEventType = "task_started"
                    msg = f"{updated_task.assigned_to} ({updated_task.assigned_role}) started execution on '{updated_task.title}' in {updated_task.project_name} ⚡"
                else:
                    evt: ActivityEventType = "task_reopened"
                    msg = f"{updated_task.assigned_to} ({updated_task.assigned_role}) moved '{updated_task.title}' to {new_status} in {updated_task.project_name} ↺"

                self.create_activity(
                    event_type=evt,
                    project_id=updated_task.project_id,
                    project_name=updated_task.project_name,
                    task_id=updated_task.id,
                    task_title=updated_task.title,
                    employee_id=updated_task.assigned_emp_id,
                    employee_name=updated_task.assigned_to,
                    employee_role=updated_task.assigned_role,
                    from_status=from_stat,
                    to_status=new_status,
                    message=msg
                )

                return updated_task
            return None
        except Exception as e:
            print(f"[SupabaseStorage] update_task_status error: {e}")
            return None

    def claim_task(self, task_id: str, employee_id: str, employee_name: Optional[str] = None) -> Optional[TaskItem]:
        emp = get_employee_by_id(employee_id) or get_employee_by_email_or_name(employee_id)
        final_emp_id = emp["id"] if emp else employee_id
        final_emp_name = emp["name"] if emp else (employee_name or employee_id)
        final_emp_role = emp.get("designation", "Software Engineer") if emp else "Staff"

        if not self.client:
            return None

        try:
            res = self.client.table("tasks").update({
                "assigned_to": final_emp_name,
                "assigned_role": final_emp_role
            }).eq("id", task_id).execute()

            if res.data and len(res.data) > 0 and isinstance(res.data[0], dict):
                updated_task = self._deserialize_task(res.data[0])
                self.create_activity(
                    event_type="task_claimed",
                    project_id=updated_task.project_id,
                    project_name=updated_task.project_name,
                    task_id=updated_task.id,
                    task_title=updated_task.title,
                    employee_id=final_emp_id,
                    employee_name=final_emp_name,
                    employee_role=final_emp_role,
                    to_status=updated_task.status,
                    message=f"{final_emp_name} ({final_emp_role}) claimed '{updated_task.title}' in {updated_task.project_name} 📌"
                )
                return updated_task
            return None
        except Exception as e:
            print(f"[SupabaseStorage] claim_task error: {e}")
            return None

    def get_project_sprint_summary(self, project_id: str) -> Optional[ProjectSprintSummary]:
        project = self.get_project(project_id)
        if not project:
            return None

        tasks = self.list_tasks(project_id=project_id)
        total = len(tasks)
        completed = sum(1 for t in tasks if t.status == "Completed")
        in_progress = sum(1 for t in tasks if t.status == "In Progress")
        todo = sum(1 for t in tasks if t.status == "To Do")
        overall_progress = round((completed / total * 100)) if total > 0 else 0

        emp_map: Dict[str, Dict] = {}
        for t in tasks:
            emp_key = t.assigned_emp_id or t.assigned_to or "unassigned"
            if emp_key not in emp_map:
                emp_map[emp_key] = {
                    "employee_id": t.assigned_emp_id or "unassigned",
                    "employee_name": t.assigned_to or "Unassigned",
                    "designation": t.assigned_role or "Engineer",
                    "total_tasks": 0,
                    "completed_tasks": 0,
                    "in_progress_tasks": 0,
                    "todo_tasks": 0
                }
            emp_map[emp_key]["total_tasks"] += 1
            if t.status == "Completed":
                emp_map[emp_key]["completed_tasks"] += 1
            elif t.status == "In Progress":
                emp_map[emp_key]["in_progress_tasks"] += 1
            else:
                emp_map[emp_key]["todo_tasks"] += 1

        breakdown: List[EmployeeSprintStats] = []
        for e in emp_map.values():
            tot = e["total_tasks"]
            comp = e["completed_tasks"]
            rate = round((comp / tot * 100)) if tot > 0 else 0
            breakdown.append(EmployeeSprintStats(
                employee_id=e["employee_id"],
                employee_name=e["employee_name"],
                designation=e["designation"],
                total_tasks=tot,
                completed_tasks=comp,
                in_progress_tasks=e["in_progress_tasks"],
                todo_tasks=e["todo_tasks"],
                completion_rate=rate
            ))

        stages = self.get_project_stages(project_id)
        recent_acts = self.list_activities(project_id=project_id, limit=10)

        return ProjectSprintSummary(
            project_id=project.id,
            project_name=project.name,
            total_deliverables=total,
            completed_deliverables=completed,
            in_progress_deliverables=in_progress,
            todo_deliverables=todo,
            overall_progress_percent=overall_progress,
            assigned_employees_count=len(breakdown),
            employee_breakdown=breakdown,
            stages=stages,
            recent_activities=recent_acts
        )

    def ensure_seeded_data(self):
        """Seed realistic enterprise projects & multi-role allocations across 40 employees if database is empty."""
        try:
            if not self.client:
                return
            res = self.client.table("projects").select("id").limit(1).execute()
            if res.data and len(res.data) > 0:
                print(f"[SupabaseStorage] Database already initialized.")
                return

            print("[SupabaseStorage] Seeding initial projects with multi-role deliverable allocations across 40 employees...")
            
            p1_create = ProjectCreate(
                name="CloudCommerce Enterprise AI Platform",
                description="Next-generation intelligent omnichannel retail platform featuring real-time AI product recommendations, automated inventory balancing, high-concurrency payment processing, and interactive merchant dashboards.",
                expected_days=45,
                available_employees=8,
                requirements="1. Next.js 15 frontend with responsive merchant and shopper portals.\n2. High-performance FastAPI backend with PostgreSQL and pgvector for AI semantic search.\n3. Microservices payment integration with Stripe and webhook callbacks.\n4. Real-time WebSocket order tracking and notifications.\n5. Automated CI/CD pipeline with Docker and Kubernetes on AWS."
            )
            p1 = self.create_project(p1_create)
            self.lead_action(p1.id, "accept")

            # Mark a couple of tasks completed/in-progress for live demo state
            p1_tasks = self.list_tasks(project_id=p1.id)
            if p1_tasks:
                if len(p1_tasks) > 0:
                    self.update_task_status(p1_tasks[0].id, "Completed")
                if len(p1_tasks) > 1:
                    self.update_task_status(p1_tasks[1].id, "Completed")
                if len(p1_tasks) > 2:
                    self.update_task_status(p1_tasks[2].id, "In Progress")
                if len(p1_tasks) > 3:
                    self.update_task_status(p1_tasks[3].id, "In Progress")

            p2_create = ProjectCreate(
                name="FinTech Real-Time Payments Engine",
                description="High-security financial settlement gateway with sub-millisecond fraud detection, multi-currency ledger accounting, automated compliance reporting, and PCI-DSS compliant vault storage.",
                expected_days=30,
                available_employees=6,
                requirements="1. Distributed ledger architecture with PostgreSQL and Redis caching.\n2. Machine learning real-time fraud scoring pipeline.\n3. Bank-grade OAuth2 and mTLS authentication.\n4. Automated end-to-end reconciliation and daily settlement reporting."
            )
            p2 = self.create_project(p2_create)
            self.lead_action(p2.id, "accept")

            p2_tasks = self.list_tasks(project_id=p2.id)
            if p2_tasks and len(p2_tasks) > 0:
                self.update_task_status(p2_tasks[0].id, "Completed")
                if len(p2_tasks) > 1:
                    self.update_task_status(p2_tasks[1].id, "In Progress")

            print(f"[SupabaseStorage] Successfully seeded 2 enterprise projects ({p1.id}, {p2.id})!")
        except Exception as e:
            print(f"[SupabaseStorage] ensure_seeded_data notice: {e}")

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
            if res.data and len(res.data) > 0:
                return [MeetingItem(**m) for m in res.data if isinstance(m, dict)]
            return []
        except Exception as e:
            print(f"[SupabaseStorage] list_meetings error: {e}")
            return []
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

        created_meeting = MeetingItem(**meeting_data)

        # Trigger n8n Automated Assignment & Reminder Email Workflow
        try:
            from services.n8n_service import n8n_service
            project = self.get_project(payload.project_id) if payload.project_id else None
            n8n_service.trigger_for_meeting(created_meeting, project)
        except Exception as e:
            print(f"[SupabaseStorage] n8n trigger notice: {e}")

        return created_meeting

    def delete_meeting(self, meeting_id: str) -> bool:
        if not self.client:
            return False
        try:
            self.client.table("meetings").delete().eq("id", meeting_id).execute()
            return True
        except Exception as e:
            print(f"[SupabaseStorage] delete_meeting error: {e}")
            return False
