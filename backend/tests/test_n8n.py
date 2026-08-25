import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.n8n_service import n8n_service
from models.schemas import MeetingItem

test_meet = MeetingItem(
    id='test_meet_1',
    title='Sprint Kickoff & Architecture Review',
    project_id='proj_test',
    project_name='Distributed Healthcare Cloud',
    date='2026-08-25',
    start_time='10:00 AM',
    end_time='11:00 AM',
    duration_minutes=60,
    type='Sprint Planning',
    attendees=['Arjun Reddy', 'Rahul Kumar', 'Sneha Patel'],
    location_or_link='',
    agenda='Review API endpoints, Kubernetes manifest deployment, and HIPAA security compliance.',
    created_at='2026-08-25T07:11:00'
)

res = n8n_service.trigger_for_meeting(test_meet)
print('n8n Trigger Result:')
print('Status:', res['status'])
print('Webhook URL:', res['webhook_url'])
print('Dispatched count:', res['dispatched_count'])
for d in res['dispatches']:
    print(f"  * Recipient: {d['recipient']} -> {d['email']}")
    print(f"    Subject: {d['email_preview']['subject']}")
    print(f"    Payload sendTo: {d['payload']['sendTo']}")
