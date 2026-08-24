# PlanPulse.AI — Enterprise AI Decision Intelligence & Project Feasibility Platform

PlanPulse.AI is an end-to-end AI-powered decision intelligence and project planning system. It empowers Engineering Managers, Technical Project Leads, and Developers to evaluate project feasibility, estimate manpower & specialist roles, formulate phased Gantt timelines, select technology stacks, manage risks, and simulate real-time resource adjustments.

---

## 🌟 Key Features

1. **Google Gemini 3.6 Flash AI Reasoning Engine**
   - Automated full-spectrum project feasibility and architecture evaluation.
   - Requirement breakdown, must-have vs. optional feature categorization.
   - Comprehensive risk analysis matrix (Probability, Impact, Severity & Mitigation).

2. **Interactive What-If Simulation Sandbox**
   - Real-time recalculation of feasibility scores, timeline buffer, and team gaps as sliders are adjusted.

3. **Multi-Role Collaborative Workspaces**
   - **Portfolio Manager**: High-level KPIs, project creation, executive decision dashboards, and PDF/HTML blueprint exports.
   - **Project Lead**: Sprint timeline tracking, Gantt charts, deliverable milestones, and team workload balance.
   - **Employee**: Task board (To Do, In Progress, Completed), personal sprint assignments, and due dates.

4. **Visual Decision Analytics**
   - 5-Dimension Radar Chart (Scope, Timeline, Manpower, Technical Risk, Complexity).
   - Phased Gantt timeline and system dependency graphs.
   - Role allocation breakdown and resource capacity gap meters.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: Next.js 15 (App Router, React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts)
- **Backend**: FastAPI (Python 3.10+, Pydantic v2, Uvicorn, Python-Dotenv)
- **AI / LLM**: Google Gemini API (`gemini-3.6-flash` via `google-genai` SDK)
- **Storage**: JSON storage layer with atomic file persistence & demo data seeding

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create/edit `backend/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_API_KEY=your_gemini_api_key_here
```

Start the FastAPI server:
```bash
python main.py
```
*API runs at `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.*

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at `http://localhost:3000`.*

---

## 👥 Demo Accounts
- **Manager**: `manager@company.ai` (Alexander Vance)
- **Project Lead**: `lead@company.ai` (Elena Rostova)
- **Employee**: `employee@company.ai` (Devon Chen)
