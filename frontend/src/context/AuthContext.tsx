"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@/types";
import { loginUser } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<User>;
  loginAsEmployee: (employee: Partial<User> & { id?: string; name: string }) => void;
  switchRole: (newRole: UserRole) => void;
  logout: () => void;
}


export const DEFAULT_DEMO_USERS: Record<UserRole, User> = {
  manager: {
    id: "emp_01",
    email: "emp_01@company.ai",
    name: "Arjun Reddy",
    role: "manager",
    title: "Project Manager",
    avatar_color: "bg-indigo-600",
  },
  project_lead: {
    id: "emp_18",
    email: "emp_18@company.ai",
    name: "Ishita Rao",
    role: "project_lead",
    title: "Product Manager / Lead",
    avatar_color: "bg-purple-600",
  },
  employee: {
    id: "emp_03",
    email: "emp_03@company.ai",
    name: "Rahul Kumar",
    role: "employee",
    title: "Frontend Developer",
    avatar_color: "bg-emerald-600",
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(DEFAULT_DEMO_USERS.manager);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("planpulse_auth_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          setUser(parsed);
          setIsAuthenticated(true);
        }
      }
    } catch {
      // Use default manager
    }
  }, []);

  const login = async (email: string, password: string, role?: UserRole): Promise<User> => {
    try {
      const res = await loginUser(email, password, role);
      setUser(res.user);
      setIsAuthenticated(true);
      localStorage.setItem("planpulse_auth_user", JSON.stringify(res.user));
      return res.user;
    } catch (err: any) {
      // Fallback local match if server is unreachable
      const clean = email.toLowerCase().trim();
      let fallbackUser: User = DEFAULT_DEMO_USERS.manager;
      if (clean.includes("lead") || clean === "emp_18" || clean === "emp_36" || clean === "emp_15" || role === "project_lead") {
        fallbackUser = DEFAULT_DEMO_USERS.project_lead;
      } else if (clean.includes("employee") || clean.startsWith("emp_") || role === "employee") {
        fallbackUser = {
          id: clean.startsWith("emp_") ? clean : "emp_03",
          email: `${clean}@company.ai`,
          name: clean.toUpperCase(),
          role: "employee",
          title: "Team Member",
          avatar_color: "bg-emerald-600"
        };
      }
      setUser(fallbackUser);
      setIsAuthenticated(true);
      localStorage.setItem("planpulse_auth_user", JSON.stringify(fallbackUser));
      return fallbackUser;
    }
  };

  const loginAsEmployee = (emp: Partial<User> & { id?: string; name: string }) => {
    const empId = emp.id || "emp_01";
    const newUser: User = {
      id: empId,
      email: emp.email || `${empId}@company.ai`,
      name: emp.name,
      role: emp.role || (empId === "emp_01" ? "manager" : ["emp_18", "emp_36", "emp_15", "emp_33"].includes(empId) ? "project_lead" : "employee"),
      title: emp.title || "Team Member",
      avatar_color: emp.avatar_color || "bg-indigo-600",
    };
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem("planpulse_auth_user", JSON.stringify(newUser));
  };


  const switchRole = (newRole: UserRole) => {
    const newUser = DEFAULT_DEMO_USERS[newRole];
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem("planpulse_auth_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("planpulse_auth_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : "manager",
        isAuthenticated,
        login,
        loginAsEmployee,
        switchRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

