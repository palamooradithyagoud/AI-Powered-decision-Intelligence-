import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict
from dotenv import load_dotenv

load_dotenv()

from models.schemas import (
    Project, ProjectCreate, DashboardKPIs, SimulationRequest,
    SimulationResponse, User, LoginRequest, LoginResponse,
    TaskItem, TaskStatusUpdate, MeetingItem, MeetingCreate,
    EmployeeModel, LeadActionPayload, AITaskAllocationResponse,
    ConfirmTaskAllocationPayload, ActivityLog, ClaimTaskPayload,
    ProjectSprintSummary
)

from db.storage import storage
from db.employees_data import (
    EMPLOYEES_DATA,
    get_all_employees,
    get_employee_by_num,
    get_employee_by_id,
    get_employee_by_email_or_name,
    authenticate_employee
)
from services.ai_analyzer import analyzer_instance

app = FastAPI(
    title="AI Project Planning & Feasibility System - Manager & Multi-Role API",
    description="Enterprise REST API for Manager Project Scoping, AI Feasibility Evaluation, Resource Estimation, Project Lead Sprint Tracking, and Employee Task Execution.",
    version="1.1.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "manager-ai-planning-api",
        "gemini_active": analyzer_instance.client is not None
    }

# ================= AUTH ENDPOINTS =================
@app.post("/api/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    """Authenticate user with email, employee ID (emp_01 - emp_40), or name."""
    identifier = payload.email.strip()
    password = payload.password.strip()

    # 1. Check if it matches an employee in the 40-employee dataset
    emp = authenticate_employee(identifier, password)
    if emp:
        role = payload.role or emp.get("role", "employee")
        user = User(
            id=emp["id"],
            email=emp["email"],
            name=emp["name"],
            role=role,
            title=emp["designation"],
            avatar_color=emp["avatar_color"]
        )
        return LoginResponse(
            user=user,
            token=f"jwt_{user.id}_{user.role}",
            message=f"Successfully authenticated as {user.name} ({user.title})"
        )

    # 2. Standard role users check (manager@company.ai, lead@company.ai, etc.)
    user = storage.authenticate_user(payload.email, payload.role)
    if user:
        return LoginResponse(
            user=user,
            token=f"jwt_{user.id}_{user.role}",
            message=f"Successfully authenticated as {user.name} ({user.role})"
        )

    raise HTTPException(status_code=401, detail="Invalid credentials. Please use your Employee ID (emp_01 to emp_40) or registered email.")

@app.get("/api/auth/users", response_model=List[User])
def get_demo_users():
    """Retrieve primary demo accounts for quick role selection."""
    from db.storage import DEMO_USERS
    return list(DEMO_USERS.values())

# ================= EMPLOYEE DIRECTORY & PROFILES =================
@app.get("/api/employees", response_model=List[EmployeeModel])
def list_employees(
    search: Optional[str] = Query(None, description="Search by name, ID, designation, or skills"),
    role: Optional[str] = Query(None, description="Filter by role: manager, project_lead, employee"),
    designation: Optional[str] = Query(None, description="Filter by designation")
):
    """Retrieve all 40 employees loaded directly from EMPLOYEE_ID.xlsx."""
    employees = get_all_employees()
    
    if search:
        s = search.lower().strip()
        filtered = []
        for e in employees:
            if (s in e["name"].lower() or 
                s in e["id"].lower() or 
                s in e["designation"].lower() or 
                s in e["email"].lower() or
                any(s in sk.lower() for sk in e.get("skills", []))):
                filtered.append(e)
        employees = filtered

    if role:
        r = role.lower().strip()
        employees = [e for e in employees if e.get("role", "employee").lower() == r]

    if designation:
        d = designation.lower().strip()
        employees = [e for e in employees if d in e["designation"].lower()]

    return [EmployeeModel(**e) for e in employees]

@app.get("/api/employees/{emp_identifier}", response_model=EmployeeModel)
def get_employee(emp_identifier: str):
    """Retrieve a single employee by serial number (1-40) or employee ID (emp_01 - emp_40)."""
    emp = get_employee_by_id(emp_identifier) or get_employee_by_email_or_name(emp_identifier)
    if not emp:
        raise HTTPException(status_code=404, detail=f"Employee '{emp_identifier}' not found in EMPLOYEE_ID.xlsx")
    return EmployeeModel(**emp)

@app.get("/api/employee/profile/{emp_identifier}")
def get_emp_profile(emp_identifier: str):
    """Retrieve employee profile for employee dashboard."""
    emp = get_employee_by_id(emp_identifier) or get_employee_by_email_or_name(emp_identifier)
    if not emp:
        # Fallback to integer lookup if numeric
        if emp_identifier.isdigit():
            emp = get_employee_by_num(int(emp_identifier))
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp

@app.get("/api/employee/project/{emp_identifier}", response_model=Optional[Project])
def get_emp_project(emp_identifier: str):
    """Get the active project assigned to this employee."""
    num = 1
    if emp_identifier.isdigit():
        num = int(emp_identifier)
    elif emp_identifier.lower().startswith("emp_"):
        suffix = emp_identifier.lower().split("_")[1]
        if suffix.isdigit():
            num = int(suffix)
    return storage.get_assigned_project_for_employee(num)


@app.get("/api/projects/{project_id}/stages", response_model=Dict[str, str])
def get_stages(project_id: str):
    return storage.get_project_stages(project_id)

from pydantic import BaseModel
from typing import Literal

class UpdateStagePayload(BaseModel):
    stage_name: str
    status: Literal["To Do", "In Progress", "Review", "Completed"]

@app.put("/api/projects/{project_id}/stages", response_model=Dict[str, str])
def update_stage(project_id: str, payload: UpdateStagePayload):
    return storage.update_project_stage(project_id, payload.stage_name, payload.status)

# ================= TASKS & SPRINTS (Lead & Employee) =================
@app.get("/api/tasks", response_model=List[TaskItem])
def get_tasks(
    project_id: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    assigned_emp_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    """Retrieve tasks with optional filters."""
    return storage.list_tasks(project_id, assigned_to, assigned_emp_id, status)

@app.put("/api/tasks/{task_id}/status", response_model=TaskItem)
def update_task_status(task_id: str, payload: TaskStatusUpdate):
    """Update task execution status (To Do, In Progress, Completed) and broadcast real-time sync."""
    task = storage.update_task_status(task_id, payload.status)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.post("/api/tasks/{task_id}/claim", response_model=TaskItem)
def claim_task(task_id: str, payload: ClaimTaskPayload):
    """Allow an employee to self-assign / claim a deliverable."""
    task = storage.claim_task(task_id, payload.employee_id, payload.employee_name)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

# ================= MULTI-ROLE REAL-TIME ACTIVITIES & AUDIT STREAM =================
@app.get("/api/activities", response_model=List[ActivityLog])
def list_activities(
    project_id: Optional[str] = Query(None, description="Filter activities by project"),
    limit: int = Query(25, ge=1, le=100, description="Max activities to retrieve")
):
    """Retrieve real-time audit feed of task completions and sprint actions for Lead & Manager."""
    return storage.list_activities(project_id=project_id, limit=limit)

@app.get("/api/projects/{project_id}/sprint-summary", response_model=ProjectSprintSummary)
def get_project_sprint_summary(project_id: str):
    """Get real-time sprint execution progress, employee deliverables breakdown, and recent activity."""
    summary = storage.get_project_sprint_summary(project_id)
    if not summary:
        raise HTTPException(status_code=404, detail="Project not found")
    return summary

# ================= MANAGER PROJECT PLANNING =================
@app.get("/api/kpis", response_model=DashboardKPIs)
def get_kpis():
    """Returns top-level KPIs for the Manager Dashboard."""
    return storage.get_kpis()

@app.get("/api/projects", response_model=List[Project])
def list_projects(
    search: Optional[str] = Query(None, description="Search term for project name or description"),
    feasibility: Optional[str] = Query(None, description="Filter by feasibility status: FEASIBLE, FEASIBLE WITH CHANGES, NOT FEASIBLE"),
    status: Optional[str] = Query(None, description="Filter by project status: Active, Completed, At-Risk")
):
    """Retrieve all projects with optional filtering."""
    projects = storage.list_projects()

    if search:
        s = search.lower()
        projects = [p for p in projects if s in p.name.lower() or s in p.description.lower()]

    if feasibility:
        projects = [p for p in projects if p.analysis.feasibility.status.upper() == feasibility.upper()]

    if status:
        projects = [p for p in projects if p.status.lower() == status.lower()]

    return projects

@app.get("/api/projects/{project_id}", response_model=Project)
def get_project(project_id: str):
    """Get single project with complete AI blueprint."""
    project = storage.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.post("/api/projects", response_model=Project, status_code=201)
def create_project(data: ProjectCreate):
    """Create a new project and immediately run comprehensive AI planning and feasibility analysis."""
    try:
        project = storage.create_project(data)
        return project
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze and create project: {str(e)}")

@app.post("/api/projects/{project_id}/reanalyze", response_model=Project)
def reanalyze_project(project_id: str, data: Optional[ProjectCreate] = None):
    """Re-run AI analysis on an existing project with updated parameters."""
    project = storage.reanalyze_project(project_id, data)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.post("/api/projects/{project_id}/send-to-lead", response_model=Project)
def send_to_lead(project_id: str):
    """Dispatch project directly to the Project Lead for execution and scheduling."""
    project = storage.send_to_lead(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.post("/api/projects/{project_id}/lead-action", response_model=Project)
def lead_action(project_id: str, payload: LeadActionPayload):
    """Project Lead decision: Accept or Reject project with structured reasoning."""
    project = storage.lead_action(project_id, payload.action, payload.rejection_reason)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.post("/api/projects/{project_id}/ai-allocate-tasks", response_model=AITaskAllocationResponse)
def ai_allocate_tasks(project_id: str):
    """Run AI Smart Work Allocation matching project deliverables against all 40 employees."""
    project = storage.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    tasks = storage.ai_allocate_tasks(project_id)
    phase_count = len(project.analysis.timeline_breakdown.phases)
    summary = (
        f"Elite AI Workforce Allocation Engine evaluated all 40 employees across "
        f"{len(tasks)} deliverables in {phase_count} phases. "
        f"Scoring: Semantic Skill (35%) · Workload Capacity (25%) · "
        f"Relevant Experience (15%) · Deadline Availability (15%) · "
        f"Performance (10%). Hard constraints enforced. Global optimization applied."
    )
    
    return AITaskAllocationResponse(
        project_id=project.id,
        project_name=project.name,
        tasks=tasks,
        summary=summary
    )

@app.post("/api/projects/{project_id}/confirm-tasks")
def confirm_tasks(project_id: str, payload: ConfirmTaskAllocationPayload):
    """Save confirmed AI-allocated tasks to database and dispatch to employees."""
    success = storage.confirm_task_allocation(project_id, payload.tasks)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save task allocations")
    return {"message": "Tasks successfully dispatched to employee workbench", "count": len(payload.tasks)}


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str):
    """Delete a project."""
    success = storage.delete_project(project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project successfully deleted", "id": project_id}

@app.post("/api/simulate", response_model=SimulationResponse)
def simulate_feasibility(payload: SimulationRequest):
    """
    Real-time 'What-If' simulator: recalculates feasibility and resource stats
    dynamically as the manager adjusts timeline days and available team size.
    """
    if payload.base_analysis:
        base_analysis = payload.base_analysis
    elif payload.project_id:
        proj = storage.get_project(payload.project_id)
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found for simulation")
        base_analysis = proj.analysis
    else:
        raise HTTPException(status_code=400, detail="Must provide either project_id or base_analysis")

    sim_res = analyzer_instance.simulate_adjustments(
        base_analysis=base_analysis,
        new_days=payload.expected_days,
        new_employees=payload.available_employees
    )

    return SimulationResponse(
        expected_days=sim_res["expected_days"],
        available_employees=sim_res["available_employees"],
        employee_analysis=sim_res["employee_analysis"],
        feasibility=sim_res["feasibility"],
        timeline_breakdown=sim_res["timeline_breakdown"],
        ai_recommendation=sim_res["ai_recommendation"]
    )

# ================= MEETINGS & CALENDAR ENDPOINTS =================
@app.get("/api/meetings", response_model=List[MeetingItem])
def list_meetings(
    date: Optional[str] = Query(None, description="Filter meetings by date YYYY-MM-DD"),
    project_id: Optional[str] = Query(None, description="Filter by project")
):
    """Retrieve scheduled team meetings and calendar events."""
    return storage.list_meetings(date=date, project_id=project_id)

@app.post("/api/meetings", response_model=MeetingItem)
def create_meeting(payload: MeetingCreate):
    """Schedule and create a new project meeting on the calendar."""
    return storage.create_meeting(payload)

@app.delete("/api/meetings/{meeting_id}")
def delete_meeting(meeting_id: str):
    """Cancel / remove a meeting from the calendar."""
    success = storage.delete_meeting(meeting_id)
    if not success:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return {"status": "success", "message": f"Meeting {meeting_id} deleted"}

# ================= N8N WORKFLOW INTEGRATION ENDPOINTS =================
@app.get("/api/integrations/n8n/status")
def get_n8n_status():
    """Check n8n webhook configuration and target nodes."""
    from services.n8n_service import n8n_service
    return n8n_service.get_status()

@app.get("/api/integrations/n8n/workflow")
def get_n8n_workflow():
    """Retrieve the n8n workflow definition JSON."""
    workflow_path = os.path.join(os.path.dirname(__file__), "integrations", "n8n_assignment_workflow.json")
    if os.path.exists(workflow_path):
        import json
        with open(workflow_path, "r", encoding="utf-8") as f:
            return json.load(f)
    raise HTTPException(status_code=404, detail="n8n workflow definition not found")

@app.post("/api/integrations/n8n/trigger-meeting-reminder")
def trigger_n8n_meeting_reminder(payload: MeetingCreate):
    """Explicitly trigger n8n Project Assignment & Reminder Email workflow for a meeting."""
    from services.n8n_service import n8n_service
    meeting_item = storage.create_meeting(payload)
    project = storage.get_project(payload.project_id) if payload.project_id else None
    result = n8n_service.trigger_for_meeting(meeting_item, project)
    return {
        "status": "success",
        "meeting": meeting_item,
        "n8n_dispatch": result
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
