-- Vesper: match_entries RPC for pgvector semantic search
-- Run this in the Supabase SQL Editor.
--
-- Uses SECURITY INVOKER so auth.uid() resolves to the calling user via JWT,
-- scoping results to that user's entries without needing an explicit user_id param.
-- The IVFFlat index on embedding (from supabase_init.sql) makes this fast.

CREATE OR REPLACE FUNCTION match_entries(
  query_embedding vector(384),
  match_count     int DEFAULT 8
)
RETURNS TABLE (
  id          uuid,
  content     text,
  created_at  timestamptz,
  updated_at  timestamptz,
  mood_score  float8,
  themes      text[],
  distortions jsonb,
  observation text,
  analyzed    boolean,
  similarity  float8
)
LANGUAGE sql
STABLE
SECURITY INVOKER          -- uses caller's JWT → auth.uid() scopes to their rows
AS $$
  SELECT
    e.id,
    e.content,
    e.created_at,
    e.updated_at,
    e.mood_score,
    e.themes,
    e.distortions,
    e.observation,
    e.analyzed,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM entries e
  WHERE e.user_id = auth.uid()
    AND e.embedding IS NOT NULL
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
$$;
