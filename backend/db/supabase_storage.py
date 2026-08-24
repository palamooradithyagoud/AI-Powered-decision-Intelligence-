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

# Primary Demo Role Users mapped to EMPLOYEE_ID.xlsx records
DEMO_USERS: Dict[str, User] = {
    "manager@company.ai": User(
        id="emp_01",
        email="manager@company.ai",
        name="Arjun Reddy",
        role="manager",
        title="Project Manager",
        avatar_color="bg-indigo-600"
    ),
    "lead@company.ai": User(
        id="emp_18",
        email="lead@company.ai",
        name="Ishita Rao",
        role="project_lead",
        title="Product Manager / Sprint Lead",
        avatar_color="bg-purple-600"
    ),
    "employee@company.ai": User(
        id="emp_03",
        email="employee@company.ai",
        name="Rahul Kumar",
        role="employee",
        title="Frontend Developer",
        avatar_color="bg-emerald-600"
    ),
    "shivanallella@gmail.com": User(
        id="emp_06",
        email="shivanallella@gmail.com",
        name="Ananya Rao",
        role="employee",
        title="UI/UX Designer",
        avatar_color="bg-teal-600"
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
                    task_dict = t.model_dump()
                    task_dict["created_at"] = now_iso
                    try:
                        self.client.table("tasks").insert(task_dict).execute()
                    except Exception:
                        pass
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
        """Run AI Smart Work Allocation matching project deliverables against all 40 employees."""
        project = self.get_project(project_id)
        if not project:
            return []

        all_employees = get_all_employees()
        return analyzer_instance.allocate_tasks_to_employees(
            project_id=project.id,
            project_name=project.name,
            project_description=project.description,
            phases=project.analysis.timeline_breakdown.phases,
            employees=all_employees
        )

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
                    t_dict = t.model_dump()
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
                task_res = self.client.table("tasks").select("project_id").or_(f"assigned_emp_id.eq.{emp_id},assigned_to.ilike.%{emp_name}%").limit(1).execute()
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


    # ================= TASKS =================
    def list_tasks(
        self, 
        project_id: Optional[str] = None, 
        assigned_to: Optional[str] = None, 
        assigned_emp_id: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[TaskItem]:
        if not self.client:
            return []
        try:
            query = self.client.table("tasks").select("*")
            if project_id:
                query = query.eq("project_id", project_id)
            if assigned_emp_id and assigned_to:
                query = query.or_(f"assigned_emp_id.eq.{assigned_emp_id},assigned_to.ilike.%{assigned_to}%")
            elif assigned_emp_id:
                query = query.eq("assigned_emp_id", assigned_emp_id)
            elif assigned_to:
                query = query.ilike("assigned_to", f"%{assigned_to}%")
            if status and status != "ALL":
                query = query.eq("status", status)

            res = query.order("due_day", desc=False).order("created_at", desc=True).execute()
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
