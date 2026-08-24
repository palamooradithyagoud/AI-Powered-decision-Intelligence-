export type UserRole = "manager" | "project_lead" | "employee";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  title: string;
  avatar_color: string;
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
  status: TaskStatus;
  priority: TaskPriority;
  due_day: number;
}

export type FeasibilityStatus = "FEASIBLE" | "FEASIBLE WITH CHANGES" | "NOT FEASIBLE";
export type RiskSeverity = "Critical" | "High" | "Medium" | "Low";
export type RiskLevel = "High" | "Medium" | "Low";
export type ProjectStatus = "Active" | "Completed" | "At-Risk" | "Planning";
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
  created_at: string;
  updated_at: string;
  analysis: AIAnalysisResult;
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
