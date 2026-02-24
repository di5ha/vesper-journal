-- =============================================================================
-- Vesper — Supabase Database Initialization
-- =============================================================================
-- Run this entire file once via the Supabase SQL Editor.
-- Order matters: extensions → tables → triggers → RLS.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS vector;


-- -----------------------------------------------------------------------------
-- 2. TABLES
-- -----------------------------------------------------------------------------

-- entries: core journal entries with AI analysis results and embeddings
CREATE TABLE IF NOT EXISTS public.entries (
    id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content         text            NOT NULL DEFAULT '',
    created_at      timestamptz     NOT NULL DEFAULT now(),
    updated_at      timestamptz     NOT NULL DEFAULT now(),
    mood_score      float,                          -- 1.0–10.0, null until analyzed
    themes          text[]          DEFAULT '{}',   -- e.g. ["work pressure", "self-doubt"]
    distortions     jsonb           DEFAULT '[]',   -- [{label, description}, ...]
    observation     text,                           -- AI one-liner about the entry
    embedding       vector(384),                    -- all-MiniLM-L6-v2 output
    analyzed        boolean         NOT NULL DEFAULT false
);

-- reports: weekly AI-generated mind map reports
CREATE TABLE IF NOT EXISTS public.reports (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at          timestamptz NOT NULL DEFAULT now(),
    week_start          date        NOT NULL,
    dominant_emotion    text,
    top_themes          text[]      DEFAULT '{}',
    emotional_arc       text,
    ai_observation      text,
    pdf_url             text        -- nullable; populated after PDF is generated
);


-- -----------------------------------------------------------------------------
-- 3. INDEXES
-- -----------------------------------------------------------------------------

-- Fast lookup of all entries/reports for a given user
CREATE INDEX IF NOT EXISTS entries_user_id_idx    ON public.entries (user_id);
CREATE INDEX IF NOT EXISTS entries_created_at_idx ON public.entries (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_user_id_idx    ON public.reports (user_id);

-- pgvector ANN index for semantic search (cosine distance)
-- Uses IVFFlat; tune lists= based on row count (sqrt(rows) is a good rule of thumb)
CREATE INDEX IF NOT EXISTS entries_embedding_idx
    ON public.entries
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);


-- -----------------------------------------------------------------------------
-- 4. TRIGGERS — auto-update updated_at on entries
-- -----------------------------------------------------------------------------

-- Reusable function: sets updated_at = now() on any UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Attach trigger to entries table
DROP TRIGGER IF EXISTS entries_set_updated_at ON public.entries;
CREATE TRIGGER entries_set_updated_at
    BEFORE UPDATE ON public.entries
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------

-- Enable RLS on both tables
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- ---- entries policies -------------------------------------------------------

-- SELECT: users can only read their own entries
CREATE POLICY "entries: select own"
    ON public.entries
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: users can only insert rows where user_id matches their own UID
CREATE POLICY "entries: insert own"
    ON public.entries
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can only update their own entries
CREATE POLICY "entries: update own"
    ON public.entries
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: users can only delete their own entries
CREATE POLICY "entries: delete own"
    ON public.entries
    FOR DELETE
    USING (auth.uid() = user_id);

-- ---- reports policies -------------------------------------------------------

-- SELECT
CREATE POLICY "reports: select own"
    ON public.reports
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "reports: insert own"
    ON public.reports
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "reports: update own"
    ON public.reports
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE
CREATE POLICY "reports: delete own"
    ON public.reports
    FOR DELETE
    USING (auth.uid() = user_id);


-- =============================================================================
-- END OF SCHEMA — Vesper v1.0
-- =============================================================================
