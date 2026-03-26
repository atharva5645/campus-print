alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.orders enable row level security;
alter table public.cart_items enable row level security;
alter table public.inventory enable row level security;
alter table public.machine_health enable row level security;
alter table public.admin_alerts enable row level security;

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
