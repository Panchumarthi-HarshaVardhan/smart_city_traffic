#!/usr/bin/env python3
"""
CITYFLOW AI — Supabase Demo Authority & Citizen User Provisioner
This backend script uses the SUPABASE_SECRET_KEY (service role) from backend/.env
to safely create or update the demo accounts in Supabase Auth with email pre-confirmed
and roles correctly assigned.

Security note:
- Executed on backend only.
- Never exposed to the frontend.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend root is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path)

supabase_url = os.getenv("SUPABASE_URL")
supabase_secret_key = os.getenv("SUPABASE_SECRET_KEY")

if not supabase_url or not supabase_secret_key:
    print("❌ Error: SUPABASE_URL and SUPABASE_SECRET_KEY must be defined in backend/.env")
    sys.exit(1)

from supabase import create_client

def provision_users():
    print(f"📡 Connecting to Supabase at: {supabase_url}")
    client = create_client(supabase_url, supabase_secret_key)

    demo_users = [
        {
            "email": "authority.demo@cityflow.ai",
            "password": "CityFlowDemo@2026",
            "data": {
                "full_name": "Demo Authority Operator",
                "role": "authority",
                "agency": "Bengaluru Traffic & Emergency Command",
            },
            "role": "authority",
        },
        {
            "email": "emergency.demo@cityflow.ai",
            "password": "CityFlowEmergency@2026",
            "data": {
                "full_name": "Demo Emergency Controller",
                "role": "authority",
                "agency": "Emergency Fleet & Dispatch Command",
            },
            "role": "authority",
        },
        {
            "email": "citizen.demo@cityflow.ai",
            "password": "CityflowCitizen2026!",
            "data": {
                "full_name": "Demo Citizen Traveler",
                "role": "citizen",
                "home_city": "Bengaluru",
                "home_state": "Karnataka",
            },
            "role": "citizen",
        },
    ]

    # Fetch existing users
    existing_users_response = client.auth.admin.list_users()
    existing_by_email = {u.email.lower(): u for u in existing_users_response}

    for user_info in demo_users:
        email = user_info["email"].lower()
        password = user_info["password"]
        meta = user_info["data"]

        if email in existing_by_email:
            existing = existing_by_email[email]
            print(f"🔄 Updating existing demo user: {email} (ID: {existing.id})")
            client.auth.admin.update_user_by_id(
                existing.id,
                {
                    "password": password,
                    "user_metadata": meta,
                    "email_confirm": True,
                }
            )
            user_id = existing.id
            print(f"   ✅ Updated metadata and password for {email}")
        else:
            print(f"✨ Creating new demo user: {email}...")
            new_user = client.auth.admin.create_user(
                {
                    "email": email,
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": meta,
                }
            )
            user_id = new_user.user.id
            print(f"   ✅ Created {email} (ID: {user_id})")

        # Try to sync into profiles table if it exists
        try:
            client.table("profiles").upsert({
                "id": user_id,
                "email": email,
                "full_name": meta.get("full_name"),
                "role": user_info["role"],
                "updated_at": "now()",
            }).execute()
            print(f"   ✅ Synced into public.profiles")
        except Exception as e:
            # Ignore if table profiles is not configured
            pass

    print("\n🎉 All demo accounts provisioned successfully!")
    print("\nCredentials:")
    for u in demo_users:
        print(f"  • Role: {u['role'].upper():<10} Email: {u['email']:<30} Pass: {u['password']}")

if __name__ == "__main__":
    provision_users()
