"""
n8n Workflow Integration Service
Handles automated triggering of n8n 'Project Assignment Reminder Emails' workflows
whenever a meeting is scheduled in the calendar or a sprint assignment is confirmed.
"""

import os
import json
import threading
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional
from datetime import datetime

from db.employees_data import get_employee_by_email_or_name
from models.schemas import MeetingItem, Project


# Target recipient emails requested by user
TARGET_MEETING_EMAILS = [
    "palamooradithyagoud@gmail.com",
    "shivanallela363@gmail.com"
]

class N8nWorkflowService:
    def __init__(self):
        # Default webhook matches the ID from user's n8n workflow definition
        self.default_webhook_id = "30fd146d-5f97-4acf-993f-b2b7ded422b1"
        self.webhook_url = os.getenv(
            "N8N_WEBHOOK_URL",
            f"http://localhost:5678/webhook/{self.default_webhook_id}"
        )
        self.target_emails = TARGET_MEETING_EMAILS

    def get_status(self) -> Dict[str, Any]:
        """Returns the current n8n webhook configuration status."""
        return {
            "workflow_name": "Project Assignment Reminder Emails",
            "webhook_url": self.webhook_url,
            "webhook_id": self.default_webhook_id,
            "target_recipients": self.target_emails,
            "is_configured": bool(self.webhook_url),
            "target_nodes": [
                "Project Assignment Form (Webhook Trigger)",
                "Get Employee By Designation (Directory Lookup)",
                "Write Assignment Email (AI LangChain Agent)",
                "Send Assignment Email (Gmail OAuth2)"
            ]
        }

    def generate_email_preview(
        self,
        employee_name: str,
        designation: str,
        project_name: str,
        project_description: str,
        assigned_task: str,
        deadline: str,
        priority: str = "High",
        instructions: str = ""
    ) -> Dict[str, str]:
        """
        Generates the email subject & HTML body strictly matching the n8n AI Agent's prompt guidelines.
        """
        subject = f"Project Assignment Reminder – {project_name}"
        
        instructions_section = ""
        if instructions and instructions.strip():
            instructions_section = f"<br/><br/><b>Project-Specific Instructions:</b><br/>{instructions.strip()}"

        body_html = f"""<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px;">
  <p>Dear {employee_name},</p>
  
  <p>You have been assigned a responsibility for the following project based on your role as <b>{designation}</b>.</p>
  
  <p><b>Project Name:</b> {project_name}</p>
  
  <p><b>Project Information:</b><br/>{project_description}</p>
  
  <p><b>Your Assigned Responsibility:</b><br/>{assigned_task}</p>
  
  <p><b>Project Deadline:</b> {deadline}</p>
  
  <p><b>Priority:</b> <span style="color: #e11d48; font-weight: bold;">{priority}</span></p>
  {instructions_section}
  
  <p>Please review the project requirements and complete your assigned responsibility within the specified deadline. If you encounter any blockers, dependencies, or require clarification regarding the assigned work, please communicate with the Project Lead as early as possible.</p>
  
  <p style="margin-top: 24px;">
    Regards,<br/>
    <strong style="color: #4f46e5;">PROJECT LEAD</strong><br/>
    <span style="color: #64748b; font-size: 13px;">Project Management Team</span>
  </p>
</div>"""

        return {
            "subject": subject,
            "body_html": body_html
        }

    def _send_webhook_request(self, payload: Dict[str, Any]) -> bool:
        """Sends an HTTP POST payload to the n8n webhook URL with low timeout."""
        if not self.webhook_url:
            return False
        try:
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                self.webhook_url,
                data=req_data,
                headers={"Content-Type": "application/json", "User-Agent": "KuiperAI-n8n-Client/1.0"}
            )
            with urllib.request.urlopen(req, timeout=2.5) as resp:
                return resp.status in (200, 201, 204)
        except Exception as e:
            # Expected if local n8n instance is not currently running
            print(f"[n8n Service] Webhook delivery note ({self.webhook_url}): {e}")
            return False

    def trigger_for_meeting(
        self,
        meeting: MeetingItem,
        project: Optional[Project] = None
    ) -> Dict[str, Any]:
        """
        Dispatches assignment & reminder email payloads to n8n specifically to:
        - palamooradithyagoud@gmail.com
        - shivanallela363@gmail.com
        Runs the network request asynchronously in a background thread to maintain instant UI response.
        """
        proj_name = meeting.project_name or (project.name if project else "General Sprint & Portfolio Sync")
        proj_desc = (project.description if project else None) or meeting.agenda or f"Sprint Planning & Architecture Sync for {meeting.title}"
        
        attendee_summary = ", ".join(meeting.attendees) if meeting.attendees else "Sprint Team"
        task_desc = f"{meeting.title} (Sync Time: {meeting.start_time} - {meeting.end_time})"
        instructions = f"Scheduled {meeting.type} session on {meeting.date} ({meeting.start_time} - {meeting.end_time}). Attendees: {attendee_summary}. Agenda: {meeting.agenda or 'Review active sprint deliverables and system blockers.'}"

        dispatched_items = []

        # Send specifically to the designated recipient emails
        for target_email in self.target_emails:
            # Use attendee context or recipient name
            recipient_label = "Adithya Goud" if "adithya" in target_email else ("Shiva Nallela" if "shiva" in target_email else "Team Lead")
            recipient_designation = "Lead Engineer / Project Lead"

            n8n_payload = {
                "project_name": proj_name,
                "project_description": proj_desc,
                "designation": recipient_designation,
                "assigned_task": task_desc,
                "deadline": meeting.date,
                "priority": "High",
                "instructions": instructions,
                # Metadata for n8n Gmail node
                "employee_name": recipient_label,
                "employee_email": target_email,
                "sendTo": target_email,
                "attendees": meeting.attendees,
                "meeting_id": meeting.id,
                "meeting_title": meeting.title,
                "meeting_date": meeting.date,
                "meeting_time": f"{meeting.start_time} - {meeting.end_time}"
            }

            email_preview = self.generate_email_preview(
                employee_name=recipient_label,
                designation=recipient_designation,
                project_name=proj_name,
                project_description=proj_desc,
                assigned_task=task_desc,
                deadline=meeting.date,
                priority="High",
                instructions=instructions
            )

            dispatched_items.append({
                "recipient": recipient_label,
                "email": target_email,
                "designation": recipient_designation,
                "payload": n8n_payload,
                "email_preview": email_preview
            })

            # Fire webhook in background thread
            t = threading.Thread(
                target=self._send_webhook_request,
                args=(n8n_payload,),
                daemon=True
            )
            t.start()

        # Log automated activity in storage if available
        try:
            from db.storage import storage
            storage.create_activity(
                event_type="project_accepted",
                project_id=meeting.project_id or "general",
                project_name=proj_name,
                employee_id="emp_18",
                employee_name="Ishita Rao",
                employee_role="Project Lead",
                message=f"⚡ n8n Workflow Dispatched: Assignment reminder emails queued for {len(dispatched_items)} attendee(s) on '{meeting.title}'"
            )
        except Exception as e:
            print(f"[n8n Service] Activity log note: {e}")

        return {
            "status": "success",
            "webhook_url": self.webhook_url,
            "meeting_id": meeting.id,
            "meeting_title": meeting.title,
            "dispatched_count": len(dispatched_items),
            "dispatches": dispatched_items
        }


# Singleton instance
n8n_service = N8nWorkflowService()
