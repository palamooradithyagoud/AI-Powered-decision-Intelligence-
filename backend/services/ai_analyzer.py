import os
import json
import re
import math
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

from models.schemas import (
    AIAnalysisResult, ProjectSummary, ProjectFeatures, FeatureItem,
    MustNeedRequirement, RoleRequirement, EmployeeAnalysis,
    PhaseTimeline, TimelineBreakdown, TechRecommendation,
    RiskItem, FeasibilityDimension, FeasibilityAnalysis,
    SuggestedAdjustments, AIRecommendation, TaskItem
)


class AIProjectAnalyzer:
    def __init__(self):
        self.client = None
        self._init_gemini_client()

    def _init_gemini_client(self):
        key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if key:
            try:
                from google import genai
                self.client = genai.Client(api_key=key)
                print(f"[AI Analyzer] Google Gemini SDK active (API key: ...{key[-6:]})")
            except Exception as e:
                print(f"[AI Analyzer] Notice: Gemini SDK init error: {e}")

    def _build_analysis_prompt(
        self,
        name: str,
        description: str,
        expected_days: int,
        available_employees: int,
        requirements: str
    ) -> str:
        return f"""You are an expert Chief Technology Officer and Senior Technical Project Manager.
Analyze the following project thoroughly and return a valid JSON object strictly adhering to the schema.

Project Name: {name}
Project Description: {description}
Target Completion Timeline: {expected_days} days
Available Employees: {available_employees}
Project Requirements:
{requirements}

Return ONLY a valid JSON object with the following exact keys and structure:
{{
  "summary": {{
    "what_it_is": "Concise definition of the system",
    "problem_solved": "Key operational or market problem it eliminates",
    "what_needs_to_be_built": "Core system components to build"
  }},
  "features": {{
    "must_have": [
      {{"name": "Feature 1", "description": "Details", "complexity": "High|Medium|Low", "rationale": "Why it's essential"}}
    ],
    "optional": [
      {{"name": "Optional Feature 1", "description": "Details", "complexity": "Medium|Low", "rationale": "Nice to have benefit"}}
    ]
  }},
  "must_need_requirements": [
    {{"category": "Authentication", "items": ["JWT", "Role-based tokens"], "rationale": "Security reason"}},
    {{"category": "Database", "items": ["PostgreSQL schema", "Redis caching"], "rationale": "Data persistence reason"}},
    {{"category": "APIs & Integration", "items": ["REST / GraphQL endpoints"], "rationale": "Integration needs"}},
    {{"category": "AI / ML Models", "items": ["LLM / Custom vision pipeline"], "rationale": "Core intelligence"}},
    {{"category": "Backend & Services", "items": ["Async microservices"], "rationale": "Business logic"}},
    {{"category": "Frontend & UI", "items": ["Responsive Web Portal"], "rationale": "User interface"}},
    {{"category": "Cloud & Infrastructure", "items": ["Docker / AWS / CI/CD"], "rationale": "Deployment stability"}}
  ],
  "employee_analysis": {{
    "roles": [
      {{"role": "Frontend Developer", "required_count": 2, "rationale": "Reason"}},
      {{"role": "Backend Developer", "required_count": 2, "rationale": "Reason"}},
      {{"role": "AI/ML Engineer", "required_count": 1, "rationale": "Reason"}},
      {{"role": "UI/UX Designer", "required_count": 1, "rationale": "Reason"}},
      {{"role": "DevOps Engineer", "required_count": 1, "rationale": "Reason"}},
      {{"role": "QA Engineer", "required_count": 1, "rationale": "Reason"}}
    ],
    "total_recommended": 8,
    "total_available": {available_employees},
    "status": "Sufficient|Employee Shortage|Resource Overload",
    "gap_delta": -2,
    "analysis_summary": "Summary of resource capacity vs demand"
  }},
  "timeline_breakdown": {{
    "phases": [
      {{"phase_name": "Planning & Architecture", "start_day": 1, "end_day": 10, "duration_days": 10, "description": "Scope", "key_deliverables": ["Specs"], "dependencies": []}},
      {{"phase_name": "UI/UX Design", "start_day": 8, "end_day": 20, "duration_days": 13, "description": "Figma design", "key_deliverables": ["Prototypes"], "dependencies": ["Planning"]}},
      {{"phase_name": "Backend Development", "start_day": 15, "end_day": 45, "duration_days": 31, "description": "APIs & DB", "key_deliverables": ["APIs"], "dependencies": ["Planning"]}},
      {{"phase_name": "Frontend Development", "start_day": 22, "end_day": 52, "duration_days": 31, "description": "UI implementation", "key_deliverables": ["Components"], "dependencies": ["UI/UX Design"]}},
      {{"phase_name": "AI/ML Integration", "start_day": 25, "end_day": 50, "duration_days": 26, "description": "Models & Prompts", "key_deliverables": ["Inference API"], "dependencies": ["Backend"]}},
      {{"phase_name": "System Integration", "start_day": 48, "end_day": 62, "duration_days": 15, "description": "End to end integration", "key_deliverables": ["Integrated system"], "dependencies": ["Frontend", "Backend"]}},
      {{"phase_name": "Testing & QA", "start_day": 58, "end_day": 72, "duration_days": 15, "description": "E2E, Performance, Security", "key_deliverables": ["QA Signoff"], "dependencies": ["Integration"]}},
      {{"phase_name": "Deployment & Infra", "start_day": 70, "end_day": 80, "duration_days": 11, "description": "Production rollout", "key_deliverables": ["Live System"], "dependencies": ["Testing"]}},
      {{"phase_name": "Buffer & Contingency", "start_day": 78, "end_day": {expected_days}, "duration_days": 10, "description": "Risk mitigation buffer", "key_deliverables": ["Buffer period"], "dependencies": ["Deployment"]}}
    ],
    "total_calculated_days": {expected_days},
    "expected_days": {expected_days},
    "variance_days": 0,
    "buffer_days": 8
  }},
  "tools_and_technologies": [
    {{"layer": "Frontend", "technology": "Next.js 15 (React, TypeScript)", "rationale": "SSR, SEO and speed"}},
    {{"layer": "Backend", "technology": "FastAPI (Python)", "rationale": "High throughput and native AI interop"}},
    {{"layer": "Database", "technology": "PostgreSQL + pgvector", "rationale": "ACID compliance & vector search"}},
    {{"layer": "AI/ML", "technology": "Gemini 1.5 Pro / PyTorch", "rationale": "State-of-the-art multimodal reasoning"}},
    {{"layer": "APIs", "technology": "REST / WebSockets", "rationale": "Real-time updates and standard interoperability"}},
    {{"layer": "Cloud/Deployment", "technology": "AWS ECS / Docker / Cloudflare", "rationale": "Scalable containerized deployment"}},
    {{"layer": "DevOps", "technology": "GitHub Actions + Terraform", "rationale": "Automated CI/CD & IaC"}},
    {{"layer": "Version Control", "technology": "Git + GitHub Enterprise", "rationale": "Branch protection & team collaboration"}}
  ],
  "risk_analysis": [
    {{"risk": "Resource Shortage", "probability": "High|Medium|Low", "impact": "High|Medium|Low", "severity": "Critical|High|Medium|Low", "reason": "Reason", "mitigation": "Mitigation"}}
  ],
  "feasibility": {{
    "status": "FEASIBLE|FEASIBLE WITH CHANGES|NOT FEASIBLE",
    "feasibility_score": 82,
    "dimensions": {{
      "scope_score": 85,
      "timeline_score": 75,
      "manpower_score": 80,
      "technical_risk_score": 85,
      "complexity_score": 80
    }},
    "key_verdict": "Clear summary statement on feasibility"
  }},
  "ai_recommendation": {{
    "primary_advice": "High level strategic guidance",
    "actionable_steps": ["Step 1", "Step 2", "Step 3"],
    "suggested_adjustments": {{
      "recommended_additional_employees": 1,
      "recommended_timeline_extension_days": 10,
      "optional_features_to_drop": ["Feature X"],
      "critical_skills_needed": ["Senior Backend", "DevOps"]
    }}
  }}
}}"""

    def analyze_project(
        self,
        name: str,
        description: str,
        expected_days: int,
        available_employees: int,
        requirements: str
    ) -> AIAnalysisResult:
        """
        Main analysis entrypoint:
        1. Primary: attempts Gemini generation.
        2. Fallback (e.g. rate limit / quota exceeded): cascades to Groq API.
        3. Tertiary: falls back to intelligent deterministic / heuristic NLP reasoning engine.
        """
        if not self.client:
            self._init_gemini_client()

        # 1. Primary Attempt: Google Gemini API
        if self.client:
            try:
                result = self._analyze_with_gemini(name, description, expected_days, available_employees, requirements)
                if result:
                    return result
            except Exception as e:
                print(f"[AI Analyzer] Gemini API hit limit or error: {e}")

        # 2. Secondary Fallback Attempt: Groq API
        print("[AI Analyzer] Cascading to Groq fallback engine...")
        try:
            groq_result = self._analyze_with_groq(name, description, expected_days, available_employees, requirements)
            if groq_result:
                return groq_result
        except Exception as groq_err:
            print(f"[AI Analyzer] Groq fallback error: {groq_err}")

        # 3. Tertiary Fallback: Intelligent heuristic rule engine
        print("[AI Analyzer] Cascading to intelligent algorithmic reasoning engine...")
        return self._analyze_algorithmic(name, description, expected_days, available_employees, requirements)

    def _analyze_with_gemini(
        self,
        name: str,
        description: str,
        expected_days: int,
        available_employees: int,
        requirements: str
    ) -> Optional[AIAnalysisResult]:
        prompt = self._build_analysis_prompt(name, description, expected_days, available_employees, requirements)
        models_to_try = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']
        for mod in models_to_try:
            try:
                response = self.client.models.generate_content(
                    model=mod,
                    contents=prompt,
                    config={'response_mime_type': 'application/json'}
                )
                if response and response.text:
                    cleaned = response.text.strip()
                    if cleaned.startswith("```json"):
                        cleaned = cleaned[7:]
                    if cleaned.startswith("```"):
                        cleaned = cleaned[3:]
                    if cleaned.endswith("```"):
                        cleaned = cleaned[:-3]
                    cleaned = cleaned.strip()
                    data = json.loads(cleaned)

                    # Normalize feasibility status if needed
                    if "feasibility" in data and isinstance(data["feasibility"], dict):
                        f_status = str(data["feasibility"].get("status", "FEASIBLE")).upper().strip()
                        if "CHANGE" in f_status:
                            data["feasibility"]["status"] = "FEASIBLE WITH CHANGES"
                        elif "NOT" in f_status or "UNFEASIBLE" in f_status:
                            data["feasibility"]["status"] = "NOT FEASIBLE"
                        else:
                            data["feasibility"]["status"] = "FEASIBLE"

                    # Normalize employee status
                    if "employee_analysis" in data and isinstance(data["employee_analysis"], dict):
                        emp_status = str(data["employee_analysis"].get("status", "Sufficient")).strip()
                        if "short" in emp_status.lower() or "deficit" in emp_status.lower():
                            data["employee_analysis"]["status"] = "Employee Shortage"
                        elif "over" in emp_status.lower() or "excess" in emp_status.lower():
                            data["employee_analysis"]["status"] = "Resource Overload"
                        else:
                            data["employee_analysis"]["status"] = "Sufficient"

                    data["engine"] = f"Google Gemini ({mod})"
                    print(f"[AI Analyzer] Successfully analyzed using Gemini Model: {mod}")
                    return AIAnalysisResult(**data)
            except Exception as model_err:
                print(f"[AI Analyzer] Gemini Model {mod} error: {model_err}")
                continue
        return None

    def _analyze_with_groq(
        self,
        name: str,
        description: str,
        expected_days: int,
        available_employees: int,
        requirements: str
    ) -> Optional[AIAnalysisResult]:
        """
        Secondary fallback engine powered by Groq high-speed inference when Gemini
        hits rate limits or quota caps.
        """
        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            return None

        prompt = self._build_analysis_prompt(name, description, expected_days, available_employees, requirements)
        models_to_try = ['openai/gpt-oss-120b', 'qwen/qwen3.6-27b', 'groq/compound-mini', 'openai/gpt-oss-20b', 'groq/compound']
        import urllib.request

        for mod in models_to_try:
            try:
                payload = {
                    "model": mod,
                    "messages": [
                        {"role": "system", "content": "You are an expert enterprise CTO and technical project manager. Return ONLY a single complete valid, raw JSON object adhering strictly to the requested schema without any markdown formatting, preamble, or conversational text. Include all 9 top-level keys."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2,
                    "max_tokens": 4096
                }
                if mod in ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b']:
                    payload["response_format"] = {"type": "json_object"}

                req = urllib.request.Request(
                    "https://api.groq.com/openai/v1/chat/completions",
                    data=json.dumps(payload).encode("utf-8"),
                    headers={
                        "Authorization": f"Bearer {groq_key}",
                        "Content-Type": "application/json",
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) PlanPulse/1.0"
                    }
                )
                with urllib.request.urlopen(req, timeout=35) as resp:
                    resp_data = json.loads(resp.read().decode("utf-8"))
                    content = resp_data["choices"][0]["message"]["content"]
                    cleaned = content.strip()
                    if cleaned.startswith("```json"):
                        cleaned = cleaned[7:]
                    if cleaned.startswith("```"):
                        cleaned = cleaned[3:]
                    if cleaned.endswith("```"):
                        cleaned = cleaned[:-3]
                    cleaned = cleaned.strip()

                    try:
                        data = json.loads(cleaned)
                    except Exception:
                        json_match = re.search(r'(\{[\s\S]*\})', cleaned)
                        if json_match:
                            data = json.loads(json_match.group(1))
                        else:
                            raise ValueError(f"No JSON found in Groq response for {mod}")

                    # Normalize feasibility status
                    if "feasibility" in data and isinstance(data["feasibility"], dict):
                        f_status = str(data["feasibility"].get("status", "FEASIBLE")).upper().strip()
                        if "CHANGE" in f_status:
                            data["feasibility"]["status"] = "FEASIBLE WITH CHANGES"
                        elif "NOT" in f_status or "UNFEASIBLE" in f_status:
                            data["feasibility"]["status"] = "NOT FEASIBLE"
                        else:
                            data["feasibility"]["status"] = "FEASIBLE"

                    # Normalize employee status
                    if "employee_analysis" in data and isinstance(data["employee_analysis"], dict):
                        emp_status = str(data["employee_analysis"].get("status", "Sufficient")).strip()
                        if "short" in emp_status.lower() or "deficit" in emp_status.lower():
                            data["employee_analysis"]["status"] = "Employee Shortage"
                        elif "over" in emp_status.lower() or "excess" in emp_status.lower():
                            data["employee_analysis"]["status"] = "Resource Overload"
                        else:
                            data["employee_analysis"]["status"] = "Sufficient"

                    data["engine"] = f"Groq AI ({mod})"
                    try:
                        result = AIAnalysisResult(**data)
                        print(f"[AI Analyzer] Successfully analyzed using Groq Fallback Model: {mod}")
                        return result
                    except Exception as val_err:
                        print(f"[AI Analyzer] Notice: Groq model {mod} returned partial schema ({val_err}), completing with algorithmic synthesis...")
                        # Merge with algorithmic baseline so all valid Groq fields are preserved
                        base_dict = self._analyze_algorithmic(name, description, expected_days, available_employees, requirements).model_dump()
                        for k, v in data.items():
                            if v is not None and k in base_dict:
                                if isinstance(v, dict) and isinstance(base_dict[k], dict):
                                    base_dict[k].update(v)
                                elif isinstance(v, list) and len(v) > 0:
                                    base_dict[k] = v
                                elif isinstance(v, (str, int, float, bool)):
                                    base_dict[k] = v
                        base_dict["engine"] = f"Groq AI ({mod})"
                        print(f"[AI Analyzer] Successfully synthesized complete plan with Groq ({mod}) + Engine")
                        return AIAnalysisResult(**base_dict)
            except Exception as e:
                print(f"[AI Analyzer] Groq Model {mod} error: {e}")
                continue
        return None

    def _analyze_algorithmic(
        self,
        name: str,
        description: str,
        expected_days: int,
        available_employees: int,
        requirements: str
    ) -> AIAnalysisResult:
        """
        Deep deterministic NLP and engineering estimation engine that produces
        rich, realistic, and strictly coherent project plans.
        """
        full_text = f"{name} {description} {requirements}".lower()

        # 1. Keyword and Domain Detection
        is_ai = any(w in full_text for w in ["ai", "ml", "llm", "machine learning", "nlp", "vision", "model", "prediction", "intelligent", "chatbot", "rag", "neural"])
        is_mobile = any(w in full_text for w in ["mobile", "ios", "android", "react native", "flutter", "app"])
        is_ecommerce_or_payments = any(w in full_text for w in ["payment", "stripe", "checkout", "cart", "ecommerce", "store", "billing", "subscription", "wallet"])
        is_realtime_or_iot = any(w in full_text for w in ["realtime", "websocket", "iot", "sensor", "telemetry", "streaming", "live", "gps", "tracking"])
        is_enterprise_or_security = any(w in full_text for w in ["hipaa", "gdpr", "enterprise", "compliance", "audit", "rbac", "multi-tenant", "encryption", "auth"])

        # 2. Extract and Categorize Requirements
        req_lines = [l.strip().lstrip("-*1234567890. ") for l in requirements.split("\n") if len(l.strip()) > 3]
        if not req_lines:
            req_lines = [
                "User Interface & Experience with responsive workflows",
                "Scalable Backend API service with secure database",
                "Integration with external APIs and third-party services",
                "Data security, validation and automated testing"
            ]

        # 3. Features Breakdown (Must-Have vs Optional)
        must_have: List[FeatureItem] = []
        optional: List[FeatureItem] = []

        # Generate intelligent features based on requirements
        for idx, line in enumerate(req_lines):
            complexity = "High" if any(w in line.lower() for w in ["ai", "realtime", "payment", "security", "stream", "engine", "analytics"]) else ("Medium" if idx % 2 == 0 else "Low")
            if idx < math.ceil(len(req_lines) * 0.7):
                must_have.append(FeatureItem(
                    name=line[:60] + ("..." if len(line) > 60 else ""),
                    description=f"Core operational capability: {line}. Essential for primary user journey and business requirements.",
                    complexity=complexity,
                    rationale="Critical path dependency required for MVP launch."
                ))
            else:
                optional.append(FeatureItem(
                    name=line[:60] + ("..." if len(line) > 60 else ""),
                    description=f"Enhancement feature: {line}. Extends baseline functionality with enriched user experience.",
                    complexity="Medium" if complexity == "High" else "Low",
                    rationale="Can be phased into v1.1 if timeline or headcount constraints arise."
                ))

        if not optional:
            optional.append(FeatureItem(
                name="Advanced Analytics & Custom Reporting Dashboard",
                description="Aggregated usage insights, real-time telemetry metrics, and exportable PDF/CSV reports.",
                complexity="Medium",
                rationale="Value-add feature that can be scheduled for phase 2 release."
            ))
            optional.append(FeatureItem(
                name="Automated Email & Push Notification Triggers",
                description="Event-driven alerting and digest summaries for key system events.",
                complexity="Low",
                rationale="Supplementary notification layer."
            ))

        # 4. Must-Need Requirements
        must_need: List[MustNeedRequirement] = []
        must_need.append(MustNeedRequirement(
            category="Authentication & Security",
            items=["OAuth2 / JWT Token Management", "Role-Based Access Control (RBAC)", "HTTPS / TLS Encryption & Input Sanitization"],
            rationale="Protects sensitive corporate data and guarantees isolated user sessions."
        ))
        
        db_items = ["PostgreSQL for relational ACID transactions", "Redis for high-speed caching & session state"]
        if is_ai:
            db_items.append("pgvector / Vector Database for embeddings and semantic similarity")
        must_need.append(MustNeedRequirement(
            category="Database & Persistence",
            items=db_items,
            rationale="Provides reliable persistent storage, low latency query caching, and index optimization."
        ))

        api_items = ["RESTful API architecture with OpenAPI schema", "JSON error handling and rate limiting"]
        if is_realtime_or_iot:
            api_items.append("WebSockets / Server-Sent Events (SSE) for live streaming data")
        if is_ecommerce_or_payments:
            api_items.append("Stripe / Payment Gateway Webhooks with idempotent handlers")
        must_need.append(MustNeedRequirement(
            category="APIs & Integration Layer",
            items=api_items,
            rationale="Enables secure, scalable data exchange between client applications and downstream microservices."
        ))

        if is_ai:
            must_need.append(MustNeedRequirement(
                category="AI / Machine Learning Pipeline",
                items=["LLM / Foundation Model API integration", "Prompt engineering & Guardrails framework", "RAG (Retrieval-Augmented Generation) context injection", "Evaluation & fallback fallback handler"],
                rationale="Drives core intelligent analysis, automated predictions, and decision support."
            ))

        must_need.append(MustNeedRequirement(
            category="Backend Architecture",
            items=["FastAPI / Node.js asynchronous service framework", "Background worker queue (Celery / BullMQ)", "Structured logging & distributed tracing"],
            rationale="Coordinates business logic, compute execution, and high-concurrency request handling."
        ))

        must_need.append(MustNeedRequirement(
            category="Frontend & Client Experience",
            items=["Next.js / React with TypeScript & Tailwind CSS", "Responsive layouts with WCAG accessibility standards", "State management & optimistic UI updates"],
            rationale="Delivers a frictionless, fast, and intuitive user interface across devices."
        ))

        must_need.append(MustNeedRequirement(
            category="Cloud Infrastructure & DevOps",
            items=["Docker containerization", "CI/CD automated build and test pipeline", "Cloud hosting (AWS / GCP / Cloudflare) with auto-scaling", "Health check probes and uptime monitoring"],
            rationale="Guarantees 99.9% availability, reproducible deployments, and rapid disaster recovery."
        ))

        # 5. Team Composition & Resource Estimation
        base_frontend = 1 if len(must_have) <= 3 else 2
        base_backend = 2 if len(must_have) > 4 or is_ai or is_realtime_or_iot else 1
        base_ai = 1 if is_ai else 0
        base_uiux = 1
        base_qa = 1 if expected_days > 20 or len(must_have) > 3 else 0
        base_devops = 1 if is_enterprise_or_security or expected_days > 40 else 0

        # Adjust for short timeline compression (mythical man-month consideration)
        if expected_days < 30 and len(must_have) >= 5:
            base_frontend += 1
            base_backend += 1

        roles: List[RoleRequirement] = []
        roles.append(RoleRequirement(
            role="Frontend Developer",
            required_count=base_frontend,
            rationale=f"Develop client interfaces, responsive state workflows, and integration with {len(must_have)} core features."
        ))
        roles.append(RoleRequirement(
            role="Backend Developer",
            required_count=base_backend,
            rationale="Build secure API endpoints, database models, business logic orchestration, and background queues."
        ))
        if base_ai > 0:
            roles.append(RoleRequirement(
                role="AI/ML Engineer",
                required_count=base_ai,
                rationale="Design model prompts, fine-tuning, embeddings pipeline, vector indexing, and AI output validation."
            ))
        roles.append(RoleRequirement(
            role="UI/UX Designer",
            required_count=base_uiux,
            rationale="Create high-fidelity wireframes, design system, interactive prototypes, and usability testing."
        ))
        if base_qa > 0:
            roles.append(RoleRequirement(
                role="QA / Test Engineer",
                required_count=base_qa,
                rationale="Conduct end-to-end integration tests, load testing, security regression, and acceptance validation."
            ))
        if base_devops > 0:
            roles.append(RoleRequirement(
                role="DevOps / Cloud Engineer",
                required_count=base_devops,
                rationale="Establish CI/CD pipelines, container orchestration, cloud security, and production monitoring."
            ))

        total_recommended = sum(r.required_count for r in roles)
        gap = available_employees - total_recommended

        if gap == 0:
            emp_status = "Sufficient"
            emp_summary = f"Headcount is balanced: {available_employees} available staff perfectly match the recommended {total_recommended} specialized roles."
        elif gap > 0:
            emp_status = "Resource Overload" if gap >= 4 else "Sufficient"
            emp_summary = f"Adequate staffing capacity: {available_employees} available employees provide a surplus of {gap} resource(s) over the {total_recommended} recommended roles, providing buffer for parallel workstreams."
        else:
            emp_status = "Employee Shortage"
            emp_summary = f"Resource deficit identified: Project requires {total_recommended} specialized roles, but only {available_employees} employee(s) are available ({abs(gap)} headcount shortage). Team members will need to multi-task or timeline should be adjusted."

        # 6. Phased Timeline Breakdown
        # Distribute expected_days across standard software lifecycle phases
        # Planning: 10%, UI/UX: 15%, Backend: 30%, Frontend: 30%, AI/ML: 25% (parallel), Integration: 15%, QA: 15%, Deploy: 10%, Buffer: 10%
        d = expected_days

        p1_end = max(2, int(d * 0.12))
        p2_start = max(2, int(d * 0.08))
        p2_end = max(p2_start + 2, int(d * 0.25))

        p3_start = max(p1_end, int(d * 0.15))
        p3_end = max(p3_start + 4, int(d * 0.60))

        p4_start = max(p2_end - 2, int(d * 0.25))
        p4_end = max(p4_start + 4, int(d * 0.68))

        p5_start = max(p3_start + 2, int(d * 0.28)) if is_ai else 0
        p5_end = max(p5_start + 4, int(d * 0.62)) if is_ai else 0

        p6_start = max(p3_end - 4, p4_end - 4, int(d * 0.62))
        p6_end = max(p6_start + 3, int(d * 0.78))

        p7_start = max(p6_start + 2, int(d * 0.72))
        p7_end = max(p7_start + 3, int(d * 0.88))

        p8_start = max(p7_end - 2, int(d * 0.86))
        p8_end = max(p8_start + 2, int(d * 0.94))

        p9_start = max(p8_end, int(d * 0.92))
        p9_end = d

        phases: List[PhaseTimeline] = [
            PhaseTimeline(
                phase_name="Planning & Architecture",
                start_day=1,
                end_day=p1_end,
                duration_days=p1_end,
                description="Finalize technical specifications, ERD schema, API contract definitions, and team sprint setup.",
                key_deliverables=["Architecture Design Doc", "Database Schema Spec", "Sprint Roadmap"],
                dependencies=[]
            ),
            PhaseTimeline(
                phase_name="UI/UX Prototyping",
                start_day=p2_start,
                end_day=p2_end,
                duration_days=p2_end - p2_start + 1,
                description="Design wireframes, user flow journey maps, design tokens, and interactive clickable mockups.",
                key_deliverables=["Figma Component Library", "Interactive High-Fi Prototype", "Design Tokens"],
                dependencies=["Planning & Architecture"]
            ),
            PhaseTimeline(
                phase_name="Backend Core & APIs",
                start_day=p3_start,
                end_day=p3_end,
                duration_days=p3_end - p3_start + 1,
                description="Implement database schemas, authentication middleware, business logic, and REST/GraphQL endpoints.",
                key_deliverables=["Secure Auth API", "Core Data Models", "Endpoint Integration Tests"],
                dependencies=["Planning & Architecture"]
            ),
            PhaseTimeline(
                phase_name="Frontend UI Development",
                start_day=p4_start,
                end_day=p4_end,
                duration_days=p4_end - p4_start + 1,
                description="Build interactive UI views, responsive component tree, client-side caching, and API connectors.",
                key_deliverables=["Web Dashboard Views", "Forms & Validation", "State Management Integration"],
                dependencies=["UI/UX Prototyping"]
            )
        ]

        if is_ai:
            phases.append(PhaseTimeline(
                phase_name="AI/ML Pipeline & Intelligence",
                start_day=p5_start,
                end_day=p5_end,
                duration_days=p5_end - p5_start + 1,
                description="Develop prompt engineering, embedding generators, model inference endpoints, and guardrail validations.",
                key_deliverables=["Inference Pipeline", "Vector Similarity Search", "AI Guardrail Validator"],
                dependencies=["Backend Core & APIs"]
            ))

        phases.extend([
            PhaseTimeline(
                phase_name="System Integration",
                start_day=p6_start,
                end_day=p6_end,
                duration_days=p6_end - p6_start + 1,
                description="Connect frontend clients to backend microservices, third-party APIs, and verify end-to-end data flows.",
                key_deliverables=["Integrated Web App", "Third-party Webhook Handlers", "E2E Smoke Tests"],
                dependencies=["Backend Core & APIs", "Frontend UI Development"]
            ),
            PhaseTimeline(
                phase_name="Testing, QA & Security Audit",
                start_day=p7_start,
                end_day=p7_end,
                duration_days=p7_end - p7_start + 1,
                description="Execute automated regression suites, stress/load testing, security vulnerability scans, and bug resolution.",
                key_deliverables=["QA Test Sign-off Report", "Security Scan Clearance", "Performance Benchmark"],
                dependencies=["System Integration"]
            ),
            PhaseTimeline(
                phase_name="Deployment & Cloud Infrastructure",
                start_day=p8_start,
                end_day=p8_end,
                duration_days=p8_end - p8_start + 1,
                description="Provision production cloud instances, configure SSL/CDN, setup monitoring dashboards, and run staging rehearsals.",
                key_deliverables=["Production Live URL", "Cloud Monitoring Dashboard", "Automated Rollback Scripts"],
                dependencies=["Testing, QA & Security Audit"]
            ),
            PhaseTimeline(
                phase_name="Buffer & Launch Contingency",
                start_day=p9_start,
                end_day=p9_end,
                duration_days=p9_end - p9_start + 1,
                description="Dedicated stabilization window for final user feedback, unexpected regressions, and launch verification.",
                key_deliverables=["Operational Playbook", "Post-Launch Monitoring", "Project Handover Sign-off"],
                dependencies=["Deployment & Cloud Infrastructure"]
            )
        ])

        buffer_days = p9_end - p9_start + 1
        timeline = TimelineBreakdown(
            phases=phases,
            total_calculated_days=expected_days,
            expected_days=expected_days,
            variance_days=0,
            buffer_days=buffer_days
        )

        # 7. Tools and Technologies
        techs: List[TechRecommendation] = [
            TechRecommendation(
                layer="Frontend",
                technology="Next.js 15 (React 19, TypeScript, Tailwind CSS)",
                rationale="Delivers server-side rendering, instant page transitions, strict type safety, and rapid component development."
            ),
            TechRecommendation(
                layer="Backend",
                technology="FastAPI (Python 3.12+)",
                rationale="Provides high throughput asynchronous request handling, automatic OpenAPI docs, and native Python ecosystem compatibility."
            ),
            TechRecommendation(
                layer="Database",
                technology="PostgreSQL 16 + Redis Caching" + (" + pgvector" if is_ai else ""),
                rationale="Guarantees ACID relational consistency, vector similarity indexing for search, and sub-millisecond memory caching."
            )
        ]

        if is_ai:
            techs.append(TechRecommendation(
                layer="AI/ML",
                technology="Gemini 2.5 / OpenAI GPT-4o + LangChain / PyTorch",
                rationale="State-of-the-art multimodal reasoning, high token throughput, structured JSON schema outputs, and proven enterprise reliability."
            ))
        else:
            techs.append(TechRecommendation(
                layer="AI/ML",
                technology="Scikit-Learn / Rule Engine / Pandas",
                rationale="Lightweight deterministic heuristic processing and data transformation without heavy GPU compute costs."
            ))

        techs.extend([
            TechRecommendation(
                layer="APIs",
                technology="RESTful API + WebSockets / HTTP/2",
                rationale="Standardized communication layer with real-time push capabilities and comprehensive client SDK generation."
            ),
            TechRecommendation(
                layer="Cloud/Deployment",
                technology="AWS ECS / GCP Cloud Run + Cloudflare CDN",
                rationale="Serverless container execution with automatic scaling, global edge caching, and DDoS mitigation."
            ),
            TechRecommendation(
                layer="DevOps",
                technology="Docker + GitHub Actions CI/CD + Terraform",
                rationale="Immutable containerized environments, automated unit/integration test gates, and reproducible Infrastructure-as-Code."
            ),
            TechRecommendation(
                layer="Version Control",
                technology="Git + GitHub Enterprise with Branch Protection",
                rationale="Enforces mandatory peer code reviews, status checks, and traceability for compliance audits."
            )
        ])

        # 8. Risk Analysis
        risks: List[RiskItem] = []

        # Risk: Manpower / Headcount
        if gap < 0:
            severity = "Critical" if gap <= -3 else "High"
            risks.append(RiskItem(
                risk="Specialized Staffing Shortage",
                probability="High",
                impact="High",
                severity=severity,
                reason=f"Current team of {available_employees} is {abs(gap)} person(s) below the recommended {total_recommended} specialists, leading to multi-role burnout.",
                mitigation="Onboard additional contract specialists or narrow scope to eliminate optional features."
            ))
        elif gap > 3:
            risks.append(RiskItem(
                risk="Communication Overhead (Resource Overload)",
                probability="Medium",
                impact="Medium",
                severity="Medium",
                reason=f"Large team of {available_employees} for a {expected_days}-day timeline may incur Brook's Law coordination delays.",
                mitigation="Divide team into clear decoupled microservice / modular sub-teams with strict interface boundaries."
            ))

        # Risk: Timeline
        est_needed_days = int((len(must_have) * 7.5 + len(optional) * 3.5) / max(1, available_employees * 0.6))
        if expected_days < 20 and len(must_have) > 4:
            risks.append(RiskItem(
                risk="Aggressive Deadline vs Scope",
                probability="High",
                impact="High",
                severity="Critical",
                reason=f"Target of {expected_days} days is tight for {len(must_have)} must-have features, leaving limited room for regression debugging.",
                mitigation="Extend target completion time by 10-15 days or defer secondary deliverables to v2."
            ))
        elif expected_days < 35:
            risks.append(RiskItem(
                risk="Tight Integration & Testing Window",
                probability="Medium",
                impact="Medium",
                severity="Medium",
                reason="Shorter timeline compresses QA regression cycles before production go-live.",
                mitigation="Shift QA left by implementing automated unit and integration tests starting in week 1."
            ))

        # Risk: Technical Complexity
        if is_ai:
            risks.append(RiskItem(
                risk="AI Model Hallucination & Latency",
                probability="Medium",
                impact="High",
                severity="High",
                reason="Non-deterministic LLM responses and upstream API rate limits can impact user trust and SLA response times.",
                mitigation="Implement structured JSON schema validation, aggressive response caching, and automated fallback answers."
            ))

        if is_realtime_or_iot or is_ecommerce_or_payments:
            risks.append(RiskItem(
                risk="Third-Party Payment / API Dependency Downtime",
                probability="Medium",
                impact="High",
                severity="High",
                reason="External webhook delays and third-party API changes can block critical transaction processing.",
                mitigation="Use asynchronous retry queues, webhook idempotency keys, and mock sandboxes during staging."
            ))

        # General Security & Scope risk
        risks.append(RiskItem(
            risk="Scope Creep & Changing Requirements",
            probability="Medium",
            impact="Medium",
            severity="Medium",
            reason="Unmanaged feature additions during active development sprints can erode buffer days.",
            mitigation="Lock MVP baseline specification with formal change request controls after Phase 1."
        ))

        # 9. Feasibility Calculation Engine
        # Calculate dimension scores
        # 1. Scope Score (0-100)
        feature_count = len(must_have) + len(optional)
        scope_score = max(35, min(95, 100 - (len(must_have) * 5)))

        # 2. Timeline Score (0-100)
        timeline_ratio = expected_days / max(15, len(must_have) * 5)
        timeline_score = max(25, min(95, int(timeline_ratio * 75)))

        # 3. Manpower Score (0-100)
        manpower_ratio = available_employees / max(1, total_recommended)
        if manpower_ratio >= 1.0:
            manpower_score = min(95, 80 + int((manpower_ratio - 1.0) * 15))
        else:
            manpower_score = max(20, int(manpower_ratio * 80))

        # 4. Technical Risk Score (0-100, higher = lower risk / healthier)
        critical_risks = [r for r in risks if r.severity == "Critical"]
        high_risks = [r for r in risks if r.severity == "High"]
        risk_penalty = (len(critical_risks) * 25) + (len(high_risks) * 12)
        technical_risk_score = max(20, min(95, 95 - risk_penalty))

        # 5. Complexity Score (0-100)
        complexity_deduction = (15 if is_ai else 0) + (10 if is_ecommerce_or_payments else 0) + (10 if is_realtime_or_iot else 0)
        complexity_score = max(30, min(95, 90 - complexity_deduction))

        # Weighted Overall Feasibility Score
        overall_score = int(
            (scope_score * 0.20) +
            (timeline_score * 0.25) +
            (manpower_score * 0.25) +
            (technical_risk_score * 0.20) +
            (complexity_score * 0.10)
        )
        overall_score = max(10, min(98, overall_score))

        # Verdict assignment
        if overall_score >= 75 and len(critical_risks) == 0 and gap >= -1:
            status = "FEASIBLE"
            key_verdict = f"🟢 FEASIBLE: The project scope ({len(must_have)} must-have features) is well aligned with the {expected_days}-day timeline and {available_employees} available staff. Proceed with Phase 1 execution."
        elif overall_score >= 50 or (gap >= -3 and expected_days >= 20):
            status = "FEASIBLE WITH CHANGES"
            key_verdict = f"🟡 FEASIBLE WITH CHANGES: Realistic execution is viable, but requires adjusting staffing by {abs(gap)} resource(s) or pruning {len(optional)} optional feature(s) to guarantee on-time delivery."
        else:
            status = "NOT FEASIBLE"
            key_verdict = f"🔴 NOT FEASIBLE: The current combination of {expected_days} days and {available_employees} employee(s) presents significant delivery risk for the requested {len(must_have)} must-have technical requirements. Scope or timeline adjustments are mandatory."

        feasibility = FeasibilityAnalysis(
            status=status,
            feasibility_score=overall_score,
            dimensions=FeasibilityDimension(
                scope_score=scope_score,
                timeline_score=timeline_score,
                manpower_score=manpower_score,
                technical_risk_score=technical_risk_score,
                complexity_score=complexity_score
            ),
            key_verdict=key_verdict
        )

        # 10. AI Recommendation
        actionable_steps: List[str] = []
        if status == "FEASIBLE":
            primary_advice = "The project baseline is sound. Maintain strict sprint cadence and protect buffer days."
            actionable_steps.append("Kick off Phase 1 (Planning & Architecture) immediately with design token alignment.")
            actionable_steps.append("Establish automated CI/CD and linting on day 1 to prevent technical debt build-up.")
            actionable_steps.append("Conduct weekly milestone reviews against the 8-day contingency buffer.")
        elif status == "FEASIBLE WITH CHANGES":
            primary_advice = f"Project is achievable with targeted adjustments to resource allocation and feature prioritization."
            if gap < 0:
                actionable_steps.append(f"Recruit or reallocate {abs(gap)} additional developer(s) specifically for backend/frontend execution.")
            if expected_days < 35:
                actionable_steps.append(f"Consider extending target timeline by 7-14 days to provide adequate QA buffer.")
            actionable_steps.append(f"Defer optional features ({', '.join([o.name for o in optional[:2]])}) to Post-MVP Release v1.1.")
            actionable_steps.append("Implement automated test coverage early to protect developer throughput.")
        else:
            primary_advice = f"Substantial project reconfiguration is required before committing engineering resources."
            actionable_steps.append(f"Request a budget/headcount increase of at least {abs(gap) + 1} specialist(s).")
            actionable_steps.append(f"Extend target timeline from {expected_days} days to at least {expected_days + 20} days.")
            actionable_steps.append("Descope the project to absolute core MVP features only.")
            actionable_steps.append("Split architecture into 2 distinct release phases to minimize simultaneous dependencies.")

        opt_drop = [o.name for o in optional]
        crit_skills = ["Senior Backend Developer", "Fullstack UI Developer"]
        if is_ai:
            crit_skills.append("AI/ML Prompt & Pipeline Specialist")
        if is_enterprise_or_security:
            crit_skills.append("DevOps & Cloud Security Specialist")

        ai_rec = AIRecommendation(
            primary_advice=primary_advice,
            actionable_steps=actionable_steps,
            suggested_adjustments=SuggestedAdjustments(
                recommended_additional_employees=max(0, abs(gap)) if gap < 0 else 0,
                recommended_timeline_extension_days=15 if status == "NOT FEASIBLE" else (7 if status == "FEASIBLE WITH CHANGES" and gap < 0 else 0),
                optional_features_to_drop=opt_drop,
                critical_skills_needed=crit_skills
            )
        )

        # 11. Final Summary
        summary = ProjectSummary(
            what_it_is=f"{name} is an enterprise-grade platform designed to deliver {description.strip().rstrip('.')}.",
            problem_solved=f"Eliminates operational bottlenecks, fragmented workflows, and resource inefficiencies by providing automated, centralized digital capabilities.",
            what_needs_to_be_built=f"A resilient modern stack encompassing {len(must_have)} core features, secure backend microservices, {len(techs)} integrated technology layers, and a phased {expected_days}-day delivery schedule."
        )

        return AIAnalysisResult(
            summary=summary,
            features=ProjectFeatures(must_have=must_have, optional=optional),
            must_need_requirements=must_need,
            employee_analysis=EmployeeAnalysis(
                roles=roles,
                total_recommended=total_recommended,
                total_available=available_employees,
                status=emp_status,
                gap_delta=gap,
                analysis_summary=emp_summary
            ),
            timeline_breakdown=timeline,
            tools_and_technologies=techs,
            risk_analysis=risks,
            feasibility=feasibility,
            ai_recommendation=ai_rec,
            engine="Algorithmic Fallback Engine"
        )

    def simulate_adjustments(
        self,
        base_analysis: AIAnalysisResult,
        new_days: int,
        new_employees: int
    ) -> Dict[str, Any]:
        """
        Recalculates employee status, timeline, and feasibility scores when the manager
        moves the interactive simulation sliders on the frontend.
        """
        total_recommended = base_analysis.employee_analysis.total_recommended
        gap = new_employees - total_recommended

        if gap == 0:
            emp_status = "Sufficient"
            emp_summary = f"Headcount is balanced: {new_employees} available staff match {total_recommended} recommended roles."
        elif gap > 0:
            emp_status = "Resource Overload" if gap >= 4 else "Sufficient"
            emp_summary = f"Staffing surplus: {new_employees} employees provides a {gap} headcount buffer."
        else:
            emp_status = "Employee Shortage"
            emp_summary = f"Staffing deficit: {new_employees} employees is {abs(gap)} short of the {total_recommended} recommended roles."

        # Scale timeline phases proportionally to new_days
        old_days = max(1, base_analysis.timeline_breakdown.expected_days)
        scale = new_days / old_days

        new_phases: List[PhaseTimeline] = []
        for p in base_analysis.timeline_breakdown.phases:
            new_s = max(1, int(p.start_day * scale))
            new_e = min(new_days, max(new_s + 1, int(p.end_day * scale)))
            new_phases.append(PhaseTimeline(
                phase_name=p.phase_name,
                start_day=new_s,
                end_day=new_e,
                duration_days=new_e - new_s + 1,
                description=p.description,
                key_deliverables=p.key_deliverables,
                dependencies=p.dependencies
            ))

        # Adjust scores
        must_have_count = len(base_analysis.features.must_have)
        scope_score = base_analysis.feasibility.dimensions.scope_score
        
        timeline_ratio = new_days / max(15, must_have_count * 5)
        timeline_score = max(25, min(95, int(timeline_ratio * 75)))

        manpower_ratio = new_employees / max(1, total_recommended)
        if manpower_ratio >= 1.0:
            manpower_score = min(95, 80 + int((manpower_ratio - 1.0) * 15))
        else:
            manpower_score = max(20, int(manpower_ratio * 80))

        technical_risk_score = base_analysis.feasibility.dimensions.technical_risk_score
        complexity_score = base_analysis.feasibility.dimensions.complexity_score

        overall_score = int(
            (scope_score * 0.20) +
            (timeline_score * 0.25) +
            (manpower_score * 0.25) +
            (technical_risk_score * 0.20) +
            (complexity_score * 0.10)
        )
        overall_score = max(10, min(98, overall_score))

        if overall_score >= 75 and gap >= -1:
            status = "FEASIBLE"
            verdict = f"🟢 FEASIBLE: With {new_employees} employees and {new_days} days, the project is realistic and ready for kickoff."
        elif overall_score >= 50 or gap >= -3:
            status = "FEASIBLE WITH CHANGES"
            verdict = f"🟡 FEASIBLE WITH CHANGES: Moderate feasibility. Minor adjustments to team allocation or scope will ensure smooth execution."
        else:
            status = "NOT FEASIBLE"
            verdict = f"🔴 NOT FEASIBLE: {new_days} days with {new_employees} employees remains too high risk for this scope."

        new_feasibility = FeasibilityAnalysis(
            status=status,
            feasibility_score=overall_score,
            dimensions=FeasibilityDimension(
                scope_score=scope_score,
                timeline_score=timeline_score,
                manpower_score=manpower_score,
                technical_risk_score=technical_risk_score,
                complexity_score=complexity_score
            ),
            key_verdict=verdict
        )

        new_emp_analysis = EmployeeAnalysis(
            roles=base_analysis.employee_analysis.roles,
            total_recommended=total_recommended,
            total_available=new_employees,
            status=emp_status,
            gap_delta=gap,
            analysis_summary=emp_summary
        )

        new_timeline = TimelineBreakdown(
            phases=new_phases,
            total_calculated_days=new_days,
            expected_days=new_days,
            variance_days=0,
            buffer_days=max(2, int(new_days * 0.10))
        )

        return {
            "expected_days": new_days,
            "available_employees": new_employees,
            "employee_analysis": new_emp_analysis,
            "feasibility": new_feasibility,
            "timeline_breakdown": new_timeline,
            "ai_recommendation": base_analysis.ai_recommendation
        }

    def allocate_tasks_to_employees(
        self,
        project_id: str,
        project_name: str,
        project_description: str,
        phases: List[Any],
        employees: List[Dict[str, Any]]
    ) -> List[TaskItem]:
        """
        AI Intelligent Work Allocator:
        Evaluates all 40 employees from EMPLOYEE_ID.xlsx against each phase deliverable based on:
        1. Skill Match & Role Alignment (40%)
        2. Workload & Headroom Bandwidth (30%)
        3. Experience & Previous Project Relevance (20%)
        4. Real-time Availability Status (10%)
        """
        allocated_tasks: List[TaskItem] = []
        # Track virtual workload dynamically so tasks are distributed across the best team members
        dynamic_workloads = {e["id"]: e.get("workload", 50) for e in employees}

        # Role to keywords mapping
        phase_role_keywords = {
            "planning": ["requirements", "architecture", "agile", "scrum", "project management", "documentation", "uml"],
            "design": ["ui", "ux", "figma", "prototyping", "wireframing", "adobe", "user research"],
            "ui/ux": ["ui", "ux", "figma", "prototyping", "wireframing", "adobe", "user research"],
            "frontend": ["react", "next.js", "typescript", "javascript", "html", "css", "tailwind", "redux"],
            "backend": ["python", "fastapi", "rest api", "postgresql", "sql", "api", "database", "redis", "mongodb", "node.js", "express"],
            "ai": ["python", "pytorch", "tensorflow", "machine learning", "llm", "nlp", "hugging face", "gemini", "data"],
            "ml": ["python", "pytorch", "tensorflow", "machine learning", "llm", "nlp", "hugging face", "gemini", "data"],
            "qa": ["testing", "test", "selenium", "jest", "cypress", "automation", "api testing", "postman", "qa"],
            "testing": ["testing", "test", "selenium", "jest", "cypress", "automation", "api testing", "postman", "qa"],
            "devops": ["docker", "kubernetes", "aws", "ci/cd", "terraform", "github actions", "linux", "cloud"],
            "deployment": ["docker", "kubernetes", "aws", "ci/cd", "terraform", "github actions", "linux", "cloud"],
            "security": ["cybersecurity", "auth", "oauth", "jwt", "encryption", "firewall", "compliance"]
        }

        task_counter = 1
        for p in phases:
            p_name = getattr(p, "phase_name", "") if hasattr(p, "phase_name") else p.get("phase_name", "")
            p_end_day = getattr(p, "end_day", 10) if hasattr(p, "end_day") else p.get("end_day", 10)
            deliverables = getattr(p, "key_deliverables", []) if hasattr(p, "key_deliverables") else p.get("key_deliverables", [])
            
            p_name_lower = p_name.lower()

            for deliv in deliverables:
                deliv_lower = deliv.lower()
                
                # Determine target keywords for this deliverable
                target_keywords = set()
                for key, kws in phase_role_keywords.items():
                    if key in p_name_lower or key in deliv_lower:
                        target_keywords.update(kws)
                if not target_keywords:
                    target_keywords.update(["python", "javascript", "react", "api", "testing", "development"])

                # Score all 40 employees
                candidate_scores = []
                for emp in employees:
                    emp_id = emp["id"]
                    emp_name = emp["name"]
                    emp_desig = emp.get("designation", "").lower()
                    emp_skills = [s.lower() for s in emp.get("skills", [])]
                    emp_workload = dynamic_workloads.get(emp_id, emp.get("workload", 50))
                    emp_exp = emp.get("experience_years", 3.0)
                    emp_avail = emp.get("availability_status", "Available")
                    emp_prev = [proj.lower() for proj in emp.get("prev_projects", [])]

                    # 1. Skill Match Score (0 - 40 pts)
                    skill_score = 0
                    # Designation alignment (up to 20 pts)
                    if any(k in emp_desig for k in ["frontend", "ui/ux", "designer"]) and any(k in p_name_lower for k in ["frontend", "ui", "design"]):
                        skill_score += 20
                    elif any(k in emp_desig for k in ["backend", "database", "full stack"]) and any(k in p_name_lower for k in ["backend", "database", "api"]):
                        skill_score += 20
                    elif any(k in emp_desig for k in ["ai", "machine learning", "data"]) and any(k in p_name_lower for k in ["ai", "ml", "data", "model"]):
                        skill_score += 20
                    elif any(k in emp_desig for k in ["devops", "cloud", "reliability", "infrastructure"]) and any(k in p_name_lower for k in ["devops", "cloud", "deployment", "infrastructure"]):
                        skill_score += 20
                    elif any(k in emp_desig for k in ["qa", "testing"]) and any(k in p_name_lower for k in ["qa", "testing", "test"]):
                        skill_score += 20
                    elif any(k in emp_desig for k in ["project manager", "architect", "analyst", "product"]) and any(k in p_name_lower for k in ["planning", "architecture", "scope"]):
                        skill_score += 20
                    elif "full stack" in emp_desig:
                        skill_score += 15
                    else:
                        skill_score += 5

                    # Specific skill keyword matches (up to 20 pts)
                    matched_skills = [s for s in emp_skills if any(kw in s or s in kw for kw in target_keywords)]
                    skill_score += min(20, len(matched_skills) * 7)

                    # 2. Workload & Headroom Bandwidth Score (0 - 30 pts)
                    headroom = max(0, 100 - emp_workload)
                    workload_score = (headroom / 100.0) * 30.0
                    if emp_workload > 90:
                        workload_score -= 10

                    # 3. Experience & Previous Project Relevance (0 - 20 pts)
                    exp_score = min(10.0, float(emp_exp) * 1.5)
                    proj_match_score = 0
                    matched_prev_proj = None
                    proj_words = (project_name + " " + project_description + " " + deliv).lower().split()
                    for p_proj in emp_prev:
                        for pw in proj_words:
                            if len(pw) > 3 and pw in p_proj:
                                proj_match_score = 10.0
                                matched_prev_proj = p_proj
                                break
                        if proj_match_score > 0:
                            break
                    exp_proj_score = min(20.0, exp_score + proj_match_score)

                    # 4. Availability Status Score (0 - 10 pts)
                    if emp_avail == "Available":
                        avail_score = 10.0
                    elif emp_avail == "Partial":
                        avail_score = 6.0
                    else:
                        avail_score = 1.0

                    total_score = min(99, max(52, int(skill_score + workload_score + exp_proj_score + avail_score)))

                    candidate_scores.append({
                        "emp": emp,
                        "score": total_score,
                        "matched_skills": matched_skills,
                        "matched_proj": matched_prev_proj,
                        "headroom": headroom,
                        "workload": emp_workload
                    })

                # Sort by score descending
                candidate_scores.sort(key=lambda x: x["score"], reverse=True)
                best = candidate_scores[0]
                best_emp = best["emp"]
                best_score = best["score"]

                # Build rich, explanatory AI rationale
                skill_highlight = ", ".join(best["matched_skills"][:2]) if best["matched_skills"] else best_emp["skills"][0]
                proj_clause = f", past project '{best['matched_proj'].title()}'" if best["matched_proj"] else f", {best_emp['experience']} experience"
                rationale = (
                    f"Match Score {best_score}%: Direct competence in {skill_highlight}, "
                    f"{best['headroom']}% bandwidth headroom ({best['workload']}% current workload)"
                    f"{proj_clause}, status: {best_emp.get('availability_status', 'Available')}."
                )

                # Increment dynamic workload to avoid overloading one employee
                dynamic_workloads[best_emp["id"]] = min(100, dynamic_workloads.get(best_emp["id"], 50) + 12)

                task_item = TaskItem(
                    id=f"task_{project_id[:6]}_{task_counter:02d}",
                    project_id=project_id,
                    project_name=project_name,
                    phase_name=p_name,
                    title=deliv,
                    description=f"Sprint Deliverable for {p_name}: {deliv}",
                    assigned_role=best_emp["designation"],
                    assigned_to=best_emp["name"],
                    assigned_emp_id=best_emp["id"],
                    match_score=best_score,
                    ai_rationale=rationale,
                    status="To Do",
                    priority="High" if any(k in p_name_lower for k in ["planning", "architecture", "security", "core"]) else "Medium",
                    due_day=p_end_day
                )
                allocated_tasks.append(task_item)
                task_counter += 1

        return allocated_tasks

analyzer_instance = AIProjectAnalyzer()

