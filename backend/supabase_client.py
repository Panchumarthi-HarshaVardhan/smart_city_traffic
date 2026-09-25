"""
CityFlow AI - Supabase Client Integration

Provides an authenticated, reusable Supabase client instance configured with
backend-only service credentials.
"""

import os
import sys
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from supabase import create_client, Client

# Find and load backend/.env or root .env
_current_dir = Path(__file__).resolve().parent
_backend_env = _current_dir / ".env"
_root_env = _current_dir.parent / ".env"

if _backend_env.exists():
    load_dotenv(dotenv_path=_backend_env)
elif _root_env.exists():
    load_dotenv(dotenv_path=_root_env)
else:
    load_dotenv()

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Get or create a singleton instance of the Supabase client.
    Validates that SUPABASE_URL and SUPABASE_SECRET_KEY are configured.
    """
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    supabase_url = os.environ.get("SUPABASE_URL", "").strip()
    supabase_key = os.environ.get("SUPABASE_SECRET_KEY", "").strip()

    if not supabase_url:
        raise ValueError(
            "SUPABASE_URL environment variable is missing or empty. "
            "Please configure it in backend/.env"
        )

    if not supabase_key:
        raise ValueError(
            "SUPABASE_SECRET_KEY environment variable is missing or empty. "
            "Please configure it in backend/.env"
        )

    _supabase_client = create_client(supabase_url, supabase_key)
    return _supabase_client


# Expose a default client instance if environment is already loaded
try:
    supabase = get_supabase_client()
except Exception:
    supabase = None
