from typing import List, Optional, Dict, Literal
from pydantic import BaseModel, Field, field_validator

# User & Auth Models
UserRole = Literal["manager", "project_lead", "employee"]
RiskLevel = Literal["Low", "Medium", "High"]
RiskSeverity = Literal["Low", "Medium", "High", "Critical"]
FeasibilityStatus = Literal["Feasible", "Feasible with Changes", "Not Feasible"]

class User(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    title: str
    avatar_color: str

class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[UserRole] = None

class LoginResponse(BaseModel):
    user: User
    token: str
    message: str

# Task & Sprint Execution Models for Project Lead & Employee
TaskStatus = Literal["To Do", "In Progress", "Completed"]
TaskPriority = Literal["High", "Medium", "Low"]

class TaskItem(BaseModel):
    id: str
    project_id: str
    project_name: str
    phase_name: str
    title: str
    description: str
    assigned_role: str
    assigned_to: str = "Unassigned"
    assigned_emp_id: Optional[str] = None
    match_score: Optional[int] = None
    ai_rationale: Optional[str] = None
    status: TaskStatus = "To Do"
    priority: TaskPriority = "Medium"
    due_day: int = 10
    # ── Elite Allocation Metadata (optional — all backward compatible) ────────
    confidence: Optional[int] = None               # 0–100
    confidence_level: Optional[str] = None         # HIGH | MEDIUM | LOW
    risk: Optional[str] = None                     # LOW | MEDIUM | HIGH
    risk_reasons: Optional[List[str]] = None
    projected_workload: Optional[float] = None     # % after assignment
    estimated_hours: Optional[float] = None
    deadline_feasible: Optional[bool] = None       # True if capacity covers task hours
    allocation_strategy: Optional[str] = None      # balanced | deadline_critical | ...
    scoring_breakdown: Optional[Dict] = None       # {skill, workload, experience, ...}
    alternatives: Optional[List[Dict]] = None      # top 2 runner-up candidates

class TaskStatusUpdate(BaseModel):
    status: TaskStatus

class FeatureItem(BaseModel):
    name: str
    description: str
    complexity: Literal["Low", "Medium", "High"] = "Medium"
    rationale: Optional[str] = None

class MustNeedRequirement(BaseModel):
    category: str
    items: List[str]
    rationale: str

class RoleRequirement(BaseModel):
    role: str
    required_count: int
    rationale: str

class EmployeeAnalysis(BaseModel):
    roles: List[RoleRequirement]
    total_recommended: int
    total_available: int
    status: Literal["Sufficient", "Employee Shortage", "Resource Overload"]
    gap_delta: int # available - recommended
    analysis_summary: str

class PhaseTimeline(BaseModel):
    phase_name: str
    start_day: int
    end_day: int
    duration_days: int
    description: str
    key_deliverables: List[str]
    dependencies: List[str] = []

class TimelineBreakdown(BaseModel):
    phases: List[PhaseTimeline]
    total_calculated_days: int
    expected_days: int
    variance_days: int
    buffer_days: int

class TechRecommendation(BaseModel):
    layer: str # Frontend, Backend, Database, AI/ML, APIs, Cloud/Deployment, DevOps, Version Control
    technology: str
    rationale: str

class RiskItem(BaseModel):
    risk: str
    probability: RiskLevel
    impact: RiskLevel
    severity: RiskSeverity
    reason: str
    mitigation: str

class FeasibilityDimension(BaseModel):
    scope_score: int = Field(..., ge=0, le=100)
    timeline_score: int = Field(..., ge=0, le=100)
    manpower_score: int = Field(..., ge=0, le=100)
    technical_risk_score: int = Field(..., ge=0, le=100)
    complexity_score: int = Field(..., ge=0, le=100)

class FeasibilityAnalysis(BaseModel):
    status: FeasibilityStatus
    feasibility_score: int = Field(..., ge=0, le=100)
    dimensions: FeasibilityDimension
    key_verdict: str

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v: str) -> str:
        """Normalize AI-returned uppercase status strings to title-case literals."""
        mapping = {
            "FEASIBLE WITH CHANGES": "Feasible with Changes",
            "FEASIBLE": "Feasible",
            "NOT FEASIBLE": "Not Feasible",
        }
        return mapping.get(str(v).strip().upper(), v)

class SuggestedAdjustments(BaseModel):
    recommended_additional_employees: int
    recommended_timeline_extension_days: int
    optional_features_to_drop: List[str]
    critical_skills_needed: List[str]

class AIRecommendation(BaseModel):
    primary_advice: str
    actionable_steps: List[str]
    suggested_adjustments: SuggestedAdjustments

class ProjectSummary(BaseModel):
    what_it_is: str
    problem_solved: str
    what_needs_to_be_built: str

class ProjectFeatures(BaseModel):
    must_have: List[FeatureItem]
    optional: List[FeatureItem]

class AIAnalysisResult(BaseModel):
    summary: ProjectSummary
    features: ProjectFeatures
    must_need_requirements: List[MustNeedRequirement]
    employee_analysis: EmployeeAnalysis
    timeline_breakdown: TimelineBreakdown
    tools_and_technologies: List[TechRecommendation]
    risk_analysis: List[RiskItem]
    feasibility: FeasibilityAnalysis
    ai_recommendation: AIRecommendation
    engine: Optional[str] = "Google Gemini 3.6 Flash"

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: str = Field(..., min_length=10)
    expected_days: int = Field(..., gt=0, le=730)
    available_employees: int = Field(..., gt=0, le=200)
    requirements: str = Field(..., min_length=10)

LeadDecisionStatus = Literal["Pending Review", "Accepted", "Rejected", "None"]

class Project(BaseModel):
    id: str
    name: str
    description: str
    expected_days: int
    available_employees: int
    requirements: str
    status: Literal["Active", "Completed", "At-Risk", "Planning", "Pending Lead Review", "Rejected by Lead"] = "Active"
    sent_to_lead: bool = False
    lead_assigned: Optional[str] = "Ishita Rao"
    sent_to_lead_at: Optional[str] = None
    lead_status: LeadDecisionStatus = "None"
    rejection_reason: Optional[str] = None
    lead_accepted_at: Optional[str] = None
    lead_rejected_at: Optional[str] = None
    ai_work_allocated: bool = False
    created_at: str
    updated_at: str
    analysis: AIAnalysisResult

class LeadActionPayload(BaseModel):
    action: Literal["accept", "reject"]
    rejection_reason: Optional[str] = None

class AITaskAllocationResponse(BaseModel):
    project_id: str
    project_name: str
    tasks: List[TaskItem]
    summary: str

class EliteAllocationResponse(AITaskAllocationResponse):
    """Extended allocation response with engine metadata. Optional — frontend ignores unknown fields."""
    engine_version: str = "elite_v2.0"
    allocation_strategy: str = "balanced"
    total_candidates_evaluated: int = 0
    constraints_applied: List[str] = []
    allocation_metrics: Dict = {}

class ConfirmTaskAllocationPayload(BaseModel):
    project_id: str
    tasks: List[TaskItem]

class SimulationRequest(BaseModel):
    project_id: Optional[str] = None
    expected_days: int
    available_employees: int
    base_analysis: Optional[AIAnalysisResult] = None

class SimulationResponse(BaseModel):
    expected_days: int
    available_employees: int
    employee_analysis: EmployeeAnalysis
    feasibility: FeasibilityAnalysis
    timeline_breakdown: TimelineBreakdown
    ai_recommendation: AIRecommendation

class DashboardKPIs(BaseModel):
    total_projects: int
    active_projects: int
    completed_projects: int
    at_risk_projects: int
    feasible_count: int
    feasible_with_changes_count: int
    not_feasible_count: int

# Meeting & Calendar Models
MeetingType = Literal["Sprint Planning", "1-on-1 Review", "Architecture Sync", "Design Review", "Executive Briefing"]

class MeetingCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    project_id: Optional[str] = None
    project_name: Optional[str] = "General Sprint Planning"
    date: str # Format: YYYY-MM-DD
    start_time: str # "10:30 AM"
    end_time: str # "11:30 AM"
    duration_minutes: int = 60
    type: MeetingType = "Sprint Planning"
    attendees: List[str] = ["Alexander Vance", "Elena Rostova"]
    location_or_link: str = "Google Meet (meet.google.com/kuiper-sync)"
    agenda: str = ""

class MeetingItem(BaseModel):
    id: str
    title: str
    project_id: Optional[str] = None
    project_name: str
    date: str
    start_time: str
    end_time: str
    duration_minutes: int
    type: str
    attendees: List[str]
    location_or_link: str
    agenda: str
    created_at: str

class EmployeeModel(BaseModel):
    id: str
    serial_no: int
    name: str
    email: str
    designation: str
    role: UserRole = "employee"
    skills: List[str]
    experience: str
    experience_years: float = 3.0
    workload: int = 50
    availability_status: str = "Available"
    availability: str = "Available (50% bandwidth)"
    prev_projects: List[str] = []
    avatar_color: str = "bg-indigo-600"
    password: Optional[str] = None

# Real-Time Multi-Role Activity & Notification Models
ActivityEventType = Literal[
    "task_completed", "task_started", "task_reopened", 
    "task_claimed", "task_allocated", "project_accepted", 
    "project_created", "stage_updated"
]

class ActivityLog(BaseModel):
    id: str
    event_type: ActivityEventType
    project_id: str
    project_name: str
    task_id: Optional[str] = None
    task_title: Optional[str] = None
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    employee_role: Optional[str] = None
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    message: str
    timestamp: str

class ClaimTaskPayload(BaseModel):
    employee_id: str
    employee_name: Optional[str] = None

class EmployeeSprintStats(BaseModel):
    employee_id: str
    employee_name: str
    designation: str
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    todo_tasks: int
    completion_rate: int

class ProjectSprintSummary(BaseModel):
    project_id: str
    project_name: str
    total_deliverables: int
    completed_deliverables: int
    in_progress_deliverables: int
    todo_deliverables: int
    overall_progress_percent: int
    assigned_employees_count: int
    employee_breakdown: List[EmployeeSprintStats]
    stages: Dict[str, str]
    recent_activities: List[ActivityLog]
