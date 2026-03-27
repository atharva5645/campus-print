alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.orders enable row level security;
alter table public.cart_items enable row level security;
alter table public.inventory enable row level security;
alter table public.machine_health enable row level security;
alter table public.admin_alerts enable row level security;
alter table public.notifications enable row level security;

create policy "services read for everyone"
on public.services
for select
to authenticated, anon
using (true);

create policy "authenticated users manage own cart"
on public.cart_items
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "authenticated users manage own orders"
on public.orders
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "authenticated users view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "service role full access services"
on public.services
for all
to service_role
using (true)
with check (true);

create policy "service role full access orders"
on public.orders
for all
to service_role
using (true)
with check (true);

create policy "service role full access cart"
on public.cart_items
for all
to service_role
using (true)
with check (true);

create policy "service role full access profiles"
on public.profiles
for all
to service_role
using (true)
with check (true);

create policy "service role full access inventory"
on public.inventory
for all
to service_role
using (true)
with check (true);

create policy "service role full access machine health"
on public.machine_health
for all
to service_role
using (true)
with check (true);

create policy "service role full access alerts"
on public.admin_alerts
for all
to service_role
using (true)
with check (true);

create policy "service role full access notifications"
on public.notifications
for all
to service_role
using (true)
with check (true);

alter table public.documents enable row level security;

create policy "authenticated users can read documents"
on public.documents
for select
to authenticated, anon
using (true);

create policy "admins can insert documents"
on public.documents
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "admins can delete documents"
on public.documents
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

create policy "documents bucket public read"
on storage.objects
for select
to public
using (bucket_id = 'documents');

create policy "documents bucket admin upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "documents bucket admin delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "admins can insert services"
on public.services
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "admins can update services"
on public.services
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "admins can delete services"
on public.services
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
