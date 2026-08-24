"""
Kuiper Database & Storage Adapter
All database persistence runs directly through Supabase Cloud Database.
"""
from db.supabase_storage import (
    SupabaseStorage,
    DEMO_USERS,
    EMPLOYEES_PROFILES,
    get_employee_profile
)

storage = SupabaseStorage()
