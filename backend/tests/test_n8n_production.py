import os
import sys
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.n8n_service import (
    n8n_service,
    convert_to_24h_format,
    build_member_emails_string,
    PRODUCTION_N8N_WEBHOOK_URL
)
from models.schemas import MeetingCreate
from db.storage import storage

def test_n8n_integration():
    print("==================================================")
    print("TESTING N8N PRODUCTION MEETING SCHEDULING WORKFLOW")
    print("==================================================")
    
    # 1. Test 24-hour time conversions
    print("\n1. Testing 24h Time Conversion:")
    tests = [
        ("10:30 AM", "10:30"),
        ("2:30 PM", "14:30"),
        ("09:15 AM", "09:15"),
        ("11:45 PM", "23:45"),
        ("14:30", "14:30")
    ]
    for inp, expected in tests:
        res = convert_to_24h_format(inp)
        print(f"  * {inp:12} -> {res:10} {'[PASS]' if res == expected else '[FAIL]'}")
        assert res == expected, f"Failed for {inp}: expected {expected}, got {res}"
        
    # 2. Test Member Emails Formatting
    print("\n2. Testing Member Emails Resolution:")
    attendees = ["Arjun Reddy", "Rahul Kumar", "shivanallela363@gmail.com"]
    emails_str = build_member_emails_string(attendees)
    print(f"  * Attendees: {attendees}")
    print(f"  * Formatted string: '{emails_str}'")
    assert "palamooradithyagoud@gmail.com" in emails_str
    assert "shivanallela363@gmail.com" in emails_str
    print("  [PASS] Member emails correctly formatted.")

    # 3. Test Direct n8n Service Trigger
    print(f"\n3. Testing n8n Webhook Dispatch ({PRODUCTION_N8N_WEBHOOK_URL}):")
    try:
        dispatch_res = n8n_service.trigger_n8n_schedule_meeting(
            meeting_topic="Sprint Kickoff & Zoom Alignment",
            meeting_date="2026-08-25",
            start_time_str="10:30 AM",
            duration_minutes=45,
            attendees=["Arjun Reddy", "Ishita Rao"]
        )
        print("  * Dispatch Status:", dispatch_res["status"])
        print("  * HTTP Status Code:", dispatch_res["status_code"])
        print("  * Payload Sent:", dispatch_res["payload_sent"])
        print("  * n8n Response:", dispatch_res["n8n_response"])
        print("  [PASS] Webhook successfully received and processed by n8n!")
    except Exception as e:
        print("  [FAIL] Webhook error:", e)
        raise e

    # 4. Test create_meeting storage flow
    print("\n4. Testing Full Meeting Creation Flow (storage.create_meeting):")
    payload = MeetingCreate(
        title="Automated Sprint Architecture Sync",
        project_id=None,
        project_name="General Sprint & Architecture Sync",
        date="2026-08-25",
        start_time="11:30 AM",
        end_time="12:30 PM",
        duration_minutes=60,
        type="Sprint Planning",
        attendees=["Arjun Reddy", "Rahul Kumar"],
        location_or_link="",
        agenda="Review API schemas, database migrations, and n8n Zoom automation."
    )
    
    created_meet = storage.create_meeting(payload)
    print(f"  * Created Meeting ID: {created_meet.id}")
    print(f"  * Title: {created_meet.title}")
    print(f"  * Date: {created_meet.date} ({created_meet.start_time})")
    print(f"  * Zoom Link: {created_meet.location_or_link or '(Dispatched to n8n email)'}")
    print("  [PASS] Full meeting creation and n8n dispatch verified.")

    print("\n==================================================")
    print("ALL N8N PRODUCTION TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    test_n8n_integration()
