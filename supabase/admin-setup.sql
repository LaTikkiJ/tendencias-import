-- TENDENCIAS IMPORT - PASO DE CONFIGURACIÓN ADMIN
-- Ejecutar DESPUÉS de supabase/schema.sql

-- 1) Primero crea a Sofía desde:
-- Supabase > Authentication > Users > Add user
--
-- 2) Copia el UUID del usuario y reemplaza UUID_DE_SOFIA:

-- insert into public.profiles (user_id, full_name, role)
-- values ('UUID_DE_SOFIA', 'Sofía', 'admin')
-- on conflict (user_id)
-- do update set full_name = excluded.full_name, role = 'admin';

-- 3) Verifica que el bucket exista y sea público:
insert into storage.buckets (id, name, public)
values ('catalog-media', 'catalog-media', true)
on conflict (id) do update set public = true;

-- 4) Si ya corriste schema.sql, las políticas ya están creadas.
-- Puedes verificar a Sofía con:
-- select * from public.profiles;
