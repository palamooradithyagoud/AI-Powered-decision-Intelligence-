from typing import List, Optional, Dict, Literal
from pydantic import BaseModel, Field

# User & Auth Models
UserRole = Literal["manager", "project_lead", "employee"]

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
    assigned_to: str
    status: TaskStatus = "To Do"
    priority: TaskPriority = "Medium"
    due_day: int = 10

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
    key_deliverables: List[str] = []
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
    probability: Literal["High", "Medium", "Low"]
    impact: Literal["High", "Medium", "Low"]
    severity: Literal["Critical", "High", "Medium", "Low"]
    reason: str
    mitigation: str

class FeasibilityDimension(BaseModel):
    scope_score: int # 0-100
    timeline_score: int # 0-100
    manpower_score: int # 0-100
    technical_risk_score: int # 0-100 (higher means less risk / healthier)
    complexity_score: int # 0-100

class FeasibilityAnalysis(BaseModel):
    status: Literal["FEASIBLE", "FEASIBLE WITH CHANGES", "NOT FEASIBLE"]
    feasibility_score: int # 0-100
    dimensions: FeasibilityDimension
    key_verdict: str

class SuggestedAdjustments(BaseModel):
    recommended_additional_employees: int = 0
    recommended_timeline_extension_days: int = 0
    optional_features_to_drop: List[str] = []
    critical_skills_needed: List[str] = []

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

class Project(BaseModel):
    id: str
    name: str
    description: str
    expected_days: int
    available_employees: int
    requirements: str
    status: Literal["Active", "Completed", "At-Risk", "Planning"] = "Active"
    sent_to_lead: bool = False
    lead_assigned: Optional[str] = "Elena Rostova"
    sent_to_lead_at: Optional[str] = None
    created_at: str
    updated_at: str
    analysis: AIAnalysisResult

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

