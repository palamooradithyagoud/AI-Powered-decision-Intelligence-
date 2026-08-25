"""
n8n Production Meeting-Scheduling Integration Service
Dispatches meeting creation requests to the active n8n production webhook:
https://nallelashiva.app.n8n.cloud/webhook/schedule-meeting
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

# Production n8n Webhook URL provided by user
PRODUCTION_N8N_WEBHOOK_URL = "https://nallelashiva.app.n8n.cloud/webhook/schedule-meeting"

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
    Ensures palamooradithyagoud@gmail.com and shivanallela363@gmail.com are included.
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
        self.webhook_url = os.getenv("N8N_WEBHOOK_URL", PRODUCTION_N8N_WEBHOOK_URL)
        self.default_emails = DEFAULT_MEMBER_EMAILS

    def get_status(self) -> Dict[str, Any]:
        """Returns the current n8n webhook configuration status."""
        return {
            "workflow_name": "Zoom Meeting Scheduling & Email Automation",
            "webhook_url": self.webhook_url,
            "target_recipients": self.default_emails,
            "is_configured": True,
            "required_fields": [
                "meeting_topic",
                "meeting_date (YYYY-MM-DD)",
                "start_time (HH:MM 24h)",
                "duration_minutes (integer)",
                "member_emails (comma-separated)"
            ]
        }

    def validate_meeting_payload(
        self,
        meeting_topic: str,
        meeting_date: str,
        start_time_24h: str,
        duration_minutes: int,
        member_emails: str
    ) -> Optional[str]:
        """
        Validates all fields before dispatching to n8n.
        Returns error string if invalid, None if valid.
        """
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
        """
        Sends the JSON payload to n8n production webhook:
        {
          "meeting_topic": "Weekly Team Sync",
          "meeting_date": "2026-09-01",
          "start_time": "14:30",
          "duration_minutes": 30,
          "member_emails": "palamooradithyagoud@gmail.com, shivanallela363@gmail.com"
        }
        """
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

        print(f"[n8n Service] Dispatching to n8n Production Webhook ({self.webhook_url}):")
        print(f"             Payload: {json.dumps(payload)}")

        try:
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                self.webhook_url,
                data=req_data,
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "KuiperAI-MeetingScheduler/1.0"
                }
            )
            with urllib.request.urlopen(req, timeout=12.0) as resp:
                resp_body = resp.read().decode("utf-8")
                status_code = resp.status
                
                print(f"[n8n Service] Response {status_code}: {resp_body}")
                
                zoom_link = None
                parsed_json = {}
                try:
                    parsed_json = json.loads(resp_body)
                    # Extract Zoom link if returned by n8n workflow
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
                    "webhook_url": self.webhook_url,
                    "payload_sent": payload,
                    "n8n_response": parsed_json or resp_body,
                    "zoom_link": zoom_link,
                    "message": "n8n workflow triggered successfully. Zoom meeting created and email invitations sent."
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


# Global singleton instance
n8n_service = N8nWorkflowService()
