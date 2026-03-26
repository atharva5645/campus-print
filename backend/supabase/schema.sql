create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key,
  full_name text,
  email text unique,
  role text not null default 'student' check (role in ('student', 'admin', 'operator')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text not null default 'print',
  enabled boolean not null default true,
  color text not null default '#4a40e0',
  background text not null default '#eef2ff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  service_id uuid not null references public.services(id) on delete restrict,
  pages integer not null check (pages > 0),
  quantity integer not null check (quantity > 0),
  price_per_page numeric(10,2) not null check (price_per_page >= 0),
  total_price numeric(10,2) not null check (total_price >= 0),
  notes text,
  file_urls text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'in_review', 'processing', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  pages integer not null check (pages > 0),
  quantity integer not null check (quantity > 0),
  price_per_page numeric(10,2) not null check (price_per_page >= 0),
  total_price numeric(10,2) not null check (total_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  item_name text not null unique,
  category text not null,
  stock_quantity integer not null default 0,
  reorder_level integer not null default 0,
  unit text not null default 'units',
  updated_at timestamptz not null default now()
);

create table if not exists public.machine_health (
  id uuid primary key default gen_random_uuid(),
  machine_name text not null unique,
  status text not null default 'stable' check (status in ('stable', 'warning', 'maintenance', 'offline')),
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_alerts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high')),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_services_updated_at on public.services;
create trigger trg_services_updated_at
before update on public.services
for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists trg_cart_items_updated_at on public.cart_items;
create trigger trg_cart_items_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

insert into public.services (name, icon, enabled, color, background)
values
  ('Blue Books', 'menu_book', true, '#4a40e0', '#eef2ff'),
  ('Color Printing', 'print', true, '#00628c', '#e9f8ff'),
  ('No Due Forms', 'description', false, '#006947', '#e8f7ef'),
  ('Lab Manuals', 'science', true, '#b41340', '#fff1f4')
on conflict (name) do nothing;

insert into public.inventory (item_name, category, stock_quantity, reorder_level, unit)
values
  ('A4 Paper', 'paper', 720, 250, 'reams'),
  ('Black Toner', 'toner', 8, 3, 'cartridges'),
  ('Lamination Sheets', 'lamination', 120, 50, 'packs')
on conflict (item_name) do nothing;

insert into public.machine_health (machine_name, status, notes)
values
  ('Studio Printer 01', 'stable', 'All systems normal'),
  ('Studio Printer 02', 'stable', 'Recommended for large batches'),
  ('Main Laminator', 'maintenance', 'Scheduled maintenance pending')
on conflict (machine_name) do nothing;

insert into public.admin_alerts (title, description, severity, resolved)
values
  ('Low toner warning', 'Black toner is approaching reorder level.', 'medium', false),
  ('Laminator maintenance', 'Main laminator requires service review.', 'high', false);
