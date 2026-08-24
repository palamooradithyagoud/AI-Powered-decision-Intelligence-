"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@/types";
import { loginUser } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  logout: () => void;
}

const DEFAULT_DEMO_USERS: Record<UserRole, User> = {
  manager: {
    id: "usr_manager_01",
    email: "manager@company.ai",
    name: "Alexander Vance",
    role: "manager",
    title: "VP of Engineering / Portfolio Manager",
    avatar_color: "bg-blue-600",
  },
  project_lead: {
    id: "usr_lead_01",
    email: "lead@company.ai",
    name: "Elena Rostova",
    role: "project_lead",
    title: "Senior Technical Project Lead",
    avatar_color: "bg-purple-600",
  },
  employee: {
    id: "emp_01",
    email: "shivanallella@gmail.com",
    name: "Emma Watson",
    role: "employee",
    title: "UI/UX Engineer",
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
        setUser(parsed);
        setIsAuthenticated(true);
      }
    } catch {
      // Use default manager
    }
  }, []);

  const login = async (email: string, password: string, role?: UserRole) => {
    try {
      const res = await loginUser(email, password, role);
      setUser(res.user);
      setIsAuthenticated(true);
      localStorage.setItem("planpulse_auth_user", JSON.stringify(res.user));
    } catch {
      // Fallback local match
      const assignedRole = role || (email.includes("lead") ? "project_lead" : email.includes("employee") ? "employee" : "manager");
      const fallbackUser = DEFAULT_DEMO_USERS[assignedRole];
      setUser(fallbackUser);
      setIsAuthenticated(true);
      localStorage.setItem("planpulse_auth_user", JSON.stringify(fallbackUser));
    }
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
