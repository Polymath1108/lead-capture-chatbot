-- Run this in Supabase SQL editor
create extension if not exists "pgcrypto";

create table if not exists public.conversations (
  id uuid primary key,
  messages jsonb not null default '[]'::jsonb,
  summary text,
  contact_name text,
  contact_email text,
  contact_phone text,
  lead_captured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  name text not null,
  email text not null,
  phone text not null,
  summary text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists leads_status_idx on public.leads(status);
