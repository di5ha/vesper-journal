"""
app/core/supabase.py — Supabase client factory.

We use the *anon* key as the base client.
For every authenticated request we call `.auth.set_session(token)` so that
Postgres RLS policies (which use auth.uid()) correctly scope all queries.
"""

from supabase import create_client, Client
from app.core.config import settings


def get_supabase(access_token: str | None = None) -> Client:
    """
    Return a Supabase client.

    If *access_token* is provided (a Supabase JWT from the frontend),
    inject it so RLS policies evaluate auth.uid() correctly for every
    DB operation performed with this client instance.
    """
    client: Client = create_client(settings.supabase_url, settings.supabase_key)

    if access_token:
        # Set the user's JWT so every subsequent DB call is scoped to that user
        client.postgrest.auth(access_token)

    return client
