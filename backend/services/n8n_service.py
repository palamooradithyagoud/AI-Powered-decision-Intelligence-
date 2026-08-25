"""
n8n Production Integration Service
Handles both active production webhooks:
1. Meeting Scheduling Automation (Zoom + Email):
   https://nallelashiva.app.n8n.cloud/webhook/schedule-meeting
2. Project Assignment Notification (Gmail OAuth2 to Team):
   https://nallelashiva.app.n8n.cloud/webhook/project-assignment
"""

import os
import json
import re
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional
from datetime import datetime

from db.employees_data import get_employee_by_email_or_name
from models.schemas import MeetingItem, MeetingCreate, Project

# Production n8n Webhook URLs
PRODUCTION_MEETING_WEBHOOK_URL = "https://nallelashiva.app.n8n.cloud/webhook/schedule-meeting"
PRODUCTION_ASSIGNMENT_WEBHOOK_URL = "https://nallelashiva.app.n8n.cloud/webhook/project-assignment"

# Target recipient emails for meeting notifications
DEFAULT_MEMBER_EMAILS = [
    "palamooradithyagoud@gmail.com",
    "shivanallela363@gmail.com"
]


def convert_to_24h_format(time_str: str) -> str:
    """
    Converts various time string formats ('10:30 AM', '2:30 PM', '14:30', '9:00am')
    to strict 24-hour 'HH:MM' format required by n8n.
    """
    if not time_str:
        return "10:30"
    
    clean = time_str.strip()
    
    # Check standard 24h format HH:MM
    if re.match(r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", clean):
        parts = clean.split(":")
        return f"{int(parts[0]):02d}:{int(parts[1]):02d}"
    
    # Try parsing 12-hour format with AM/PM
    for fmt in ("%I:%M %p", "%I:%M%p", "%I %p", "%I:%M:%S %p", "%H:%M", "%H:%M:%S"):
        try:
            dt = datetime.strptime(clean.upper(), fmt)
            return dt.strftime("%H:%M")
        except ValueError:
            continue
            
    # Regex fallback extraction
    m = re.match(r"(\d{1,2}):?(\d{2})?\s*(AM|PM)?", clean, re.IGNORECASE)
    if m:
        hr = int(m.group(1))
        mn = int(m.group(2)) if m.group(2) else 0
        period = m.group(3)
        if period:
            if period.upper() == "PM" and hr < 12:
                hr += 12
            elif period.upper() == "AM" and hr == 12:
                hr = 0
        return f"{hr:02d}:{mn:02d}"
        
    return "10:30"


def build_member_emails_string(attendees: List[str]) -> str:
    """
    Converts attendee array into a comma-separated email string.
    Ensures target emails and attendee emails are cleanly formatted.
    """
    emails: List[str] = list(DEFAULT_MEMBER_EMAILS)
    
    for att in attendees:
        att_clean = att.strip()
        if not att_clean:
            continue
        if "@" in att_clean and "." in att_clean:
            if att_clean.lower() not in [e.lower() for e in emails]:
                emails.append(att_clean)
        else:
            emp = get_employee_by_email_or_name(att_clean)
            if emp and emp.get("email"):
                emp_email = emp["email"]
                if emp_email.lower() not in [e.lower() for e in emails]:
                    emails.append(emp_email)
                    
    return ", ".join(emails)


class N8nWorkflowService:
    def __init__(self):
        self.meeting_webhook_url = os.getenv("N8N_WEBHOOK_URL", PRODUCTION_MEETING_WEBHOOK_URL)
        self.assignment_webhook_url = os.getenv("N8N_ASSIGNMENT_WEBHOOK_URL", PRODUCTION_ASSIGNMENT_WEBHOOK_URL)
        self.default_emails = DEFAULT_MEMBER_EMAILS

    def get_status(self) -> Dict[str, Any]:
        """Returns the current n8n webhook configuration status for all integrations."""
        return {
            "meeting_workflow": {
                "name": "Zoom Meeting Scheduling & Email Automation",
                "webhook_url": self.meeting_webhook_url,
                "is_active": True
            },
            "assignment_workflow": {
                "name": "Project Assignment Notification",
                "webhook_url": self.assignment_webhook_url,
                "is_active": True,
                "recipients": [
                    "shivanallela363@gmail.com (UI/UX Designer)",
                    "charan1010107@gmail.com (Backend Engineer)",
                    "palamooradithyagoud@gmail.com (Frontend Engineer)"
                ]
            }
        }

    # ================= 1. MEETING SCHEDULING INTEGRATION =================
    def validate_meeting_payload(
        self,
        meeting_topic: str,
        meeting_date: str,
        start_time_24h: str,
        duration_minutes: int,
        member_emails: str
    ) -> Optional[str]:
        """Validates all fields before dispatching to n8n meeting webhook."""
        if not meeting_topic or not meeting_topic.strip():
            return "Meeting topic cannot be empty."
        
        if not meeting_date or not re.match(r"^\d{4}-\d{2}-\d{2}$", meeting_date.strip()):
            return "Meeting date must be in YYYY-MM-DD format."
            
        if not start_time_24h or not re.match(r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", start_time_24h.strip()):
            return "Start time must be a valid 24-hour time in HH:MM format."
            
        if not isinstance(duration_minutes, int) or duration_minutes <= 0:
            return "Duration must be a positive integer in minutes."
            
        if not member_emails or not member_emails.strip():
            return "At least one member email is required."
            
        return None

    def trigger_n8n_schedule_meeting(
        self,
        meeting_topic: str,
        meeting_date: str,
        start_time_str: str,
        duration_minutes: int,
        attendees: List[str]
    ) -> Dict[str, Any]:
        """Sends the JSON payload to n8n meeting webhook."""
        start_time_24h = convert_to_24h_format(start_time_str)
        member_emails = build_member_emails_string(attendees)
        
        val_error = self.validate_meeting_payload(
            meeting_topic=meeting_topic,
            meeting_date=meeting_date,
            start_time_24h=start_time_24h,
            duration_minutes=duration_minutes,
            member_emails=member_emails
        )
        if val_error:
            raise ValueError(val_error)

        payload = {
            "meeting_topic": meeting_topic.strip(),
            "meeting_date": meeting_date.strip(),
            "start_time": start_time_24h,
            "duration_minutes": int(duration_minutes),
            "member_emails": member_emails
        }

        print(f"[n8n Service] Dispatching to Meeting Webhook ({self.meeting_webhook_url}):")
        print(f"             Payload: {json.dumps(payload)}")

        try:
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                self.meeting_webhook_url,
                data=req_data,
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "KuiperAI-MeetingScheduler/1.0"
                }
            )
            with urllib.request.urlopen(req, timeout=15.0) as resp:
                resp_body = resp.read().decode("utf-8")
                status_code = resp.status
                
                zoom_link = None
                parsed_json = {}
                try:
                    parsed_json = json.loads(resp_body)
                    if isinstance(parsed_json, dict):
                        zoom_link = (
                            parsed_json.get("join_url") or
                            parsed_json.get("zoom_url") or
                            parsed_json.get("meeting_url") or
                            parsed_json.get("zoom_join_url") or
                            parsed_json.get("url")
                        )
                except Exception:
                    pass

                return {
                    "status": "success",
                    "status_code": status_code,
                    "webhook_url": self.meeting_webhook_url,
                    "payload_sent": payload,
                    "n8n_response": parsed_json or resp_body,
                    "zoom_link": zoom_link,
                    "message": "n8n meeting workflow triggered successfully."
                }
        except urllib.error.HTTPError as he:
            err_msg = f"n8n HTTP Error {he.code}: {he.reason}"
            print(f"[n8n Service] {err_msg}")
            raise RuntimeError(err_msg)
        except urllib.error.URLError as ue:
            err_msg = f"n8n Network Error: {ue.reason}"
            print(f"[n8n Service] {err_msg}")
            raise RuntimeError(err_msg)
        except Exception as e:
            err_msg = f"n8n Execution Error: {str(e)}"
            print(f"[n8n Service] {err_msg}")
            raise RuntimeError(err_msg)

    # ================= 2. PROJECT ASSIGNMENT NOTIFICATION INTEGRATION =================
    def trigger_n8n_project_assignment(
        self,
        project_name: str,
        project_description: Optional[str] = "",
        assignment_id: Optional[str] = None,
        assigned_by: str = "Project Lead"
    ) -> Dict[str, Any]:
        """
        Dispatches Project Assignment Notification to n8n Production Webhook:
        https://nallelashiva.app.n8n.cloud/webhook/project-assignment
        
        Payload:
        {
          "assignment_id": "assign_001",
          "project_name": "Civic Buzz",
          "project_description": "Village civic issue management system",
          "assigned_by": "Project Lead"
        }
        
        Handles:
        - Validation of project_name (must not be empty)
        - Stable assignment_id generation for duplicate protection
        - Detection of duplicate assignment responses
        - Timeout window of 30 seconds for sequential email delivery
        """
        # Validate project_name
        if not project_name or not project_name.strip():
            raise ValueError("Missing required field: project_name")

        clean_project_name = project_name.strip()
        clean_project_desc = (project_description or "").strip()
        clean_assigned_by = (assigned_by or "Project Lead").strip()
        
        # Use stable assignment ID or generate fallback
        clean_assignment_id = (assignment_id or f"assign_{clean_project_name.lower().replace(' ', '_')}").strip()

        payload = {
            "assignment_id": clean_assignment_id,
            "project_name": clean_project_name,
            "project_description": clean_project_desc,
            "assigned_by": clean_assigned_by
        }

        print(f"[n8n Service] Dispatching to Project Assignment Webhook ({self.assignment_webhook_url}):")
        print(f"             Payload: {json.dumps(payload)}")

        try:
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                self.assignment_webhook_url,
                data=req_data,
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "KuiperAI-AssignmentNotifier/1.0"
                }
            )
            
            # n8n sends 3 sequential emails, allowing up to 30 seconds
            with urllib.request.urlopen(req, timeout=30.0) as resp:
                resp_body = resp.read().decode("utf-8")
                status_code = resp.status
                
                parsed_json = {}
                try:
                    parsed_json = json.loads(resp_body)
                except Exception:
                    pass

                is_duplicate = parsed_json.get("duplicate", False) if isinstance(parsed_json, dict) else False
                is_success = parsed_json.get("success", status_code == 200) if isinstance(parsed_json, dict) else (status_code == 200)
                message = parsed_json.get("message", "Project assignment processed") if isinstance(parsed_json, dict) else resp_body

                print(f"[n8n Service] Assignment Webhook Response ({status_code}): success={is_success}, duplicate={is_duplicate}")

                return {
                    "success": is_success,
                    "duplicate": is_duplicate,
                    "status": "duplicate" if is_duplicate else ("success" if is_success else "error"),
                    "status_code": status_code,
                    "message": message,
                    "project_name": clean_project_name,
                    "assignment_id": clean_assignment_id,
                    "recipients": parsed_json.get("recipients", []) if isinstance(parsed_json, dict) else [],
                    "payload_sent": payload,
                    "n8n_response": parsed_json or resp_body
                }

        except urllib.error.HTTPError as he:
            err_body = he.read().decode("utf-8") if he.fp else ""
            err_msg = f"n8n HTTP Error {he.code}: {he.reason}"
            try:
                err_json = json.loads(err_body)
                if "message" in err_json:
                    err_msg = err_json["message"]
            except Exception:
                pass
                
            print(f"[n8n Service] {err_msg}")
            return {
                "success": False,
                "duplicate": False,
                "status": "error",
                "status_code": he.code,
                "message": err_msg,
                "assignment_id": clean_assignment_id,
                "payload_sent": payload
            }
        except urllib.error.URLError as ue:
            err_msg = f"n8n Network Error: {ue.reason}"
            print(f"[n8n Service] {err_msg}")
            return {
                "success": False,
                "duplicate": False,
                "status": "network_error",
                "status_code": 0,
                "message": err_msg,
                "assignment_id": clean_assignment_id,
                "payload_sent": payload
            }
        except Exception as e:
            err_msg = f"n8n Assignment Error: {str(e)}"
            print(f"[n8n Service] {err_msg}")
            return {
                "success": False,
                "duplicate": False,
                "status": "error",
                "status_code": 500,
                "message": err_msg,
                "assignment_id": clean_assignment_id,
                "payload_sent": payload
            }


# Global singleton instance
n8n_service = N8nWorkflowService()
