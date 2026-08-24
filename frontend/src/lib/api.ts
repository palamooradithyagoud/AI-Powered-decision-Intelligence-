import { 
  Project, ProjectCreateInput, DashboardKPIs, SimulationResponse, 
  AIAnalysisResult, User, UserRole, LoginResponse, TaskItem, TaskStatus,
  EmployeeProfile
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

// Employee Dashboard & Stages APIs
export async function fetchEmployeeProfile(empNum: number): Promise<EmployeeProfile> {
  const res = await fetch(`${API_BASE_URL}/api/employee/profile/${empNum}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch employee profile");
  return res.json();
}

export async function fetchEmployeeProject(empNum: number): Promise<Project | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/employee/project/${empNum}`, { cache: "no-store" });
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
    if (!res.ok) return {};
    return await res.json();
  } catch (err) {
    return {};
  }
}

export async function updateProjectStage(projectId: string, stageName: string, status: string): Promise<Record<string, string>> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/stages`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stage_name: stageName, status }),
  });
  if (!res.ok) throw new Error("Failed to update project stage");
  return res.json();
}

// Task & Sprint Execution APIs
export async function fetchTasks(params?: { project_id?: string; assigned_to?: string; status?: string }): Promise<TaskItem[]> {
  try {
    const query = new URLSearchParams();
    if (params?.project_id) query.set("project_id", params.project_id);
    if (params?.assigned_to) query.set("assigned_to", params.assigned_to);
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

