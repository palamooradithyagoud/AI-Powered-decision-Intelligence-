import os
import sys
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.n8n_service import (
    n8n_service,
    PRODUCTION_ASSIGNMENT_WEBHOOK_URL
)
from db.storage import storage

def test_project_assignment_workflow():
    print("================================================================")
    print("TESTING N8N PROJECT ASSIGNMENT NOTIFICATION WORKFLOW")
    print("================================================================")
    
    # 1. Test Empty Project Name Validation
    print("\n1. Testing Validation on Empty Project Name:")
    try:
        n8n_service.trigger_n8n_project_assignment(
            project_name="",
            assignment_id="test_invalid"
        )
        assert False, "Should have raised ValueError for empty project_name"
    except ValueError as ve:
        print(f"  * Validation properly caught: '{ve}'")
        print("  [PASS] Empty project_name correctly rejected.")

    # 2. Test Real Project Assignment Webhook Dispatch
    print(f"\n2. Testing n8n Webhook Dispatch ({PRODUCTION_ASSIGNMENT_WEBHOOK_URL}):")
    test_assignment_id = "integration_test_civic_001"
    res1 = n8n_service.trigger_n8n_project_assignment(
        project_name="Civic Buzz Test",
        project_description="Testing project assignment notification for village civic issue management system",
        assignment_id=test_assignment_id,
        assigned_by="Project Lead"
    )
    print("  * Webhook Status:", res1["status"])
    print("  * Success:", res1["success"])
    print("  * Duplicate:", res1["duplicate"])
    print("  * Message:", res1["message"])
    print("  * Assignment ID:", res1["assignment_id"])
    assert res1["success"] is True
    print("  [PASS] Initial assignment dispatch succeeded!")

    # 3. Test Duplicate Suppression with Same Assignment ID
    print(f"\n3. Testing Duplicate Protection (Re-sending with SAME assignment_id '{test_assignment_id}'):")
    res2 = n8n_service.trigger_n8n_project_assignment(
        project_name="Civic Buzz Test",
        project_description="Testing project assignment notification duplicate retry",
        assignment_id=test_assignment_id,
        assigned_by="Project Lead"
    )
    print("  * Webhook Status:", res2["status"])
    print("  * Success:", res2["success"])
    print("  * Duplicate Flag:", res2["duplicate"])
    print("  * Message:", res2["message"])
    assert res2["success"] is True
    assert res2["duplicate"] is True
    print("  [PASS] Duplicate assignment correctly handled without resending duplicate emails!")

    # 4. Test Service Status
    print("\n4. Testing n8n Service Status API:")
    status = n8n_service.get_status()
    print("  * Meeting Workflow Active:", status["meeting_workflow"]["is_active"])
    print("  * Assignment Workflow Active:", status["assignment_workflow"]["is_active"])
    print("  * Recipients:", status["assignment_workflow"]["recipients"])
    assert status["assignment_workflow"]["is_active"] is True
    print("  [PASS] Integration status report verified.")

    print("\n================================================================")
    print("ALL PROJECT ASSIGNMENT N8N WORKFLOW TESTS PASSED SUCCESSFULLY!")
    print("================================================================")

if __name__ == "__main__":
    test_project_assignment_workflow()
