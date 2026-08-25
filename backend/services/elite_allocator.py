"""
Elite AI Workforce Allocation Engine
=====================================
Production-grade, explainable, deterministic, workload-aware workforce optimization.

Pipeline:
  TaskIntelligence → HardConstraintFilter → MultiFactorScoring
  → GlobalOptimizer → ConfidenceEngine → RiskEngine → ExplanationEngine

Key properties:
  - Deterministic: same input → same output (no random assignments)
  - Explainable: every decision grounded in actual calculated data
  - Workload-aware: effort-based capacity (replaces artificial +12% hack)
  - Semantically skill-aware: relationship graph (React ↔ Next.js etc.)
  - Hard constraint enforcement: unsuitable candidates CANNOT win via high score
  - Global optimization: team-level utility maximization with fairness
  - Fault-tolerant: LLM failure falls back to deterministic pipeline
  - API-compatible: returns List[TaskItem] — same as legacy allocator

Author: AI Workforce Optimization Engine v2.0
"""

import json
import math
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

from models.schemas import TaskItem


# ──────────────────────────────────────────────────────────────────────────────
# ALLOCATION CONFIGURATION
# ──────────────────────────────────────────────────────────────────────────────

class AllocationProfile(str, Enum):
    BALANCED           = "balanced"
    DEADLINE_CRITICAL  = "deadline_critical"
    TECHNICAL_CRITICAL = "technical_critical"


# Scoring weights per profile (must sum to 1.0)
ALLOCATION_WEIGHTS: Dict[str, Dict[str, float]] = {
    AllocationProfile.BALANCED: {
        "skill": 0.35, "workload": 0.25, "experience": 0.15,
        "availability": 0.15, "performance": 0.10,
    },
    AllocationProfile.DEADLINE_CRITICAL: {
        "skill": 0.30, "workload": 0.20, "experience": 0.15,
        "availability": 0.25, "performance": 0.10,
    },
    AllocationProfile.TECHNICAL_CRITICAL: {
        "skill": 0.45, "workload": 0.20, "experience": 0.20,
        "availability": 0.10, "performance": 0.05,
    },
}

# Capacity & workload constants (all configurable)
WEEKLY_CAPACITY_HOURS: float = 40.0
MAX_PROJECTED_WORKLOAD: float = 70.0          # % — strict hard ceiling (workload > 70% gets NO work)
MAX_ALLOWED_CURRENT_WORKLOAD: float = 70.0    # % — employees currently > 70% cannot be assigned
BASELINE_PERFORMANCE_SCORE: float = 70.0     # neutral when no history
CONFIDENCE_HIGH_THRESHOLD: int = 80
CONFIDENCE_MEDIUM_THRESHOLD: int = 60
MAX_TASKS_PER_EMPLOYEE: int = 3              # fairness penalty threshold & concentration limit
CONTINUITY_BONUS: float = 3.0               # score bonus for phase continuity
FAIRNESS_PENALTY_PER_EXTRA_TASK: float = 4.0

# Effort hours by task complexity
COMPLEXITY_HOURS: Dict[str, float] = {
    "low": 1.0, "medium": 2.5, "high": 4.0, "critical": 4.5,
}

# Workload band labels
WORKLOAD_BANDS: List[Tuple[float, float, str]] = [
    (0.0,  50.0, "Optimal"),
    (50.0, 65.0, "Healthy"),
    (65.0, 70.0, "Near Capacity"),
    (70.0, 100.0, "Overloaded (Excluded)"),
]


# ──────────────────────────────────────────────────────────────────────────────
# SEMANTIC SKILL RELATIONSHIP GRAPH
# ──────────────────────────────────────────────────────────────────────────────
# Relationship scores: 1.0=identical, 0.7-0.9=strongly related,
# 0.4-0.6=partially related, 0.1-0.3=weakly transferable, 0=unrelated.
# Graph is directional; reverse lookups apply a 0.90 discount.

SKILL_RELATIONSHIPS: Dict[str, Dict[str, float]] = {
    # ── Frontend ──────────────────────────────────────────────────────────────
    "react": {
        "next.js": 0.85, "vue.js": 0.70, "vue": 0.70, "angular": 0.60,
        "javascript": 0.80, "typescript": 0.75, "html": 0.60,
        "svelte": 0.65, "redux": 0.70, "preact": 0.80,
    },
    "next.js": {
        "react": 0.90, "javascript": 0.80, "typescript": 0.80,
        "vue.js": 0.55, "html": 0.55, "css": 0.55,
    },
    "javascript": {
        "typescript": 0.80, "react": 0.75, "next.js": 0.70,
        "node.js": 0.70, "html": 0.55, "jest": 0.60,
    },
    "typescript": {
        "javascript": 0.85, "react": 0.70, "next.js": 0.75,
    },
    "html": {"css": 0.80, "javascript": 0.55, "react": 0.45, "tailwind": 0.65},
    "css": {"html": 0.80, "tailwind": 0.85, "sass": 0.80, "scss": 0.80},
    "tailwind": {"css": 0.85, "html": 0.65, "sass": 0.60},
    "redux": {"react": 0.75, "javascript": 0.60, "typescript": 0.55},
    "svelte": {"react": 0.60, "vue.js": 0.65, "javascript": 0.70},

    # ── Backend ───────────────────────────────────────────────────────────────
    "python": {
        "fastapi": 0.90, "django": 0.80, "flask": 0.75,
        "pytorch": 0.65, "pandas": 0.70, "pytest": 0.70, "celery": 0.65,
    },
    "fastapi": {
        "python": 0.90, "rest api": 0.85, "django": 0.60,
        "flask": 0.65, "rest": 0.85,
    },
    "django": {"python": 0.85, "fastapi": 0.60, "flask": 0.70, "rest api": 0.75},
    "flask": {"python": 0.80, "fastapi": 0.70, "rest api": 0.70, "django": 0.65},
    "node.js": {"express": 0.90, "javascript": 0.80, "typescript": 0.70, "nestjs": 0.80},
    "express": {"node.js": 0.90, "javascript": 0.75, "rest api": 0.80},
    "nestjs": {"node.js": 0.80, "typescript": 0.75, "express": 0.70},
    "java": {"spring boot": 0.90, "kotlin": 0.70, "maven": 0.65},
    "spring boot": {"java": 0.90, "rest api": 0.80, "kotlin": 0.65},
    "kotlin": {"java": 0.70, "spring boot": 0.65},
    "rest api": {
        "graphql": 0.65, "fastapi": 0.85, "express": 0.80,
        "django": 0.70, "backend development": 0.80, "rest": 0.95,
        "spring boot": 0.75,
    },
    "rest": {"rest api": 0.95, "fastapi": 0.80, "express": 0.75},
    "graphql": {"rest api": 0.65, "apollo": 0.85, "rest": 0.60},
    "microservices": {"docker": 0.70, "kubernetes": 0.70, "rest api": 0.75},
    "celery": {"python": 0.65, "redis": 0.60},

    # ── Databases ─────────────────────────────────────────────────────────────
    "postgresql": {
        "supabase": 0.85, "mysql": 0.60, "sqlite": 0.55,
        "mongodb": 0.30, "sql": 0.85, "pgvector": 0.80, "postgres": 1.0,
    },
    "postgres": {"postgresql": 1.0, "supabase": 0.85, "sql": 0.85},
    "mysql": {"postgresql": 0.60, "sql": 0.85, "sqlite": 0.55, "mariadb": 0.90},
    "mongodb": {
        "postgresql": 0.30, "redis": 0.35, "nosql": 0.80,
        "firestore": 0.60, "dynamodb": 0.55,
    },
    "supabase": {"postgresql": 0.90, "sql": 0.80, "firebase": 0.50},
    "redis": {"mongodb": 0.35, "caching": 0.80, "postgresql": 0.30, "celery": 0.60},
    "sql": {"postgresql": 0.85, "mysql": 0.85, "sqlite": 0.80, "supabase": 0.75},
    "sqlite": {"sql": 0.80, "postgresql": 0.55, "mysql": 0.55},
    "firebase": {"supabase": 0.50, "mongodb": 0.45, "nosql": 0.70},
    "dynamodb": {"mongodb": 0.55, "nosql": 0.75, "aws": 0.60},

    # ── AI / ML ───────────────────────────────────────────────────────────────
    "machine learning": {
        "deep learning": 0.75, "pytorch": 0.70, "tensorflow": 0.70,
        "python": 0.65, "data science": 0.75, "nlp": 0.60,
        "llm": 0.60, "scikit-learn": 0.80,
    },
    "deep learning": {"machine learning": 0.80, "pytorch": 0.85, "tensorflow": 0.85},
    "pytorch": {
        "tensorflow": 0.80, "machine learning": 0.80,
        "deep learning": 0.85, "python": 0.70,
    },
    "tensorflow": {
        "pytorch": 0.80, "machine learning": 0.80,
        "keras": 0.90, "python": 0.70,
    },
    "keras": {"tensorflow": 0.90, "pytorch": 0.75, "deep learning": 0.80},
    "scikit-learn": {"machine learning": 0.85, "python": 0.80, "pandas": 0.70},
    "nlp": {
        "machine learning": 0.70, "python": 0.65,
        "llm": 0.80, "hugging face": 0.85, "spacy": 0.80,
    },
    "llm": {
        "nlp": 0.80, "hugging face": 0.85, "python": 0.65,
        "prompt engineering": 0.85, "machine learning": 0.65, "langchain": 0.80,
    },
    "hugging face": {"nlp": 0.85, "llm": 0.85, "pytorch": 0.75},
    "prompt engineering": {"llm": 0.85, "nlp": 0.70, "python": 0.60},
    "langchain": {"llm": 0.80, "python": 0.70, "nlp": 0.65},
    "rag": {"llm": 0.85, "langchain": 0.80, "python": 0.65},
    "data science": {
        "machine learning": 0.75, "pandas": 0.85,
        "python": 0.80, "sql": 0.60,
    },
    "pandas": {"python": 0.80, "data science": 0.80, "numpy": 0.85},
    "numpy": {"pandas": 0.85, "python": 0.75, "scipy": 0.80},

    # ── DevOps / Cloud ────────────────────────────────────────────────────────
    "docker": {
        "kubernetes": 0.75, "ci/cd": 0.70, "devops": 0.85,
        "linux": 0.65, "containerization": 0.90,
    },
    "kubernetes": {
        "docker": 0.75, "ci/cd": 0.70, "devops": 0.80,
        "helm": 0.80, "containerization": 0.80,
    },
    "aws": {
        "cloud": 0.85, "gcp": 0.65, "azure": 0.60,
        "devops": 0.70, "ec2": 0.80, "s3": 0.75, "lambda": 0.75,
    },
    "gcp": {"aws": 0.65, "cloud": 0.85, "azure": 0.60},
    "azure": {"aws": 0.60, "cloud": 0.85, "gcp": 0.60},
    "cloud": {"aws": 0.80, "gcp": 0.80, "azure": 0.80, "devops": 0.70},
    "ci/cd": {
        "github actions": 0.90, "jenkins": 0.80,
        "devops": 0.85, "gitlab ci": 0.85, "circleci": 0.80,
    },
    "github actions": {"ci/cd": 0.90, "devops": 0.80, "gitlab ci": 0.70},
    "gitlab ci": {"ci/cd": 0.85, "github actions": 0.70},
    "jenkins": {"ci/cd": 0.80, "devops": 0.75},
    "terraform": {
        "infrastructure as code": 0.90, "devops": 0.75,
        "aws": 0.60, "gcp": 0.55, "ansible": 0.65,
    },
    "ansible": {"terraform": 0.65, "devops": 0.70, "linux": 0.65},
    "devops": {
        "docker": 0.80, "kubernetes": 0.75, "ci/cd": 0.85,
        "aws": 0.65, "linux": 0.70,
    },
    "linux": {"devops": 0.70, "docker": 0.65, "bash": 0.80, "shell scripting": 0.80},
    "bash": {"linux": 0.80, "shell scripting": 0.95, "devops": 0.60},

    # ── Auth / Security ───────────────────────────────────────────────────────
    "jwt": {"authentication": 0.85, "oauth": 0.75, "security": 0.65, "auth": 0.85},
    "oauth": {"jwt": 0.75, "authentication": 0.80, "security": 0.70, "auth": 0.80},
    "authentication": {
        "jwt": 0.85, "oauth": 0.80, "security": 0.75,
        "rbac": 0.65, "auth": 1.0,
    },
    "auth": {"authentication": 1.0, "jwt": 0.85, "oauth": 0.80},
    "security": {
        "authentication": 0.70, "cybersecurity": 0.85,
        "encryption": 0.75, "jwt": 0.65,
    },
    "cybersecurity": {"security": 0.85, "authentication": 0.65, "encryption": 0.70},
    "rbac": {"authentication": 0.70, "security": 0.65, "jwt": 0.60},
    "encryption": {"security": 0.75, "cybersecurity": 0.70},

    # ── Testing / QA ──────────────────────────────────────────────────────────
    "testing": {
        "selenium": 0.80, "jest": 0.75, "cypress": 0.75,
        "qa": 0.90, "pytest": 0.80, "postman": 0.65,
        "api testing": 0.80, "automation": 0.75,
    },
    "qa": {
        "testing": 0.90, "selenium": 0.80, "jest": 0.75,
        "cypress": 0.75, "automation": 0.75, "pytest": 0.75,
    },
    "selenium": {"testing": 0.80, "qa": 0.80, "cypress": 0.65, "automation": 0.80},
    "jest": {"testing": 0.80, "cypress": 0.70, "javascript": 0.65, "qa": 0.75},
    "cypress": {"testing": 0.80, "jest": 0.70, "selenium": 0.65, "qa": 0.75},
    "pytest": {"testing": 0.85, "python": 0.75, "qa": 0.75},
    "postman": {"api testing": 0.85, "rest api": 0.70, "testing": 0.70},
    "api testing": {"postman": 0.85, "testing": 0.80, "rest api": 0.65},
    "automation": {"testing": 0.80, "qa": 0.80, "selenium": 0.80, "ci/cd": 0.55},

    # ── UI/UX Design ──────────────────────────────────────────────────────────
    "figma": {
        "ui/ux": 0.90, "prototyping": 0.85, "wireframing": 0.85,
        "design": 0.80, "adobe xd": 0.80,
    },
    "ui/ux": {
        "figma": 0.90, "prototyping": 0.80, "wireframing": 0.80,
        "design": 0.85, "user research": 0.75,
    },
    "prototyping": {"figma": 0.85, "ui/ux": 0.80, "wireframing": 0.80},
    "wireframing": {"figma": 0.85, "prototyping": 0.80, "ui/ux": 0.75},
    "user research": {"ui/ux": 0.80, "design": 0.70},
    "adobe xd": {"figma": 0.80, "ui/ux": 0.85, "prototyping": 0.80},
    "design": {"figma": 0.80, "ui/ux": 0.85, "prototyping": 0.70},

    # ── Project / Management ──────────────────────────────────────────────────
    "agile": {"scrum": 0.90, "project management": 0.80, "kanban": 0.75},
    "scrum": {"agile": 0.90, "project management": 0.80, "kanban": 0.65},
    "kanban": {"agile": 0.75, "scrum": 0.65, "project management": 0.70},
    "project management": {
        "agile": 0.80, "scrum": 0.75, "risk management": 0.70,
    },
    "risk management": {"project management": 0.70, "agile": 0.55},
    "documentation": {"uml": 0.65, "requirements analysis": 0.70},
    "uml": {"documentation": 0.65, "requirements analysis": 0.70, "system design": 0.80},
    "requirements analysis": {"uml": 0.70, "documentation": 0.70, "agile": 0.55, "system design": 0.75},

    # ── Architecture / Design ────────────────────────────────────────────────
    "system design": {
        "microservices": 0.85, "cloud architecture": 0.80, "uml": 0.75,
        "requirements analysis": 0.70, "software architecture": 0.90,
    },
    "microservices": {
        "system design": 0.85, "docker": 0.75, "kubernetes": 0.70, "rest api": 0.75,
    },
    "cloud architecture": {"system design": 0.85, "aws": 0.80, "microservices": 0.75},

    # ── Security / Compliance ────────────────────────────────────────────────
    "vulnerability assessment": {
        "owasp": 0.90, "network security": 0.85, "penetration testing": 0.85,
        "siem": 0.75, "security": 0.85,
    },
    "owasp": {
        "vulnerability assessment": 0.90, "network security": 0.80,
        "penetration testing": 0.85, "security": 0.85,
    },
    "network security": {
        "vulnerability assessment": 0.85, "owasp": 0.80, "siem": 0.80, "security": 0.90,
    },
    "siem": {
        "network security": 0.80, "vulnerability assessment": 0.75,
        "monitoring": 0.70, "security": 0.80,
    },
    "penetration testing": {
        "owasp": 0.85, "vulnerability assessment": 0.85, "security": 0.85,
    },

    # ── Database Optimization / ETL ──────────────────────────────────────────
    "database tuning": {
        "sql": 0.90, "postgresql": 0.85, "mysql": 0.85, "sql optimization": 0.95, "backup": 0.70,
    },
    "sql optimization": {"database tuning": 0.95, "sql": 0.90, "postgresql": 0.85},
    "etl": {"apache spark": 0.85, "airflow": 0.85, "sql": 0.80, "python": 0.75, "kafka": 0.75},
    "apache spark": {"etl": 0.85, "spark": 1.0, "python": 0.75, "airflow": 0.70},
    "spark": {"apache spark": 1.0, "etl": 0.85, "python": 0.75},
    "airflow": {"etl": 0.85, "python": 0.75, "apache spark": 0.70},
    "kafka": {"etl": 0.75, "spark": 0.75, "python": 0.65},

    # ── API / Integration ────────────────────────────────────────────────────
    "webhooks": {"rest api": 0.85, "oauth": 0.80, "json": 0.75, "postman": 0.70},
    "oauth": {"webhooks": 0.80, "rest api": 0.80, "jwt": 0.85, "authentication": 0.85},
    "postman": {"api testing": 0.85, "rest api": 0.75, "webhooks": 0.70},
    "json": {"rest api": 0.75, "webhooks": 0.75},

    # ── Mobile ───────────────────────────────────────────────────────────────
    "flutter": {"dart": 0.95, "android": 0.85, "rest api": 0.70, "firebase": 0.75},
    "dart": {"flutter": 0.95, "android": 0.80},
    "android": {"flutter": 0.85, "dart": 0.80, "mobile": 0.90},

    # ── SRE / Monitoring ─────────────────────────────────────────────────────
    "monitoring": {"prometheus": 0.90, "grafana": 0.90, "linux": 0.75, "devops": 0.75},
    "prometheus": {"monitoring": 0.90, "grafana": 0.90, "linux": 0.70},
    "grafana": {"monitoring": 0.90, "prometheus": 0.90},

    # ── Technical Writing ────────────────────────────────────────────────────
    "technical documentation": {
        "api documentation": 0.85, "markdown": 0.80, "technical writing": 0.90, "git": 0.60,
    },
    "api documentation": {
        "technical documentation": 0.85, "technical writing": 0.85, "markdown": 0.80,
    },
    "technical writing": {
        "technical documentation": 0.90, "api documentation": 0.85, "markdown": 0.80,
    },
    "markdown": {
        "technical documentation": 0.80, "technical writing": 0.80, "api documentation": 0.80,
    },
}


def _normalize_skill(skill: str) -> str:
    return skill.lower().strip()


def _get_skill_relationship(required: str, employee_skill: str) -> float:
    """Look up semantic relationship between two skills (0.0–1.0)."""
    req = _normalize_skill(required)
    emp = _normalize_skill(employee_skill)

    if req == emp:
        return 1.0

    # Direct lookup
    score = SKILL_RELATIONSHIPS.get(req, {}).get(emp, 0.0)
    if score > 0.0:
        return score

    # Reverse lookup (with slight penalty)
    score = SKILL_RELATIONSHIPS.get(emp, {}).get(req, 0.0)
    if score > 0.0:
        return score * 0.92

    # Substring / token partial match fallback (excluding generic stopwords)
    stopwords = {"and", "&", "the", "in", "for", "with", "of", "to"}
    req_tokens = set(req.split()) - stopwords
    emp_tokens = set(emp.split()) - stopwords
    if req_tokens and emp_tokens:
        if req_tokens & emp_tokens:
            return 0.42
    if req in emp or emp in req:
        return 0.38

    return 0.0


# ──────────────────────────────────────────────────────────────────────────────
# PHASE → SKILL KNOWLEDGE BASE  (deterministic task parser)
# ──────────────────────────────────────────────────────────────────────────────

_PHASE_SKILL_MAP: Dict[str, Dict[str, Any]] = {
    # ── Planning & Architecture ──────────────────────────────
    "blueprint": {
        "required": ["requirements analysis", "uml"],
        "preferred": ["system design", "agile", "documentation"],
        "critical": ["requirements analysis", "uml"],
        "roles": ["business analyst", "software architect", "project manager"],
        "domain": "architecture",
    },
    "architecture": {
        "required": ["requirements analysis", "uml"],
        "preferred": ["system design", "microservices", "cloud architecture", "agile"],
        "critical": ["requirements analysis", "uml"],
        "roles": ["business analyst", "software architect", "project manager"],
        "domain": "architecture",
    },
    "planning": {
        "required": ["project management", "agile"],
        "preferred": ["scrum", "requirements analysis", "risk management", "roadmapping"],
        "critical": ["project management", "agile"],
        "roles": ["project manager", "product manager", "business analyst"],
        "domain": "planning",
    },

    # ── Security & Compliance ────────────────────────────────
    "hipaa": {
        "required": ["network security", "owasp", "vulnerability assessment"],
        "preferred": ["siem", "penetration testing", "encryption"],
        "critical": ["network security", "owasp"],
        "roles": ["cybersecurity engineer", "security engineer"],
        "domain": "security",
    },
    "security": {
        "required": ["network security", "owasp"],
        "preferred": ["vulnerability assessment", "siem", "encryption", "auth"],
        "critical": ["network security", "owasp"],
        "roles": ["cybersecurity engineer", "security engineer"],
        "domain": "security",
    },
    "compliance": {
        "required": ["network security", "vulnerability assessment"],
        "preferred": ["owasp", "siem", "documentation"],
        "critical": ["network security", "vulnerability assessment"],
        "roles": ["cybersecurity engineer"],
        "domain": "security",
    },

    # ── Database & Data Engineering ─────────────────────────
    "database schemas": {
        "required": ["sql", "postgresql"],
        "preferred": ["database tuning", "mysql", "oracle", "backup"],
        "critical": ["sql", "postgresql"],
        "roles": ["database administrator", "data engineer", "backend developer"],
        "domain": "data",
    },
    "schema": {
        "required": ["sql", "postgresql"],
        "preferred": ["database tuning", "mysql", "oracle"],
        "critical": ["sql", "postgresql"],
        "roles": ["database administrator", "data engineer", "backend developer"],
        "domain": "data",
    },
    "database": {
        "required": ["sql", "postgresql"],
        "preferred": ["database tuning", "mysql", "oracle", "backup"],
        "critical": ["sql", "postgresql"],
        "roles": ["database administrator", "backend developer", "data engineer"],
        "domain": "data",
    },
    "fhir": {
        "required": ["python", "rest api", "sql"],
        "preferred": ["fastapi", "etl", "webhooks", "json"],
        "critical": ["python", "rest api"],
        "roles": ["backend developer", "data engineer", "integration engineer"],
        "domain": "backend",
    },
    "ingestion": {
        "required": ["python", "sql", "etl"],
        "preferred": ["apache spark", "airflow", "rest api"],
        "critical": ["python", "sql"],
        "roles": ["data engineer", "backend developer"],
        "domain": "data",
    },
    "pipeline": {
        "required": ["python", "rest api"],
        "preferred": ["sql", "etl", "fastapi", "docker"],
        "critical": ["python", "rest api"],
        "roles": ["backend developer", "data engineer"],
        "domain": "backend",
    },

    # ── Frontend & Rendering ─────────────────────────────────
    "canvas": {
        "required": ["javascript", "react", "html"],
        "preferred": ["typescript", "css", "figma"],
        "critical": ["javascript", "react"],
        "roles": ["frontend developer", "full stack developer", "ui/ux designer"],
        "domain": "frontend",
    },
    "webgl": {
        "required": ["javascript", "react", "html"],
        "preferred": ["typescript", "css"],
        "critical": ["javascript", "react"],
        "roles": ["frontend developer", "full stack developer"],
        "domain": "frontend",
    },
    "render": {
        "required": ["javascript", "react", "html"],
        "preferred": ["typescript", "css"],
        "critical": ["javascript", "react"],
        "roles": ["frontend developer", "full stack developer"],
        "domain": "frontend",
    },
    "viewer": {
        "required": ["javascript", "react", "html"],
        "preferred": ["typescript", "css", "figma"],
        "critical": ["javascript", "react"],
        "roles": ["frontend developer", "full stack developer"],
        "domain": "frontend",
    },
    "ui/ux": {
        "required": ["figma", "wireframing", "prototyping"],
        "preferred": ["user research", "design systems", "ux research"],
        "critical": ["figma"],
        "roles": ["ui/ux designer"],
        "domain": "design",
    },
    "design": {
        "required": ["figma", "prototyping"],
        "preferred": ["wireframing", "design systems"],
        "critical": ["figma"],
        "roles": ["ui/ux designer"],
        "domain": "design",
    },
    "frontend": {
        "required": ["react", "javascript", "html"],
        "preferred": ["typescript", "css", "next.js", "tailwind"],
        "critical": ["react", "javascript"],
        "roles": ["frontend developer", "full stack developer"],
        "domain": "frontend",
    },

    # ── Backend & API ────────────────────────────────────────
    "clinical api": {
        "required": ["rest api", "python", "fastapi"],
        "preferred": ["postgresql", "oauth", "webhooks", "json"],
        "critical": ["rest api", "python"],
        "roles": ["backend developer", "integration engineer"],
        "domain": "backend",
    },
    "endpoints": {
        "required": ["rest api", "python"],
        "preferred": ["fastapi", "webhooks", "json", "postman"],
        "critical": ["rest api"],
        "roles": ["backend developer", "integration engineer"],
        "domain": "backend",
    },
    "backend": {
        "required": ["python", "rest api", "postgresql"],
        "preferred": ["fastapi", "sql", "redis", "docker"],
        "critical": ["python", "rest api"],
        "roles": ["backend developer", "full stack developer"],
        "domain": "backend",
    },
    "api": {
        "required": ["rest api", "python"],
        "preferred": ["fastapi", "webhooks", "json", "oauth"],
        "critical": ["rest api"],
        "roles": ["backend developer", "integration engineer"],
        "domain": "backend",
    },
    "integration": {
        "required": ["rest api", "webhooks", "oauth"],
        "preferred": ["postman", "json", "python"],
        "critical": ["rest api"],
        "roles": ["integration engineer", "backend developer"],
        "domain": "integration",
    },

    # ── Cloud, DevOps & SRE ──────────────────────────────────
    "auth microservice": {
        "required": ["rest api", "oauth", "python"],
        "preferred": ["fastapi", "docker", "webhooks"],
        "critical": ["rest api", "oauth"],
        "roles": ["backend developer", "integration engineer"],
        "domain": "backend",
    },
    "microservice": {
        "required": ["rest api", "python"],
        "preferred": ["docker", "fastapi", "postgresql"],
        "critical": ["rest api"],
        "roles": ["backend developer", "full stack developer"],
        "domain": "backend",
    },
    "audit logging": {
        "required": ["linux", "monitoring"],
        "preferred": ["prometheus", "grafana", "kubernetes"],
        "critical": ["linux", "monitoring"],
        "roles": ["site reliability engineer", "devops engineer"],
        "domain": "devops",
    },
    "logging": {
        "required": ["linux", "monitoring"],
        "preferred": ["prometheus", "grafana"],
        "critical": ["linux", "monitoring"],
        "roles": ["site reliability engineer", "devops engineer"],
        "domain": "devops",
    },
    "k8s": {
        "required": ["kubernetes", "docker", "linux"],
        "preferred": ["aws", "terraform", "monitoring"],
        "critical": ["kubernetes", "docker"],
        "roles": ["devops engineer", "site reliability engineer", "cloud engineer"],
        "domain": "devops",
    },
    "kubernetes": {
        "required": ["kubernetes", "docker", "linux"],
        "preferred": ["aws", "terraform", "monitoring"],
        "critical": ["kubernetes", "docker"],
        "roles": ["devops engineer", "site reliability engineer", "cloud engineer"],
        "domain": "devops",
    },
    "devops": {
        "required": ["docker", "kubernetes", "aws"],
        "preferred": ["terraform", "github actions", "linux", "ci/cd"],
        "critical": ["docker", "kubernetes"],
        "roles": ["devops engineer", "cloud engineer", "site reliability engineer"],
        "domain": "devops",
    },
    "infrastructure": {
        "required": ["aws", "terraform", "linux"],
        "preferred": ["docker", "kubernetes", "networking"],
        "critical": ["aws", "linux"],
        "roles": ["cloud engineer", "devops engineer", "site reliability engineer"],
        "domain": "devops",
    },

    # ── AI / ML / Dictation / Segmentation ───────────────────
    "segmentation": {
        "required": ["python", "machine learning"],
        "preferred": ["pytorch", "tensorflow", "scikit-learn", "pandas"],
        "critical": ["python", "machine learning"],
        "roles": ["machine learning engineer", "ai engineer"],
        "domain": "ai",
    },
    "lesion": {
        "required": ["python", "machine learning"],
        "preferred": ["pytorch", "tensorflow", "scikit-learn", "pandas"],
        "critical": ["python", "machine learning"],
        "roles": ["machine learning engineer", "ai engineer"],
        "domain": "ai",
    },
    "llm": {
        "required": ["python", "llms", "rag"],
        "preferred": ["langchain", "vector databases", "machine learning"],
        "critical": ["python", "llms"],
        "roles": ["ai engineer", "machine learning engineer"],
        "domain": "ai",
    },
    "summarizer": {
        "required": ["python", "llms", "rag"],
        "preferred": ["langchain", "vector databases", "nlp"],
        "critical": ["python", "llms"],
        "roles": ["ai engineer", "machine learning engineer"],
        "domain": "ai",
    },
    "dictation": {
        "required": ["python", "machine learning"],
        "preferred": ["nlp", "deep learning", "pytorch", "pandas"],
        "critical": ["python", "machine learning"],
        "roles": ["ai engineer", "machine learning engineer"],
        "domain": "ai",
    },
    "audio": {
        "required": ["python", "machine learning"],
        "preferred": ["nlp", "deep learning", "pytorch", "pandas"],
        "critical": ["python", "machine learning"],
        "roles": ["ai engineer", "machine learning engineer"],
        "domain": "ai",
    },
    "ai": {
        "required": ["python", "llms", "rag"],
        "preferred": ["langchain", "vector databases", "machine learning"],
        "critical": ["python", "llms"],
        "roles": ["ai engineer", "machine learning engineer"],
        "domain": "ai",
    },
    "ml": {
        "required": ["python", "machine learning"],
        "preferred": ["scikit-learn", "tensorflow", "pytorch", "pandas"],
        "critical": ["python", "machine learning"],
        "roles": ["machine learning engineer", "ai engineer"],
        "domain": "ai",
    },

    # ── Collaboration & Components ───────────────────────────
    "collaborative": {
        "required": ["figma", "wireframing", "ui/ux"],
        "preferred": ["prototyping", "design systems", "react", "html"],
        "critical": ["figma"],
        "roles": ["ui/ux designer", "frontend developer"],
        "domain": "design",
    },
    "collaboration": {
        "required": ["figma", "wireframing", "ui/ux"],
        "preferred": ["prototyping", "design systems", "react", "html"],
        "critical": ["figma"],
        "roles": ["ui/ux designer", "frontend developer"],
        "domain": "design",
    },
    "dicom": {
        "required": ["javascript", "react", "html"],
        "preferred": ["typescript", "css", "figma"],
        "critical": ["javascript", "react"],
        "roles": ["frontend developer", "full stack developer", "ui/ux designer"],
        "domain": "frontend",
    },

    # ── QA / Testing ─────────────────────────────────────────
    "qa": {
        "required": ["manual testing", "selenium"],
        "preferred": ["cypress", "api testing", "pytest"],
        "critical": ["selenium", "manual testing"],
        "roles": ["qa engineer"],
        "domain": "qa",
    },
    "testing": {
        "required": ["manual testing", "selenium"],
        "preferred": ["cypress", "api testing"],
        "critical": ["selenium", "manual testing"],
        "roles": ["qa engineer"],
        "domain": "qa",
    },
    "test suite": {
        "required": ["manual testing", "selenium", "api testing"],
        "preferred": ["cypress", "pytest"],
        "critical": ["selenium", "manual testing"],
        "roles": ["qa engineer"],
        "domain": "qa",
    },
    "automated": {
        "required": ["manual testing", "selenium", "api testing"],
        "preferred": ["cypress", "pytest"],
        "critical": ["selenium", "manual testing"],
        "roles": ["qa engineer"],
        "domain": "qa",
    },

    # ── Release & Disaster Recovery ──────────────────────────
    "release": {
        "required": ["linux", "monitoring", "kubernetes"],
        "preferred": ["docker", "prometheus", "grafana", "aws"],
        "critical": ["linux", "monitoring"],
        "roles": ["site reliability engineer", "devops engineer"],
        "domain": "devops",
    },
    "candidate": {
        "required": ["linux", "monitoring"],
        "preferred": ["prometheus", "grafana", "kubernetes"],
        "critical": ["linux", "monitoring"],
        "roles": ["site reliability engineer", "devops engineer"],
        "domain": "devops",
    },
    "disaster recovery": {
        "required": ["linux", "monitoring", "kubernetes"],
        "preferred": ["prometheus", "grafana", "incident management"],
        "critical": ["linux", "monitoring"],
        "roles": ["site reliability engineer", "devops engineer"],
        "domain": "devops",
    },
    "disaster": {
        "required": ["linux", "monitoring"],
        "preferred": ["prometheus", "grafana", "kubernetes"],
        "critical": ["linux", "monitoring"],
        "roles": ["site reliability engineer", "devops engineer"],
        "domain": "devops",
    },
    "recovery": {
        "required": ["linux", "monitoring"],
        "preferred": ["prometheus", "grafana", "kubernetes"],
        "critical": ["linux", "monitoring"],
        "roles": ["site reliability engineer", "devops engineer"],
        "domain": "devops",
    },
    "signoff": {
        "required": ["network security", "owasp", "vulnerability assessment"],
        "preferred": ["siem", "penetration testing", "documentation"],
        "critical": ["network security", "owasp"],
        "roles": ["cybersecurity engineer", "security engineer"],
        "domain": "security",
    },
    "assembly": {
        "required": ["rest api", "webhooks", "oauth"],
        "preferred": ["postman", "json", "python"],
        "critical": ["rest api"],
        "roles": ["integration engineer", "backend developer"],
        "domain": "integration",
    },

    # ── Documentation ────────────────────────────────────────
    "documentation": {
        "required": ["technical documentation", "markdown"],
        "preferred": ["api documentation", "technical writing", "git"],
        "critical": ["technical documentation", "markdown"],
        "roles": ["technical writer"],
        "domain": "documentation",
    },
    "technical writing": {
        "required": ["technical documentation", "technical writing", "markdown"],
        "preferred": ["api documentation", "git"],
        "critical": ["technical documentation", "technical writing"],
        "roles": ["technical writer"],
        "domain": "documentation",
    },
}

_FALLBACK_SKILLS: Dict[str, Any] = {
    "required": ["python", "javascript", "rest api", "testing"],
    "preferred": ["react", "postgresql", "docker"],
    "critical": [],
    "roles": ["full stack developer", "software engineer"],
    "domain": "general",
}

_COMPLEXITY_KEYWORDS: Dict[str, List[str]] = {
    "critical": [
        "hipaa", "pci", "financial", "gdpr", "compliance",
        "security audit", "encryption", "auth system",
    ],
    "high": [
        "ai", "ml", "realtime", "payment", "stream", "analytics",
        "microservice", "kubernetes", "distributed", "llm", "inference",
        "neural", "authentication", "integration", "pipeline",
    ],
    "low": [
        "documentation", "readme", "config", "simple", "static",
        "boilerplate", "setup", "scaffold",
    ],
}


def _detect_complexity_and_hours(text: str) -> Tuple[str, float, float]:
    """Returns (complexity, estimated_hours, confidence)."""
    lower = text.lower()
    for level in ("critical", "high", "low"):
        if any(kw in lower for kw in _COMPLEXITY_KEYWORDS.get(level, [])):
            return level, COMPLEXITY_HOURS[level], 0.75
    return "medium", COMPLEXITY_HOURS["medium"], 0.65


def _resolve_phase_skills(phase_name: str, deliverable: str) -> Dict[str, Any]:
    """Match phase + deliverable text to the skill knowledge base.
    Prioritizes specific deliverable keywords over broad phase keywords."""
    deliv_lower = deliverable.lower()
    phase_lower = phase_name.lower()
    combined = f"{phase_lower} {deliv_lower}"

    # 1. Try deliverable first for high specificity
    best_key: Optional[str] = None
    best_len: int = 0
    for key in _PHASE_SKILL_MAP:
        if key in deliv_lower and len(key) > best_len:
            best_len = len(key)
            best_key = key

    # 2. If no deliverable match, try combined
    if not best_key:
        for key in _PHASE_SKILL_MAP:
            if key in combined and len(key) > best_len:
                best_len = len(key)
                best_key = key

    return _PHASE_SKILL_MAP.get(best_key, _FALLBACK_SKILLS) if best_key else _FALLBACK_SKILLS


# ──────────────────────────────────────────────────────────────────────────────
# STRUCTURED TASK  (output of TaskIntelligence)
# ──────────────────────────────────────────────────────────────────────────────

@dataclass
class StructuredTask:
    task_id: str
    title: str
    description: str
    phase_name: str
    required_skills: List[str] = field(default_factory=list)
    preferred_skills: List[str] = field(default_factory=list)
    critical_skills: List[str] = field(default_factory=list)
    role_requirements: List[str] = field(default_factory=list)
    complexity: str = "medium"
    estimated_hours: float = 8.0
    effort_confidence: float = 0.65
    priority: str = "medium"
    deadline_day: int = 30
    dependencies: List[str] = field(default_factory=list)
    domain: str = "general"
    effort_source: str = "estimated"   # "llm" | "estimated" | "historical"


# ──────────────────────────────────────────────────────────────────────────────
# TASK INTELLIGENCE
# ──────────────────────────────────────────────────────────────────────────────

class TaskIntelligence:
    """
    Converts raw deliverable text → StructuredTask.
    Primary path: LLM (reuses existing Gemini/Groq client).
    Fallback: deterministic keyword parser (always available).
    Results are cached per phase+deliverable pair.
    """

    _LLM_PROMPT_TEMPLATE = """Analyze this software project deliverable and return ONLY a valid JSON object.

Project: {project_name}
Description: {project_description}
Sprint Phase: {phase_name}
Deliverable: {deliverable}

Return EXACTLY this JSON structure (no extra text, no markdown):
{{
  "required_skills": ["skill1", "skill2"],
  "preferred_skills": ["skill3"],
  "critical_skills": ["skill1"],
  "role_requirements": ["Frontend Developer"],
  "complexity": "low|medium|high|critical",
  "estimated_hours": 8,
  "domain": "frontend|backend|ai|devops|qa|design|planning|security|integration|general"
}}

Rules:
- required_skills: skills employee MUST have (lowercase)
- critical_skills: subset — absence makes employee UNSUITABLE
- estimated_hours: 4=low, 8=medium, 16=high, 24=critical (be realistic)
- Return ONLY the JSON object"""

    def __init__(self, llm_client=None):
        self._llm = llm_client
        self._cache: Dict[str, StructuredTask] = {}

    def analyze(
        self,
        task_id: str,
        phase_name: str,
        deliverable: str,
        project_name: str,
        project_description: str,
        deadline_day: int,
    ) -> StructuredTask:
        cache_key = f"{phase_name.lower()}::{deliverable.lower()}"
        if cache_key in self._cache:
            cached = self._cache[cache_key]
            # Return a copy with the current task_id and deadline_day
            return StructuredTask(
                task_id=task_id,
                title=cached.title, description=cached.description,
                phase_name=cached.phase_name,
                required_skills=list(cached.required_skills),
                preferred_skills=list(cached.preferred_skills),
                critical_skills=list(cached.critical_skills),
                role_requirements=list(cached.role_requirements),
                complexity=cached.complexity, estimated_hours=cached.estimated_hours,
                effort_confidence=cached.effort_confidence, priority=cached.priority,
                deadline_day=deadline_day, dependencies=list(cached.dependencies),
                domain=cached.domain, effort_source=cached.effort_source,
            )

        task = None
        if self._llm:
            try:
                task = self._llm_parse(
                    task_id, phase_name, deliverable,
                    project_name, project_description, deadline_day,
                )
            except Exception as exc:
                print(f"[TaskIntelligence] LLM error for '{deliverable}': {exc} — using deterministic parser")

        if task is None:
            task = self._deterministic_parse(
                task_id, phase_name, deliverable,
                project_name, project_description, deadline_day,
            )

        self._cache[cache_key] = task
        return task

    def _llm_parse(
        self, task_id, phase_name, deliverable,
        project_name, project_description, deadline_day,
    ) -> Optional[StructuredTask]:
        prompt = self._LLM_PROMPT_TEMPLATE.format(
            project_name=project_name, project_description=project_description[:300],
            phase_name=phase_name, deliverable=deliverable,
        )
        try:
            response = self._llm.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config={"response_mime_type": "application/json"},
            )
            if not (response and response.text):
                return None
            text = response.text.strip()
            for prefix in ("```json", "```"):
                if text.startswith(prefix):
                    text = text[len(prefix):]
            if text.endswith("```"):
                text = text[:-3]
            data = json.loads(text.strip())
        except Exception:
            return None

        complexity = str(data.get("complexity", "medium")).lower()
        if complexity not in COMPLEXITY_HOURS:
            complexity = "medium"
        estimated_hours = float(data.get("estimated_hours", COMPLEXITY_HOURS[complexity]))
        estimated_hours = max(1.0, min(40.0, estimated_hours))

        return StructuredTask(
            task_id=task_id, title=deliverable,
            description=f"Sprint Deliverable — {phase_name}: {deliverable}",
            phase_name=phase_name,
            required_skills=[s.lower().strip() for s in data.get("required_skills", [])],
            preferred_skills=[s.lower().strip() for s in data.get("preferred_skills", [])],
            critical_skills=[s.lower().strip() for s in data.get("critical_skills", [])],
            role_requirements=data.get("role_requirements", []),
            complexity=complexity, estimated_hours=estimated_hours,
            effort_confidence=0.80,
            priority="high" if complexity in ("high", "critical") else "medium",
            deadline_day=deadline_day,
            domain=str(data.get("domain", "general")).lower(),
            effort_source="llm",
        )

    def _deterministic_parse(
        self, task_id, phase_name, deliverable,
        project_name, project_description, deadline_day,
    ) -> StructuredTask:
        phase_data = _resolve_phase_skills(phase_name, deliverable)
        complexity, est_hours, conf = _detect_complexity_and_hours(
            f"{phase_name} {deliverable} {project_description}"
        )
        return StructuredTask(
            task_id=task_id, title=deliverable,
            description=f"Sprint Deliverable — {phase_name}: {deliverable}",
            phase_name=phase_name,
            required_skills=phase_data["required"],
            preferred_skills=phase_data["preferred"],
            critical_skills=phase_data["critical"],
            role_requirements=phase_data["roles"],
            complexity=complexity, estimated_hours=est_hours,
            effort_confidence=conf,
            priority="high" if complexity in ("high", "critical") else "medium",
            deadline_day=deadline_day, domain=phase_data["domain"],
            effort_source="estimated",
        )


# ──────────────────────────────────────────────────────────────────────────────
# SEMANTIC SKILL ENGINE
# ──────────────────────────────────────────────────────────────────────────────

class SemanticSkillEngine:
    """
    Semantic skill competency scoring using the SKILL_RELATIONSHIPS graph.
    Returns: (score_0_to_100, matched_skill_names, all_critical_skills_met).
    """

    def __init__(self):
        self._rel_cache: Dict[str, float] = {}

    def score(
        self,
        required_skills: List[str],
        preferred_skills: List[str],
        critical_skills: List[str],
        employee_skills: List[str],
    ) -> Tuple[float, List[str], bool]:
        if not required_skills:
            return 70.0, [], True

        emp_normalized = [_normalize_skill(s) for s in employee_skills]
        matched: List[str] = []
        all_critical_met = True
        required_total = 0.0

        for req in required_skills:
            best = self._best_match(req, emp_normalized)
            required_total += best
            if best >= 0.70:
                matched.append(req)
            if req in critical_skills and best < 0.30:
                all_critical_met = False

        required_avg = required_total / len(required_skills)

        preferred_avg = 0.0
        if preferred_skills:
            pref_total = sum(self._best_match(s, emp_normalized) for s in preferred_skills)
            preferred_avg = pref_total / len(preferred_skills)

        # Required skills = 70% weight; preferred = 30%
        combined = required_avg * 0.70 + preferred_avg * 0.30
        return round(min(100.0, max(0.0, combined * 100.0)), 2), matched, all_critical_met

    def _best_match(self, required: str, employee_skills: List[str]) -> float:
        req = _normalize_skill(required)
        best = 0.0
        for emp in employee_skills:
            key = f"{req}::{emp}"
            if key not in self._rel_cache:
                self._rel_cache[key] = _get_skill_relationship(req, emp)
            best = max(best, self._rel_cache[key])
            if best >= 1.0:
                break
        return best


# ──────────────────────────────────────────────────────────────────────────────
# HARD CONSTRAINT FILTER
# ──────────────────────────────────────────────────────────────────────────────

class HardConstraintFilter:
    """
    Eliminates UNSUITABLE candidates before weighted scoring begins.
    A single constraint violation disqualifies the employee from competing.
    Hard constraints cannot be overridden by any score.
    """

    def __init__(self, skill_engine: SemanticSkillEngine):
        self._skill_engine = skill_engine

    def is_suitable(
        self,
        employee: Dict[str, Any],
        task: StructuredTask,
        projected_workload: float,
    ) -> Tuple[bool, List[str]]:
        violations: List[str] = []
        current_workload = float(employee.get("workload", 50))

        # 1. Mandatory Workload Constraints (Hard 70% Limit)
        if current_workload > MAX_PROJECTED_WORKLOAD:
            violations.append(
                f"Current workload {current_workload:.1f}% > max {MAX_PROJECTED_WORKLOAD:.0f}% limit"
            )
        if projected_workload > MAX_PROJECTED_WORKLOAD:
            violations.append(
                f"Projected workload {projected_workload:.1f}% > max {MAX_PROJECTED_WORKLOAD:.0f}% limit"
            )

        # 2. Hard Busy constraint for high-effort tasks
        avail = employee.get("availability_status", "Available")
        if avail == "Busy" and task.estimated_hours > 4.0:
            violations.append(
                f"Employee is Busy; task requires {task.estimated_hours:.0f}h"
            )

        # 3. Mandatory Skill & Domain Match Constraints
        emp_skills = [_normalize_skill(s) for s in employee.get("skills", [])]
        desig = employee.get("designation", "").lower()

        # Score skills semantically
        skill_score, matched, critical_met = self._skill_engine.score(
            task.required_skills, task.preferred_skills,
            task.critical_skills, employee.get("skills", []),
        )

        # Check critical skills (if any)
        if task.critical_skills and not critical_met:
            violations.append("Missing required critical skill(s)")

        # Role alignment check
        role_aligned = False
        if task.role_requirements:
            role_aligned = any(r.lower() in desig or desig in r.lower() for r in task.role_requirements)

        # Domain safety guards: Prevent Technical Writers & UI Designers from getting core engineering tasks without explicit skills
        is_writer = "technical writer" in desig or "writer" in desig
        is_designer = "designer" in desig or "ui/ux" in desig
        task_domain = (task.domain or "").lower()

        if is_writer and task_domain in ("backend", "data", "ai", "ml", "devops", "security", "integration", "architecture", "frontend"):
            if skill_score < 50.0:
                violations.append(f"Technical Writer is not qualified for {task_domain} engineering deliverable")

        if is_designer and task_domain in ("backend", "data", "ai", "ml", "devops", "security", "integration", "architecture"):
            if skill_score < 50.0:
                violations.append(f"UI/UX Designer is not qualified for {task_domain} deliverable")

        # General skill threshold: Candidate must have at least 35% skill score OR strong role alignment with >= 20% skill
        if skill_score < 35.0 and not (role_aligned and skill_score >= 20.0):
            violations.append(f"Insufficient skill match ({skill_score:.0f}/100) for task requirements: {', '.join(task.required_skills[:3])}")

        return (len(violations) == 0), violations


# ──────────────────────────────────────────────────────────────────────────────
# WORKLOAD & CAPACITY ENGINE
# ──────────────────────────────────────────────────────────────────────────────

class WorkloadCapacityEngine:
    """
    Effort-based workload projection — replaces the +12% artificial increment.

    Formula:
      projected_workload% = (existing_hours + virtual_hours + new_task_hours)
                            / weekly_capacity × 100
    """

    def projected_workload(
        self, employee: Dict[str, Any], task_hours: float, virtual_hours: float = 0.0
    ) -> float:
        current_pct = max(0.0, min(100.0, float(employee.get("workload", 50))))
        current_hours = (current_pct / 100.0) * WEEKLY_CAPACITY_HOURS
        projected = current_hours + virtual_hours + task_hours
        return round(min(100.0, (projected / WEEKLY_CAPACITY_HOURS) * 100.0), 2)

    def available_hours(
        self, employee: Dict[str, Any], virtual_hours: float = 0.0
    ) -> float:
        current_pct = max(0.0, min(100.0, float(employee.get("workload", 50))))
        used = (current_pct / 100.0) * WEEKLY_CAPACITY_HOURS + virtual_hours
        return round(max(0.0, WEEKLY_CAPACITY_HOURS - used), 2)

    def score(self, projected_workload: float) -> float:
        if projected_workload > MAX_PROJECTED_WORKLOAD:
            return 0.0
        headroom = max(0.0, MAX_PROJECTED_WORKLOAD - projected_workload)
        base = (headroom / MAX_PROJECTED_WORKLOAD) * 100.0
        if projected_workload > 65.0:
            base -= 15.0
        elif projected_workload > 55.0:
            base -= 5.0
        return round(max(0.0, min(100.0, base)), 2)

    def workload_label(self, projected_workload: float) -> str:
        for lo, hi, label in WORKLOAD_BANDS:
            if lo <= projected_workload < hi:
                return label
        return "Overloaded (Excluded)"


# ──────────────────────────────────────────────────────────────────────────────
# EXPERIENCE ENGINE
# ──────────────────────────────────────────────────────────────────────────────

class ExperienceEngine:
    """
    Relevance-weighted experience scoring.
    Raw seniority alone is a weak signal — context (domain, role, prior projects) matters.
    """

    _DOMAIN_ROLE_MAP: Dict[str, List[str]] = {
        "frontend":    ["frontend", "ui/ux", "designer"],
        "backend":     ["backend", "full stack", "software engineer", "developer"],
        "ai":          ["ai", "ml", "machine learning", "data scientist", "data engineer"],
        "devops":      ["devops", "cloud", "reliability", "infrastructure", "platform"],
        "qa":          ["qa", "test", "quality"],
        "design":      ["designer", "ui/ux", "product designer"],
        "planning":    ["project manager", "business analyst", "architect", "product manager"],
        "security":    ["security", "cybersecurity", "backend"],
        "integration": ["full stack", "backend", "software engineer"],
        "data":        ["data", "database", "backend"],
        "general":     ["software engineer", "full stack", "developer"],
    }

    _DOMAIN_PROJECT_KEYWORDS: Dict[str, List[str]] = {
        "ai":          ["ai", "ml", "intelligence", "learning", "nlp", "model", "chat"],
        "frontend":    ["portal", "dashboard", "web", "ui", "frontend", "app"],
        "backend":     ["api", "service", "backend", "platform", "system", "server"],
        "devops":      ["deploy", "cloud", "infra", "devops", "ci", "pipeline"],
        "qa":          ["test", "qa", "quality", "automation"],
        "design":      ["design", "ux", "prototype", "ui"],
        "data":        ["data", "analytics", "warehouse", "etl"],
        "general":     ["system", "platform", "app", "solution"],
    }

    def score(self, employee: Dict[str, Any], task: StructuredTask) -> float:
        exp_years = max(0.0, float(employee.get("experience_years", 2.0)))
        designation = employee.get("designation", "").lower()
        prev_projects = [p.lower() for p in employee.get("prev_projects", [])]

        # Years of experience → 0-40 pts (non-linear, diminishing after 7y)
        year_score = min(40.0, (exp_years / 7.0) * 40.0)

        # Designation ↔ task domain relevance → 0-35 pts
        desig_rel = self._designation_relevance(designation, task.domain)
        desig_score = desig_rel * 35.0

        # Previous project relevance → 0-25 pts
        proj_rel = self._project_relevance(prev_projects, task)
        proj_score = proj_rel * 25.0

        total = year_score + desig_score + proj_score
        return round(min(100.0, max(0.0, total)), 2)

    def _designation_relevance(self, designation: str, domain: str) -> float:
        for dom, terms in self._DOMAIN_ROLE_MAP.items():
            if dom == domain or dom == "general":
                for term in terms:
                    if term in designation:
                        return 1.0 if dom == domain else 0.60
        if "full stack" in designation:
            return 0.72
        if any(t in designation for t in ("developer", "engineer", "programmer")):
            return 0.52
        return 0.20

    def _project_relevance(self, prev_projects: List[str], task: StructuredTask) -> float:
        keywords = self._DOMAIN_PROJECT_KEYWORDS.get(task.domain, self._DOMAIN_PROJECT_KEYWORDS["general"])
        for proj in prev_projects:
            for kw in keywords:
                if kw in proj:
                    return 1.0
            task_tokens = set(task.title.lower().split())
            proj_tokens = set(proj.lower().split())
            if task_tokens & proj_tokens:
                return 0.60
        return 0.0


# ──────────────────────────────────────────────────────────────────────────────
# AVAILABILITY ENGINE
# ──────────────────────────────────────────────────────────────────────────────

class AvailabilityEngine:
    """
    Deadline capacity ratio scoring — replaces the 3-tier enum (10 / 6 / 1).
    Calculates actual available hours and derives a capacity ratio.
    """

    _STATUS_MULTIPLIER: Dict[str, float] = {
        "Available": 1.0,
        "Partial":   0.60,
        "Busy":      0.15,
    }

    def __init__(self, workload_engine: WorkloadCapacityEngine):
        self._wl = workload_engine

    def score(
        self,
        employee: Dict[str, Any],
        task: StructuredTask,
        virtual_hours: float = 0.0,
    ) -> Tuple[float, float]:
        """Returns (score_0_to_100, effective_available_hours)."""
        raw_hours = self._wl.available_hours(employee, virtual_hours)
        multiplier = self._STATUS_MULTIPLIER.get(
            employee.get("availability_status", "Available"), 1.0
        )
        effective_hours = round(raw_hours * multiplier, 2)
        effort = max(0.01, task.estimated_hours)

        ratio = effective_hours / effort
        if ratio >= 2.0:
            s = 100.0
        elif ratio >= 1.5:
            s = 85.0 + (ratio - 1.5) * 30.0
        elif ratio >= 1.0:
            s = 65.0 + (ratio - 1.0) * 40.0
        elif ratio >= 0.5:
            s = 30.0 + (ratio - 0.5) * 70.0
        else:
            s = ratio * 60.0

        return round(max(0.0, min(100.0, s)), 2), effective_hours


# ──────────────────────────────────────────────────────────────────────────────
# HISTORICAL PERFORMANCE ENGINE
# ──────────────────────────────────────────────────────────────────────────────

class HistoricalPerformanceEngine:
    """
    Confidence-adjusted historical performance.
    Current schema has no task-completion history → uses neutral baseline.
    When historical data is absent: score = BASELINE, confidence = 0.
    Future: query completed tasks DB for employee-level on-time rates.
    """

    def score(
        self, employee: Dict[str, Any], task: StructuredTask
    ) -> Tuple[float, float]:
        """Returns (performance_score_0_to_100, confidence_0_to_1)."""
        return BASELINE_PERFORMANCE_SCORE, 0.0


# ──────────────────────────────────────────────────────────────────────────────
# CONFIDENCE ENGINE
# ──────────────────────────────────────────────────────────────────────────────

class ConfidenceEngine:
    """
    Confidence is an independent metric — NOT a proxy for the final score.
    High-scoring but closely-contested allocations are LESS confident.
    """

    def calculate(
        self,
        top_score: float,
        second_score: float,
        effort_confidence: float,
        data_completeness: float = 1.0,
    ) -> Tuple[int, str]:
        # Margin component (0–40 pts): larger margin → more confident
        margin = max(0.0, top_score - second_score)
        margin_component = min(40.0, margin * 2.0)

        # Effort quality (0–30 pts)
        effort_component = effort_confidence * 30.0

        # Data completeness (0–30 pts)
        data_component = data_completeness * 30.0

        raw = margin_component + effort_component + data_component
        confidence = int(round(min(100.0, max(0.0, raw))))
        level = (
            "HIGH"   if confidence >= CONFIDENCE_HIGH_THRESHOLD   else
            "MEDIUM" if confidence >= CONFIDENCE_MEDIUM_THRESHOLD else
            "LOW"
        )
        return confidence, level


# ──────────────────────────────────────────────────────────────────────────────
# RISK ENGINE
# ──────────────────────────────────────────────────────────────────────────────

class RiskEngine:
    """Multi-dimensional risk assessment per allocation decision."""

    def assess(
        self,
        winner: Dict[str, Any],
        task: StructuredTask,
        candidate_count: int,
        assignment_counts: Dict[str, int],
        confidence: int,
    ) -> Tuple[str, List[str]]:
        reasons: List[str] = []
        proj_wl = winner.get("projected_workload", 0.0)
        emp_id  = winner.get("emp_id", "")

        if proj_wl > 85.0:
            reasons.append(f"High projected workload: {proj_wl:.0f}% after assignment")

        if not winner.get("critical_skills_met", True):
            reasons.append("Partial match on one or more critical skills")

        task_count = assignment_counts.get(emp_id, 0)
        if task_count >= MAX_TASKS_PER_EMPLOYEE:
            reasons.append(
                f"Assignment concentration: {task_count + 1} tasks assigned to one employee"
            )

        if winner.get("skill_score", 100.0) < 50.0:
            reasons.append("Below-average semantic skill alignment with task requirements")

        avail_h = winner.get("available_hours", 999.0)
        if avail_h < task.estimated_hours * 1.05:
            reasons.append(
                f"Tight capacity: {avail_h:.1f}h available for {task.estimated_hours:.0f}h task"
            )

        if candidate_count == 1:
            reasons.append("Only one candidate passed hard constraints — no fallback option")

        if confidence < CONFIDENCE_MEDIUM_THRESHOLD:
            reasons.append("Low confidence recommendation — manual review advised")

        if task.effort_source == "estimated":
            reasons.append("Effort is AI-estimated; actual hours may vary")

        risk = "HIGH" if len(reasons) >= 3 else "MEDIUM" if reasons else "LOW"
        return risk, reasons


# ──────────────────────────────────────────────────────────────────────────────
# EXPLANATION ENGINE
# ──────────────────────────────────────────────────────────────────────────────

class ExplanationEngine:
    """
    Generates grounded, data-backed explanations.
    LLM is used to FORMAT the explanation — not to make decisions.
    Deterministic template always works as fallback.
    """

    _ENRICH_PROMPT = """Rewrite this AI workforce allocation rationale in ONE concise paragraph (max 55 words).
Use ONLY the facts below. Do NOT invent reasons, scores, or names.

Facts:
{facts}

Task: {task_title} ({complexity} complexity, {hours:.0f}h estimated)
Alternative considered: {alt_summary}

Return only the paragraph. No bullet points, no markdown, no headers."""

    def __init__(self, llm_client=None):
        self._llm = llm_client

    def explain(
        self,
        winner: Dict[str, Any],
        alternatives: List[Dict[str, Any]],
        task: StructuredTask,
    ) -> str:
        base = self._deterministic(winner, alternatives, task)
        if self._llm:
            try:
                enriched = self._llm_enrich(winner, alternatives, task, base)
                if enriched and len(enriched) > 30:
                    return enriched
            except Exception:
                pass
        return base

    def _deterministic(
        self,
        winner: Dict[str, Any],
        alternatives: List[Dict[str, Any]],
        task: StructuredTask,
    ) -> str:
        name     = winner["name"]
        score    = winner.get("final_score", 0.0)
        skill    = winner.get("skill_score", 0.0)
        wl       = winner.get("projected_workload", 0.0)
        wl_label = winner.get("workload_label", "")
        avail    = winner.get("available_hours", 0.0)
        exp      = winner.get("experience_score", 0.0)
        matched  = winner.get("matched_skills", [])

        lines = [
            f"{name} selected — composite score {score:.0f}/100:",
            f"  ✓ {skill:.0f}% semantic skill alignment"
            + (f" [{', '.join(matched[:2])}]" if matched else ""),
            f"  ✓ {wl:.0f}% projected workload ({wl_label})",
            f"  ✓ {avail:.0f}h available capacity → {task.estimated_hours:.0f}h needed",
            f"  ✓ Experience relevance score: {exp:.0f}/100",
        ]

        for alt in alternatives[:2]:
            diff: List[str] = []
            if alt.get("skill_score", 0.0) > skill + 3:
                diff.append(f"higher skill ({alt.get('skill_score', 0.0):.0f})")
            if alt.get("projected_workload", 0.0) > wl + 5:
                diff.append(f"higher workload ({alt.get('projected_workload', 0.0):.0f}%)")
            if alt.get("experience_score", 0.0) < exp - 5:
                diff.append(f"lower experience ({alt.get('experience_score', 0.0):.0f})")
            if diff:
                lines.append(f"  ✗ {alt['name']}: {'; '.join(diff)}")

        return "\n".join(lines)

    def _llm_enrich(
        self,
        winner: Dict[str, Any],
        alternatives: List[Dict[str, Any]],
        task: StructuredTask,
        base: str,
    ) -> Optional[str]:
        alt_text = "; ".join(
            f"{a['name']} (score={a.get('final_score',0):.0f}, wl={a.get('projected_workload',0):.0f}%)"
            for a in alternatives[:2]
        ) or "none"

        prompt = self._ENRICH_PROMPT.format(
            facts=base,
            task_title=task.title, complexity=task.complexity,
            hours=task.estimated_hours, alt_summary=alt_text,
        )
        try:
            response = self._llm.models.generate_content(
                model="gemini-2.5-flash", contents=prompt
            )
            if response and response.text:
                text = response.text.strip()
                if len(text) > 20:
                    return text
        except Exception:
            pass
        return None


# ──────────────────────────────────────────────────────────────────────────────
# GLOBAL OPTIMIZER
# ──────────────────────────────────────────────────────────────────────────────

class GlobalOptimizer:
    """
    Sequential greedy optimization with effort-based virtual workload tracking.

    Complexity: O(T × E) where T=tasks, E=employees.
    For 30 tasks × 40 employees = 1200 comparisons — very fast.

    Improvements over legacy:
    - Uses actual task effort hours (not +12% fixed increment)
    - Applies continuity bonus for same-phase assignments
    - Applies fairness penalty for over-concentrated assignments
    - Recalculates workload score at assignment time using accumulated virtual hours
    - Deterministic tie-breaking: workload → skill → availability → experience → emp_id
    """

    def optimize(
        self,
        scored_candidates: Dict[str, List[Dict[str, Any]]],
        tasks: List[StructuredTask],
        employees: List[Dict[str, Any]],
        workload_engine: WorkloadCapacityEngine,
        profile: AllocationProfile = AllocationProfile.BALANCED,
    ) -> Tuple[Dict[str, Dict[str, Any]], Dict[str, int]]:
        """
        Returns:
          assignments: {task_id: winner_candidate_dict}
          assignment_counts: {emp_id: int}
        """
        weights = ALLOCATION_WEIGHTS[profile]
        emp_lookup: Dict[str, Dict[str, Any]] = {e["id"]: e for e in employees}
        virtual_hours: Dict[str, float] = {e["id"]: 0.0 for e in employees}
        assignment_counts: Dict[str, int] = {e["id"]: 0 for e in employees}
        phase_last_emp: Dict[str, str] = {}   # phase_name → last emp_id
        assignments: Dict[str, Dict[str, Any]] = {}

        for task in tasks:
            candidates = scored_candidates.get(task.task_id, [])
            if not candidates:
                continue

            best_cand: Optional[Dict[str, Any]] = None
            best_adjusted: float = -999.0

            for cand in candidates:
                emp_id = cand["emp_id"]
                emp = emp_lookup.get(emp_id)
                if emp is None:
                    continue

                vh = virtual_hours.get(emp_id, 0.0)
                proj_wl = workload_engine.projected_workload(emp, task.estimated_hours, vh)

                # Drop candidates that exceeded capacity during this round
                if proj_wl > MAX_PROJECTED_WORKLOAD:
                    continue

                wl_score = workload_engine.score(proj_wl)

                # Rebuild weighted score with updated workload
                updated_final = (
                    cand["skill_score"]        * weights["skill"]
                    + wl_score                 * weights["workload"]
                    + cand["experience_score"] * weights["experience"]
                    + cand["availability_score"] * weights["availability"]
                    + cand["performance_score"] * weights["performance"]
                )

                # Phase continuity bonus
                if phase_last_emp.get(task.phase_name) == emp_id:
                    updated_final += CONTINUITY_BONUS

                # Fairness check: respect MAX_TASKS_PER_EMPLOYEE
                count = assignment_counts.get(emp_id, 0)
                if count >= MAX_TASKS_PER_EMPLOYEE:
                    continue

                vh = virtual_hours.get(emp_id, 0.0)
                proj_wl = workload_engine.projected_workload(emp, task.estimated_hours, vh)

                # Strictly drop candidates exceeding 70% workload
                if proj_wl > MAX_PROJECTED_WORKLOAD:
                    continue

                wl_score = workload_engine.score(proj_wl)

                # Rebuild weighted score with updated workload
                updated_final = (
                    cand["skill_score"]        * weights["skill"]
                    + wl_score                 * weights["workload"]
                    + cand["experience_score"] * weights["experience"]
                    + cand["availability_score"] * weights["availability"]
                    + cand["performance_score"] * weights["performance"]
                )

                # Phase continuity bonus
                if phase_last_emp.get(task.phase_name) == emp_id:
                    updated_final += CONTINUITY_BONUS

                # Fairness penalty (moderate for multiple assignments within limit)
                if count > 0:
                    updated_final -= FAIRNESS_PENALTY_PER_EXTRA_TASK * count

                updated_final = round(min(100.0, max(0.0, updated_final)), 4)

                # Deterministic tie-breaking (favor skill match strongly)
                if updated_final > best_adjusted or (
                    math.isclose(updated_final, best_adjusted, abs_tol=0.001) and (
                        best_cand is None or
                        cand["skill_score"] > best_cand.get("skill_score", 0) or
                        (math.isclose(cand["skill_score"], best_cand.get("skill_score", 0), abs_tol=0.1) and
                         proj_wl < best_cand.get("projected_workload", 999)) or
                        emp_id < best_cand.get("emp_id", "zzz")
                    )
                ):
                    best_adjusted = updated_final
                    best_cand = {
                        **cand,
                        "projected_workload": round(proj_wl, 2),
                        "workload_score": round(wl_score, 2),
                        "final_score": round(updated_final, 2),
                    }

            if best_cand:
                emp_id = best_cand["emp_id"]
                virtual_hours[emp_id] = virtual_hours.get(emp_id, 0.0) + task.estimated_hours
                assignment_counts[emp_id] = assignment_counts.get(emp_id, 0) + 1
                phase_last_emp[task.phase_name] = emp_id
                best_cand["assignment_count"] = assignment_counts[emp_id]
                assignments[task.task_id] = best_cand

        return assignments, assignment_counts


# ──────────────────────────────────────────────────────────────────────────────
# ELITE ALLOCATION ENGINE  (Orchestrator)
# ──────────────────────────────────────────────────────────────────────────────

class EliteAllocationEngine:
    """
    Orchestrates the full 6-phase allocation pipeline.
    Singleton instance reused across requests for cache efficiency.
    """

    def __init__(self, llm_client=None):
        self._skill_engine       = SemanticSkillEngine()
        self._workload_engine    = WorkloadCapacityEngine()
        self._constraint_filter  = HardConstraintFilter(self._skill_engine)
        self._experience_engine  = ExperienceEngine()
        self._availability_engine = AvailabilityEngine(self._workload_engine)
        self._performance_engine = HistoricalPerformanceEngine()
        self._confidence_engine  = ConfidenceEngine()
        self._risk_engine        = RiskEngine()
        self._explanation_engine = ExplanationEngine(llm_client)
        self._task_intelligence  = TaskIntelligence(llm_client)
        self._optimizer          = GlobalOptimizer()

    def allocate(
        self,
        project_id: str,
        project_name: str,
        project_description: str,
        phases: List[Any],
        employees: List[Dict[str, Any]],
        profile: AllocationProfile = AllocationProfile.BALANCED,
    ) -> List[TaskItem]:
        weights = ALLOCATION_WEIGHTS[profile]
        structured_tasks: List[StructuredTask] = []
        task_counter = 1

        def _phase_attr(p, attr, default):
            """Safely read a phase attribute from either an object or a dict."""
            if isinstance(p, dict):
                return p.get(attr, default)
            return getattr(p, attr, default)

        # ── PHASE 1: Task Intelligence ───────────────────────────────────────────
        total_delivs = sum(len(_phase_attr(p, "key_deliverables", [])) for p in phases)
        print(f"[EliteAllocator] Phase 1: Task Intelligence — {total_delivs} deliverables")
        for phase in phases:
            p_name = _phase_attr(phase, "phase_name", "")
            p_end  = _phase_attr(phase, "end_day", 30)
            delivs = _phase_attr(phase, "key_deliverables", [])

            for deliv in delivs:
                task_id = f"task_{project_id[:6]}_{task_counter:02d}"
                st = self._task_intelligence.analyze(
                    task_id=task_id, phase_name=p_name, deliverable=deliv,
                    project_name=project_name, project_description=project_description,
                    deadline_day=int(p_end),
                )
                structured_tasks.append(st)
                task_counter += 1

        if not structured_tasks:
            return []

        print(f"[EliteAllocator] Phase 2+3: Hard Constraints + Multi-Factor Scoring — {len(employees)} employees × {len(structured_tasks)} tasks")

        # ── PHASE 2 + 3: Hard Constraints + Multi-Factor Scoring ───────────────
        scored_candidates: Dict[str, List[Dict[str, Any]]] = {}

        for task in structured_tasks:
            candidates: List[Dict[str, Any]] = []

            for emp in employees:
                # Initial workload projection (virtual hours = 0 at scoring stage)
                proj_wl = self._workload_engine.projected_workload(emp, task.estimated_hours, 0.0)

                # Hard constraint gate
                suitable, _ = self._constraint_filter.is_suitable(emp, task, proj_wl)
                if not suitable:
                    continue

                # Multi-factor scoring
                skill_score, matched, critical_met = self._skill_engine.score(
                    task.required_skills, task.preferred_skills,
                    task.critical_skills, emp.get("skills", []),
                )
                wl_score       = self._workload_engine.score(proj_wl)
                exp_score      = self._experience_engine.score(emp, task)
                avail_score, avail_hours = self._availability_engine.score(emp, task, 0.0)
                perf_score, _ = self._performance_engine.score(emp, task)

                final = (
                    skill_score  * weights["skill"]
                    + wl_score   * weights["workload"]
                    + exp_score  * weights["experience"]
                    + avail_score * weights["availability"]
                    + perf_score * weights["performance"]
                )
                final = round(min(100.0, max(0.0, final)), 2)

                candidates.append({
                    "emp_id":             emp["id"],
                    "name":               emp["name"],
                    "designation":        emp.get("designation", ""),
                    "skill_score":        round(skill_score, 2),
                    "workload_score":     round(wl_score, 2),
                    "experience_score":   round(exp_score, 2),
                    "availability_score": round(avail_score, 2),
                    "performance_score":  round(perf_score, 2),
                    "final_score":        final,
                    "projected_workload": round(proj_wl, 2),
                    "available_hours":    round(avail_hours, 2),
                    "matched_skills":     matched,
                    "critical_skills_met": critical_met,
                    "workload_label":     self._workload_engine.workload_label(proj_wl),
                    "effort_confidence":  task.effort_confidence,
                    "emp_data":           emp,
                })

            # Deterministic sort
            candidates.sort(key=lambda c: (
                -c["final_score"],
                c["projected_workload"],
                -c["skill_score"],
                -c["availability_score"],
                -c["experience_score"],
                c["emp_id"],
            ))
            scored_candidates[task.task_id] = candidates

        # ── PHASE 4: Global Optimization ────────────────────────────────────────
        print(f"[EliteAllocator] Phase 4: Global Optimization")
        final_assignments, assignment_counts = self._optimizer.optimize(
            scored_candidates, structured_tasks, employees,
            self._workload_engine, profile,
        )

        # ── PHASE 5 + 6: Confidence, Risk, Explanation ─────────────────────────
        print(f"[EliteAllocator] Phase 5+6: Confidence + Risk + Explanation")
        result_tasks: List[TaskItem] = []

        for task in structured_tasks:
            candidates = scored_candidates.get(task.task_id, [])
            winner     = final_assignments.get(task.task_id)

            # Fallback ONLY IF candidate strictly satisfies workload <= 70% and skill >= 35%
            if winner is None and candidates:
                for c in candidates:
                    if c["projected_workload"] <= MAX_PROJECTED_WORKLOAD and c["skill_score"] >= 35.0:
                        winner = c
                        break

            if winner is None:
                # No suitable candidate at all
                result_tasks.append(TaskItem(
                    id=task.task_id, project_id=project_id,
                    project_name=project_name, phase_name=task.phase_name,
                    title=task.title,
                    description=task.description,
                    assigned_role="Unassigned", assigned_to="Unassigned",
                    assigned_emp_id=None, match_score=0,
                    ai_rationale=(
                        "⚠ No suitable candidate passed hard constraints. "
                        f"Manual assignment required (workload limit <= {MAX_PROJECTED_WORKLOAD:.0f}%). "
                        f"Required skills: {', '.join(task.required_skills)}"
                    ),
                    status="To Do",
                    priority="High" if task.priority in ("high", "critical") else "Medium",
                    due_day=task.deadline_day,
                    # Enrichment fields
                    confidence=0,
                    confidence_level="LOW",
                    risk="HIGH",
                    risk_reasons=["No candidate passed hard constraints (workload <= 70% and skill match) — manual assignment required"],
                    estimated_hours=task.estimated_hours,
                    deadline_feasible=False,
                    allocation_strategy=profile,
                ))
                continue

            top_score    = winner["final_score"]
            alt_cands    = [c for c in candidates if c["emp_id"] != winner["emp_id"]]
            second_score = alt_cands[0]["final_score"] if alt_cands else max(0.0, top_score - 25.0)

            confidence, conf_level = self._confidence_engine.calculate(
                top_score=top_score, second_score=second_score,
                effort_confidence=task.effort_confidence, data_completeness=1.0,
            )
            risk_level, risk_reasons = self._risk_engine.assess(
                winner=winner, task=task,
                candidate_count=len(candidates),
                assignment_counts=assignment_counts,
                confidence=confidence,
            )

            top3_alts = [
                {
                    "name": c["name"], "designation": c["designation"],
                    "final_score": c["final_score"],
                    "skill_score": c["skill_score"],
                    "projected_workload": c["projected_workload"],
                    "workload_label": c["workload_label"],
                }
                for c in alt_cands[:2]
            ]

            explanation = self._explanation_engine.explain(winner, top3_alts, task)

            # Build compact rationale for TaskItem.ai_rationale
            scoring_header = (
                f"Score {winner['final_score']:.0f}/100 | "
                f"Skill {winner['skill_score']:.0f} | "
                f"Workload {winner['projected_workload']:.0f}% ({winner['workload_label']}) | "
                f"Confidence {conf_level}"
            )
            if risk_level != "LOW":
                risk_str = "; ".join(risk_reasons[:2])
                scoring_header += f" | ⚠ Risk {risk_level}: {risk_str}"

            full_rationale = f"{scoring_header}\n{explanation}"

            result_tasks.append(TaskItem(
                id=task.task_id, project_id=project_id,
                project_name=project_name, phase_name=task.phase_name,
                title=task.title, description=task.description,
                assigned_role=winner["designation"],
                assigned_to=winner["name"],
                assigned_emp_id=winner["emp_id"],
                match_score=int(round(winner["final_score"])),
                ai_rationale=full_rationale,
                status="To Do",
                priority="High" if task.priority in ("high", "critical") else "Medium",
                due_day=task.deadline_day,
                # ── Elite enrichment fields ──────────────────────────────────────────
                confidence=confidence,
                confidence_level=conf_level,
                risk=risk_level,
                risk_reasons=risk_reasons if risk_reasons else None,
                projected_workload=winner["projected_workload"],
                estimated_hours=task.estimated_hours,
                deadline_feasible=(
                    winner.get("available_hours", 0.0) >= task.estimated_hours
                ),
                allocation_strategy=profile,
                scoring_breakdown={
                    "skill":        round(winner["skill_score"], 1),
                    "workload":     round(winner.get("workload_score", 0.0), 1),
                    "experience":   round(winner["experience_score"], 1),
                    "availability": round(winner["availability_score"], 1),
                    "performance":  round(winner["performance_score"], 1),
                    "final":        round(winner["final_score"], 1),
                    "workload_label": winner["workload_label"],
                    "matched_skills": winner.get("matched_skills", []),
                    "effort_source": task.effort_source,
                    "complexity":   task.complexity,
                },
                alternatives=top3_alts if top3_alts else None,
            ))

        print(f"[EliteAllocator] DONE: Allocated {len(result_tasks)} tasks | Profile: {profile}")
        return result_tasks


# ──────────────────────────────────────────────────────────────────────────────
# SINGLETON FACTORY
# ──────────────────────────────────────────────────────────────────────────────

_INSTANCE: Optional[EliteAllocationEngine] = None


def get_elite_engine(llm_client=None) -> EliteAllocationEngine:
    """
    Return (or create) the singleton EliteAllocationEngine.
    Caches are preserved across requests for efficiency.
    """
    global _INSTANCE
    if _INSTANCE is None:
        _INSTANCE = EliteAllocationEngine(llm_client=llm_client)
    return _INSTANCE
