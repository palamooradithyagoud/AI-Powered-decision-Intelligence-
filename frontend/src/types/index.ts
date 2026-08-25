export type UserRole = "manager" | "project_lead" | "employee";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  title: string;
  avatar_color: string;
}

export interface EmployeeProfile {
  id: string;
  serial_no?: number;
  name: string;
  email?: string;
  designation: string;
  role?: UserRole;
  skills: string[];
  experience: string;
  experience_years?: number;
  workload: number;
  availability_status?: string;
  availability: string;
  prev_projects: string[];
  avatar_color?: string;
  password?: string;
}


export interface LoginResponse {
  user: User;
  token: string;
  message: string;
}


export type TaskStatus = "To Do" | "In Progress" | "Completed";
export type TaskPriority = "High" | "Medium" | "Low";

export interface TaskItem {
  id: string;
  project_id: string;
  project_name: string;
  phase_name: string;
  title: string;
  description: string;
  assigned_role: string;
  assigned_to: string;
  assigned_emp_id?: string;
  match_score?: number;
  ai_rationale?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_day: number;
}

export type FeasibilityStatus = "FEASIBLE" | "FEASIBLE WITH CHANGES" | "NOT FEASIBLE";
export type RiskSeverity = "Critical" | "High" | "Medium" | "Low";
export type RiskLevel = "High" | "Medium" | "Low";
export type ProjectStatus = "Active" | "Completed" | "At-Risk" | "Planning" | "Pending Lead Review" | "Rejected by Lead";
export type LeadDecisionStatus = "Pending Review" | "Accepted" | "Rejected" | "None";
export type EmployeeStatus = "Sufficient" | "Employee Shortage" | "Resource Overload";

export interface FeatureItem {
  name: string;
  description: string;
  complexity: "Low" | "Medium" | "High";
  rationale?: string;
}

export interface MustNeedRequirement {
  category: string;
  items: string[];
  rationale: string;
}

export interface RoleRequirement {
  role: string;
  required_count: number;
  rationale: string;
}

export interface EmployeeAnalysis {
  roles: RoleRequirement[];
  total_recommended: number;
  total_available: number;
  status: EmployeeStatus;
  gap_delta: number;
  analysis_summary: string;
}

export interface PhaseTimeline {
  phase_name: string;
  start_day: number;
  end_day: number;
  duration_days: number;
  description: string;
  key_deliverables: string[];
  dependencies: string[];
}

export interface TimelineBreakdown {
  phases: PhaseTimeline[];
  total_calculated_days: number;
  expected_days: number;
  variance_days: number;
  buffer_days: number;
}

export interface TechRecommendation {
  layer: string;
  technology: string;
  rationale: string;
}

export interface RiskItem {
  risk: string;
  probability: RiskLevel;
  impact: RiskLevel;
  severity: RiskSeverity;
  reason: string;
  mitigation: string;
}

export interface FeasibilityDimension {
  scope_score: number;
  timeline_score: number;
  manpower_score: number;
  technical_risk_score: number;
  complexity_score: number;
}

export interface FeasibilityAnalysis {
  status: FeasibilityStatus;
  feasibility_score: number;
  dimensions: FeasibilityDimension;
  key_verdict: string;
}

export interface SuggestedAdjustments {
  recommended_additional_employees: number;
  recommended_timeline_extension_days: number;
  optional_features_to_drop: string[];
  critical_skills_needed: string[];
}

export interface AIRecommendation {
  primary_advice: string;
  actionable_steps: string[];
  suggested_adjustments: SuggestedAdjustments;
}

export interface ProjectSummary {
  what_it_is: string;
  problem_solved: string;
  what_needs_to_be_built: string;
}

export interface ProjectFeatures {
  must_have: FeatureItem[];
  optional: FeatureItem[];
}

export interface AIAnalysisResult {
  summary: ProjectSummary;
  features: ProjectFeatures;
  must_need_requirements: MustNeedRequirement[];
  employee_analysis: EmployeeAnalysis;
  timeline_breakdown: TimelineBreakdown;
  tools_and_technologies: TechRecommendation[];
  risk_analysis: RiskItem[];
  feasibility: FeasibilityAnalysis;
  ai_recommendation: AIRecommendation;
  engine?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  expected_days: number;
  available_employees: number;
  requirements: string;
  status: ProjectStatus;
  sent_to_lead?: boolean;
  lead_assigned?: string;
  sent_to_lead_at?: string;
  lead_status?: LeadDecisionStatus;
  rejection_reason?: string;
  lead_accepted_at?: string;
  lead_rejected_at?: string;
  ai_work_allocated?: boolean;
  created_at: string;
  updated_at: string;
  analysis: AIAnalysisResult;
}

export interface LeadActionPayload {
  action: "accept" | "reject";
  rejection_reason?: string;
}

export interface AITaskAllocationResponse {
  project_id: string;
  project_name: string;
  tasks: TaskItem[];
  summary: string;
}

export interface ConfirmTaskAllocationPayload {
  project_id: string;
  tasks: TaskItem[];
}

export interface ProjectCreateInput {
  name: string;
  description: string;
  expected_days: number;
  available_employees: number;
  requirements: string;
}

export interface DashboardKPIs {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  at_risk_projects: number;
  feasible_count: number;
  feasible_with_changes_count: number;
  not_feasible_count: number;
}

export interface SimulationResponse {
  expected_days: number;
  available_employees: number;
  employee_analysis: EmployeeAnalysis;
  feasibility: FeasibilityAnalysis;
  timeline_breakdown: TimelineBreakdown;
  ai_recommendation: AIRecommendation;
}

export type MeetingType = "Sprint Planning" | "1-on-1 Review" | "Architecture Sync" | "Design Review" | "Executive Briefing";

export interface MeetingItem {
  id: string;
  title: string;
  project_id?: string;
  project_name: string;
  date: string; // YYYY-MM-DD
  start_time: string; // e.g. "10:30 AM"
  end_time: string; // e.g. "11:30 AM"
  duration_minutes: number;
  type: MeetingType;
  attendees: string[];
  location_or_link: string;
  agenda: string;
  created_at: string;
}

export interface MeetingCreateInput {
  title: string;
  project_id?: string;
  project_name?: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes?: number;
  type: MeetingType;
  attendees: string[];
  location_or_link?: string;
  agenda?: string;
}

export type ActivityEventType = 
  | "task_completed" 
  | "task_started" 
  | "task_reopened" 
  | "task_claimed" 
  | "task_allocated" 
  | "project_accepted" 
  | "project_created" 
  | "stage_updated";

export interface ActivityLog {
  id: string;
  event_type: ActivityEventType;
  project_id: string;
  project_name: string;
  task_id?: string;
  task_title?: string;
  employee_id?: string;
  employee_name?: string;
  employee_role?: string;
  from_status?: string;
  to_status?: string;
  message: string;
  timestamp: string;
}

export interface EmployeeSprintStats {
  employee_id: string;
  employee_name: string;
  designation: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  todo_tasks: number;
  completion_rate: number;
}

export interface ProjectSprintSummary {
  project_id: string;
  project_name: string;
  total_deliverables: number;
  completed_deliverables: number;
  in_progress_deliverables: number;
  todo_deliverables: number;
  overall_progress_percent: number;
  assigned_employees_count: number;
  employee_breakdown: EmployeeSprintStats[];
  stages: Record<string, string>;
  recent_activities: ActivityLog[];
}
