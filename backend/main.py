import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

from models.schemas import (
    Project, ProjectCreate, DashboardKPIs, SimulationRequest,
    SimulationResponse, User, LoginRequest, LoginResponse,
    TaskItem, TaskStatusUpdate
)
from db.storage import storage
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
    """Authenticate user with email and role selection."""
    user = storage.authenticate_user(payload.email, payload.role)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return LoginResponse(
        user=user,
        token=f"jwt_mock_{user.id}_{user.role}",
        message=f"Successfully authenticated as {user.name} ({user.role})"
    )

@app.get("/api/auth/users", response_model=List[User])
def get_demo_users():
    """Retrieve demo accounts for quick role selection."""
    from db.storage import DEMO_USERS
    return list(DEMO_USERS.values())

# ================= TASKS & SPRINTS (Lead & Employee) =================
@app.get("/api/tasks", response_model=List[TaskItem])
def get_tasks(
    project_id: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    """Retrieve tasks with optional filters."""
    return storage.list_tasks(project_id, assigned_to, status)

@app.put("/api/tasks/{task_id}/status", response_model=TaskItem)
def update_task_status(task_id: str, payload: TaskStatusUpdate):
    """Update task execution status (To Do, In Progress, Completed)."""
    task = storage.update_task_status(task_id, payload.status)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
