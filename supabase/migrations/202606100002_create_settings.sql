create table if not exists public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

alter table public.settings enable row level security;

create policy "Allow public read/write settings" on public.settings for all using (true) with check (true);

alter publication supabase_realtime add table public.settings;
