import { 
  Project, ProjectCreateInput, DashboardKPIs, SimulationResponse, 
  AIAnalysisResult, User, UserRole, LoginResponse, TaskItem, TaskStatus,
  EmployeeProfile, AITaskAllocationResponse, ActivityLog, ProjectSprintSummary
} from "@/types";

export type { EmployeeProfile };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Auth APIs
export async function loginUser(email: string, password: string, role?: UserRole): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(err.detail || "Authentication failed");
  }
  return res.json();
}

export async function fetchDemoUsers(): Promise<User[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/users`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn("fetchDemoUsers connection notice:", err);
    return [];
  }
}

// Employee Directory & Profiles APIs
export async function fetchEmployees(params?: { search?: string; role?: string; designation?: string }): Promise<EmployeeProfile[]> {
  try {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.role) query.set("role", params.role);
    if (params?.designation) query.set("designation", params.designation);

    const res = await fetch(`${API_BASE_URL}/api/employees?${query.toString()}`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn("fetchEmployees connection notice:", err);
    return [];
  }
}

export async function fetchEmployeeById(idOrNum: string | number): Promise<EmployeeProfile | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/employees/${idOrNum}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("fetchEmployeeById connection notice:", err);
    return null;
  }
}

// Fallback profile generator based on EMPLOYEE_ID.xlsx
const FALLBACK_EMPLOYEES: Record<string, EmployeeProfile> = {
  "emp_01": {
    id: "emp_01",
    serial_no: 1,
    name: "Arjun Reddy",
    email: "emp_01@company.ai",
    designation: "Project Manager",
    role: "manager",
    skills: ["Project Management", "Agile", "Scrum", "Risk Management"],
    experience: "7 Years",
    experience_years: 7,
    workload: 85,
    availability_status: "Partial",
    availability: "Partial (15% bandwidth)",
    prev_projects: ["Digital Banking Platform", "ERP Modernization"],
    avatar_color: "bg-indigo-600"
  },
  "emp_03": {
    id: "emp_03",
    serial_no: 3,
    name: "Rahul Kumar",
    email: "emp_03@company.ai",
    designation: "Frontend Developer",
    role: "employee",
    skills: ["React", "JavaScript", "TypeScript", "HTML", "CSS"],
    experience: "4 Years",
    experience_years: 4,
    workload: 78,
    availability_status: "Partial",
    availability: "Partial (22% bandwidth)",
    prev_projects: ["E-Commerce Portal", "Employee Management System"],
    avatar_color: "bg-emerald-600"
  },
  "emp_04": {
    id: "emp_04",
    serial_no: 4,
    name: "Sneha Patel",
    email: "emp_04@company.ai",
    designation: "Backend Developer",
    role: "employee",
    skills: ["Python", "FastAPI", "REST API", "PostgreSQL"],
    experience: "5 Years",
    experience_years: 5,
    workload: 55,
    availability_status: "Available",
    availability: "Available (45% bandwidth)",
    prev_projects: ["FinTech API Platform", "Inventory Management System"],
    avatar_color: "bg-blue-600"
  },
  "emp_18": {
    id: "emp_18",
    serial_no: 18,
    name: "Ishita Rao",
    email: "emp_18@company.ai",
    designation: "Product Manager",
    role: "project_lead",
    skills: ["Product Strategy", "Roadmapping", "User Research", "Agile"],
    experience: "6 Years",
    experience_years: 6,
    workload: 88,
    availability_status: "Partial",
    availability: "Partial (12% bandwidth)",
    prev_projects: ["AI Recommendation Engine", "CRM SaaS Platform"],
    avatar_color: "bg-purple-600"
  }
};

export async function fetchEmployeeProfile(empIdentifier: string | number): Promise<EmployeeProfile> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/employee/profile/${empIdentifier}`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`fetchEmployeeProfile notice for ${empIdentifier}:`, err);
  }

  // Safe fallback to match EMPLOYEE_ID.xlsx profile
  const key = typeof empIdentifier === "number" ? `emp_${String(empIdentifier).padStart(2, '0')}` : String(empIdentifier).toLowerCase();
  if (FALLBACK_EMPLOYEES[key]) {
    return FALLBACK_EMPLOYEES[key];
  }

  const num = typeof empIdentifier === "number" ? empIdentifier : parseInt(String(empIdentifier).replace("emp_", "")) || 3;
  return {
    id: `emp_${String(num).padStart(2, '0')}`,
    serial_no: num,
    name: `Employee ${num}`,
    email: `emp_${String(num).padStart(2, '0')}@company.ai`,
    designation: "Software Engineer",
    role: "employee",
    skills: ["TypeScript", "Python", "FastAPI", "React"],
    experience: "4 Years",
    experience_years: 4,
    workload: 60,
    availability_status: "Available",
    availability: "Available (40% bandwidth)",
    prev_projects: ["Enterprise Portal"],
    avatar_color: "bg-indigo-600"
  };
}

export async function fetchEmployeeProject(empIdentifier: string | number): Promise<Project | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/employee/project/${empIdentifier}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("fetchEmployeeProject notice:", err);
    return null;
  }
}

export async function fetchProjectStages(projectId: string): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/stages`, { cache: "no-store" });
    if (!res.ok) return {
      "Planning": "Completed",
      "Development": "In Progress",
      "Testing": "To Do",
      "Review": "To Do",
      "Deployment": "To Do"
    };
    return await res.json();
  } catch (err) {
    return {
      "Planning": "Completed",
      "Development": "In Progress",
      "Testing": "To Do",
      "Review": "To Do",
      "Deployment": "To Do"
    };
  }
}

export async function updateProjectStage(projectId: string, stageName: string, status: string): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/stages`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage_name: stageName, status }),
    });
    if (!res.ok) throw new Error("Failed to update project stage");
    return res.json();
  } catch {
    return { [stageName]: status };
  }
}


// Task & Sprint Execution APIs
export async function fetchTasks(params?: { project_id?: string; assigned_to?: string; assigned_emp_id?: string; status?: string }): Promise<TaskItem[]> {
  try {
    const query = new URLSearchParams();
    if (params?.project_id) query.set("project_id", params.project_id);
    if (params?.assigned_to) query.set("assigned_to", params.assigned_to);
    if (params?.assigned_emp_id) query.set("assigned_emp_id", params.assigned_emp_id);
    if (params?.status && params.status !== "ALL") query.set("status", params.status);

    const res = await fetch(`${API_BASE_URL}/api/tasks?${query.toString()}`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn("fetchTasks connection notice:", err);
    return [];
  }
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<TaskItem> {
  const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update task status");
  return res.json();
}

export async function claimTask(taskId: string, employeeId: string, employeeName?: string): Promise<TaskItem> {
  const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employee_id: employeeId, employee_name: employeeName }),
  });
  if (!res.ok) throw new Error("Failed to claim task");
  return res.json();
}

// Multi-Role Real-Time Activity & Audit Feed APIs
export async function fetchActivities(params?: { project_id?: string; limit?: number }): Promise<ActivityLog[]> {
  try {
    const query = new URLSearchParams();
    if (params?.project_id) query.set("project_id", params.project_id);
    if (params?.limit) query.set("limit", String(params.limit));

    const res = await fetch(`${API_BASE_URL}/api/activities?${query.toString()}`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn("fetchActivities notice:", err);
    return [];
  }
}

export async function fetchSprintSummary(projectId: string): Promise<ProjectSprintSummary | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/sprint-summary`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("fetchSprintSummary notice:", err);
    return null;
  }
}

// Manager Project APIs
export async function fetchHealth(): Promise<{ status: string; gemini_active: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, { cache: "no-store" });
    if (!res.ok) return { status: "offline", gemini_active: false };
    return await res.json();
  } catch (err) {
    return { status: "offline", gemini_active: false };
  }
}

export async function fetchKPIs(): Promise<DashboardKPIs | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/kpis`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("fetchKPIs connection notice:", err);
    return null;
  }
}

export async function fetchProjects(params?: { search?: string; feasibility?: string; status?: string }): Promise<Project[]> {
  try {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.feasibility && params.feasibility !== "ALL") query.set("feasibility", params.feasibility);
    if (params?.status && params.status !== "ALL") query.set("status", params.status);

    const url = `${API_BASE_URL}/api/projects?${query.toString()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn("fetchProjects connection notice:", err);
    return [];
  }
}

export async function fetchProjectById(id: string): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch project with id: ${id}`);
  return res.json();
}

export async function createProject(data: ProjectCreateInput): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Failed to create project" }));
    throw new Error(errorData.detail || "Failed to create project");
  }
  return res.json();
}

export async function reanalyzeProject(id: string, data?: ProjectCreateInput): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${id}/reanalyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) throw new Error("Failed to re-analyze project");
  return res.json();
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete project");
}

export async function sendProjectToLead(projectId: string): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/send-to-lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Failed to dispatch project to Project Lead" }));
    throw new Error(errorData.detail || "Failed to dispatch project to Project Lead");
  }
  return res.json();
}

export async function leadActionProject(
  projectId: string, 
  action: "accept" | "reject", 
  rejection_reason?: string
): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/lead-action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, rejection_reason }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: `Failed to ${action} project` }));
    throw new Error(errorData.detail || `Failed to ${action} project`);
  }
  return res.json();
}

export async function runAIWorkAllocation(projectId: string): Promise<AITaskAllocationResponse> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/ai-allocate-tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Failed to run AI work allocation" }));
    throw new Error(errorData.detail || "Failed to run AI work allocation");
  }
  return res.json();
}

export async function confirmTaskAllocation(
  projectId: string, 
  tasks: TaskItem[]
): Promise<{ message: string; count: number }> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/confirm-tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: projectId, tasks }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Failed to confirm task allocations" }));
    throw new Error(errorData.detail || "Failed to confirm task allocations");
  }
  return res.json();
}

export async function simulateFeasibility(params: {
  project_id?: string;
  expected_days: number;
  available_employees: number;
  base_analysis?: AIAnalysisResult;
}): Promise<SimulationResponse> {
  const res = await fetch(`${API_BASE_URL}/api/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Simulation failed");
  return res.json();
}

// Meeting & Calendar APIs
export async function fetchMeetings(params?: { date?: string; project_id?: string }): Promise<any[]> {
  try {
    const query = new URLSearchParams();
    if (params?.date) query.set("date", params.date);
    if (params?.project_id) query.set("project_id", params.project_id);

    const res = await fetch(`${API_BASE_URL}/api/meetings?${query.toString()}`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("fetchMeetings error:", err);
    return [];
  }
}

export async function createMeeting(data: any): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/meetings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to schedule meeting" }));
    throw new Error(err.detail || "Failed to schedule meeting");
  }
  return res.json();
}

export async function deleteMeeting(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/meetings/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete meeting");
}

// n8n Workflow Integration APIs
export async function fetchN8nStatus(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/integrations/n8n/status`, { cache: "no-store" });
    if (!res.ok) return { is_configured: false };
    return await res.json();
  } catch {
    return { is_configured: false };
  }
}

export async function fetchN8nWorkflow(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/integrations/n8n/workflow`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}


