import json
import os
import uuid
from datetime import datetime
from typing import List, Optional, Dict
from models.schemas import (
    Project, ProjectCreate, DashboardKPIs, User, UserRole,
    TaskItem, TaskStatus
)
from services.ai_analyzer import analyzer_instance

STORAGE_FILE = os.path.join(os.path.dirname(__file__), "projects_db.json")
TASKS_FILE = os.path.join(os.path.dirname(__file__), "tasks_db.json")

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
    "employee@company.ai": User(
        id="usr_employee_01",
        email="employee@company.ai",
        name="Devon Chen",
        role="employee",
        title="Full-Stack & AI Engineer",
        avatar_color="bg-emerald-600"
    )
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
                    role = "Frontend Developer" if "ui" in p.phase_name.lower() or "frontend" in p.phase_name.lower() else (
                        "Backend Developer" if "backend" in p.phase_name.lower() or "api" in p.phase_name.lower() else (
                            "AI/ML Engineer" if "ai" in p.phase_name.lower() or "ml" in p.phase_name.lower() else (
                                "QA Engineer" if "testing" in p.phase_name.lower() or "qa" in p.phase_name.lower() else "DevOps Engineer"
                            )
                        )
                    )

                    status = "Completed" if p.end_day < 15 else ("In Progress" if p.start_day <= 25 else "To Do")

                    task = TaskItem(
                        id=task_id,
                        project_id=proj.id,
                        project_name=proj.name,
                        phase_name=p.phase_name,
                        title=deliv,
                        description=f"Implement and verify {deliv} as part of Phase: {p.phase_name}",
                        assigned_role=role,
                        assigned_to="Devon Chen", # Our employee demo user
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
                task = TaskItem(
                    id=task_id,
                    project_id=proj_id,
                    project_name=data.name,
                    phase_name=p.phase_name,
                    title=deliv,
                    description=f"Deliverable for {p.phase_name}: {deliv}",
                    assigned_role="Frontend Developer" if "frontend" in p.phase_name.lower() or "ui" in p.phase_name.lower() else "Backend Developer",
                    assigned_to="Devon Chen",
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

storage = ProjectStorage()
