-- NOTA V2: orders/order_items y funciones de reserva quedan preparadas para una fase futura.
-- En la fase actual, la tienda NO llama esas funciones: el carrito se envía por WhatsApp.

-- TENDENCIAS IMPORT - BASE DE DATOS INICIAL
-- Ejecutar en Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'staff' check (role in ('admin','staff')),
  created_at timestamptz not null default now()
);

create table if not exists public.paca_categories (
  id uuid primary key default gen_random_uuid(),
  audience text not null check (audience in ('kids','damas')),
  name text not null,
  slug text unique not null,
  description text,
  cover_url text,
  size_ranges text[] not null default '{}',
  box_quantities int[] not null default '{}',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.paca_media (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.paca_categories(id) on delete cascade,
  media_type text not null check (media_type in ('image','video')),
  url text not null,
  title text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.series_products (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  slug text unique not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  cover_url text,
  sizes text[] not null default '{}',
  pieces_per_series int not null default 5 check (pieces_per_series > 0),
  series_available int not null default 0 check (series_available >= 0),
  status text not null default 'stock' check (status in ('stock','preorder')),
  active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.series_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.series_products(id) on delete cascade,
  media_type text not null check (media_type in ('image','video')),
  url text not null,
  title text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default (
    'TI-' || to_char(now(), 'YYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 5, '0')
  ),
  customer_name text not null,
  phone text not null,
  department text,
  district text,
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null default 'reserved'
    check (status in ('reserved','payment_review','confirmed','preparing','sent','delivered','cancelled','expired')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.series_products(id) on delete set null,
  product_code text not null,
  product_name text not null,
  qty int not null check (qty > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  whatsapp_number text,
  instagram_url text,
  tiktok_url text,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

-- Helper seguro para saber si quien llama es admin.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.paca_categories enable row level security;
alter table public.paca_media enable row level security;
alter table public.series_products enable row level security;
alter table public.series_media enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "public read active paca categories" on public.paca_categories;
create policy "public read active paca categories"
on public.paca_categories for select
to anon, authenticated
using (active = true or public.is_admin());

drop policy if exists "admin manage paca categories" on public.paca_categories;
create policy "admin manage paca categories"
on public.paca_categories for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public read active paca media" on public.paca_media;
create policy "public read active paca media"
on public.paca_media for select
to anon, authenticated
using (active = true or public.is_admin());

drop policy if exists "admin manage paca media" on public.paca_media;
create policy "admin manage paca media"
on public.paca_media for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public read active series" on public.series_products;
create policy "public read active series"
on public.series_products for select
to anon, authenticated
using ((active = true and series_available > 0) or public.is_admin());

drop policy if exists "admin manage series" on public.series_products;
create policy "admin manage series"
on public.series_products for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public read active series media" on public.series_media;
create policy "public read active series media"
on public.series_media for select
to anon, authenticated
using (active = true or public.is_admin());

drop policy if exists "admin manage series media" on public.series_media;
create policy "admin manage series media"
on public.series_media for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin read orders" on public.orders;
create policy "admin read orders"
on public.orders for select
to authenticated
using (public.is_admin());

drop policy if exists "admin update orders" on public.orders;
create policy "admin update orders"
on public.orders for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin read order items" on public.order_items;
create policy "admin read order items"
on public.order_items for select
to authenticated
using (public.is_admin());

drop policy if exists "public read site settings" on public.site_settings;
create policy "public read site settings"
on public.site_settings for select
to anon, authenticated
using (true);

drop policy if exists "admin manage site settings" on public.site_settings;
create policy "admin manage site settings"
on public.site_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- FUNCIÓN ATÓMICA DE RESERVA.
-- Bloquea cada producto, valida stock y recién entonces descuenta.
create or replace function public.place_series_order(
  p_customer_name text,
  p_phone text,
  p_department text,
  p_district text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(12,2) := 0;
  v_line jsonb;
  v_product public.series_products%rowtype;
  v_qty int;
begin
  if coalesce(trim(p_customer_name), '') = '' then
    raise exception 'Nombre requerido';
  end if;

  if coalesce(trim(p_phone), '') = '' then
    raise exception 'WhatsApp requerido';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido está vacío';
  end if;

  insert into public.orders (
    customer_name, phone, department, district, status, expires_at
  )
  values (
    trim(p_customer_name),
    trim(p_phone),
    nullif(trim(p_department), ''),
    nullif(trim(p_district), ''),
    'reserved',
    now() + interval '30 minutes'
  )
  returning id, order_number into v_order_id, v_order_number;

  for v_line in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(1, (v_line->>'qty')::int);

    select *
      into v_product
    from public.series_products
    where id = (v_line->>'product_id')::uuid
      and active = true
    for update;

    if not found then
      raise exception 'Uno de los productos ya no está disponible';
    end if;

    if v_product.series_available < v_qty then
      raise exception 'Stock insuficiente para %', v_product.code;
    end if;

    update public.series_products
    set series_available = series_available - v_qty,
        updated_at = now()
    where id = v_product.id;

    insert into public.order_items (
      order_id, product_id, product_code, product_name, qty, unit_price
    )
    values (
      v_order_id, v_product.id, v_product.code, v_product.name, v_qty, v_product.price
    );

    v_subtotal := v_subtotal + (v_product.price * v_qty);
  end loop;

  update public.orders
  set subtotal = v_subtotal,
      total = v_subtotal,
      updated_at = now()
  where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total', v_subtotal
  );
exception
  when others then
    raise;
end;
$$;

revoke all on function public.place_series_order(text,text,text,text,jsonb) from public;
grant execute on function public.place_series_order(text,text,text,text,jsonb) to anon, authenticated;

-- DEVOLVER STOCK DE RESERVAS VENCIDAS
create or replace function public.release_expired_orders()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_item record;
  v_count int := 0;
begin
  for v_order in
    select id
    from public.orders
    where status = 'reserved'
      and expires_at is not null
      and expires_at < now()
    for update
  loop
    for v_item in
      select product_id, qty
      from public.order_items
      where order_id = v_order.id
        and product_id is not null
    loop
      update public.series_products
      set series_available = series_available + v_item.qty,
          updated_at = now()
      where id = v_item.product_id;
    end loop;

    update public.orders
    set status = 'expired',
        updated_at = now()
    where id = v_order.id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- STORAGE: bucket público para collages, imágenes y videos.
insert into storage.buckets (id, name, public)
values ('catalog-media', 'catalog-media', true)
on conflict (id) do update set public = true;

drop policy if exists "public read catalog media" on storage.objects;
create policy "public read catalog media"
on storage.objects for select
to public
using (bucket_id = 'catalog-media');

drop policy if exists "admin upload catalog media" on storage.objects;
create policy "admin upload catalog media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'catalog-media'
  and public.is_admin()
);

drop policy if exists "admin update catalog media" on storage.objects;
create policy "admin update catalog media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'catalog-media'
  and public.is_admin()
)
with check (
  bucket_id = 'catalog-media'
  and public.is_admin()
);

drop policy if exists "admin delete catalog media" on storage.objects;
create policy "admin delete catalog media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'catalog-media'
  and public.is_admin()
);

-- DATOS DEMO opcionales
insert into public.paca_categories
  (audience, name, slug, description, size_ranges, box_quantities, sort_order)
values
  ('kids', 'Verano Kids', 'verano-kids', 'Prendas surtidas para temporada de verano.', array['0-7','1-7','2-7'], array[15,25,50,100], 1),
  ('kids', 'Invierno Kids', 'invierno-kids', 'Conjuntos, abrigos y opciones para frío.', array['1-7','2-7'], array[15,25,50,100], 2),
  ('damas', 'Tops Damas', 'tops-damas', 'Selección de tops para venta mayorista.', array['XS','S','M','L','XL'], array[15,25,50,100], 3)
on conflict (slug) do nothing;
