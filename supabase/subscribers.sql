-- Waitlist signups captured by /api/subscribe (replaces the old Resend
-- audience). Run this once in the project's Supabase SQL editor.
--
-- RLS is enabled with no policies, so only the service-role key — used
-- server-side in the subscribe route via src/lib/supabase.ts — can read or
-- write. The emails are never exposed through the public anon key.
create table if not exists subscribers (
    id         uuid primary key default gen_random_uuid(),
    email      text not null unique,
    created_at timestamptz not null default now()
);

alter table subscribers enable row level security;
