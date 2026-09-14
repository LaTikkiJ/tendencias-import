# V3 — Panel visual para Sofía

Esta versión agrega:

- botón Nueva categoría de paca;
- pantalla Administrar paca;
- edición de nombre, tallas, cantidades y visibilidad;
- carga múltiple de collages/fotos/videos;
- drag & drop;
- portada automática y cambio de portada;
- eliminar archivos;
- botón Nuevo código de serie;
- pantalla Administrar serie;
- edición de precio, stock, tallas, estado y visibilidad;
- galería de fotos y videos para cada serie.

## Antes de probar `/admin`

1. Ejecuta `supabase/schema.sql` si todavía no lo hiciste.
2. En Supabase crea el usuario de Sofía en Authentication > Users.
3. Ejecuta `supabase/admin-setup.sql` reemplazando el UUID.
4. Reinicia `npm run dev`.
5. Entra a `http://localhost:3000/admin/login`.

---

# Tendencias Import Perú — V2 WhatsApp

Esta versión está pensada para la primera etapa del proyecto:

- web pública elegante;
- Pacas Kids y Damas;
- collages y videos por categoría;
- Series Kids con cantidad disponible;
- carrito de Series Kids;
- botón "Enviar carrito por WhatsApp";
- SIN pago ni compra directa dentro de la web;
- panel administrativo para Sofía;
- inventario manual de series;
- Supabase independiente para Tendencias Import.

## Flujo de venta de Series Kids

1. Sofía registra el modelo, código, precio, tallas y cantidad de series.
2. La clienta entra a `/series`.
3. Agrega uno o varios códigos al carrito.
4. Puede cambiar la cantidad de series sin exceder el stock mostrado.
5. Presiona "Enviar carrito por WhatsApp".
6. Se abre el WhatsApp de Tendencias Import con todo el resumen escrito.
7. Sofía confirma stock, pago y envío por WhatsApp.
8. Cuando cierre la venta, Sofía actualiza el stock desde `/admin/series`.

Importante:
El carrito NO descuenta stock porque todavía no existe compra directa ni
reserva automática. Así evitamos bloquear mercadería por carritos abandonados.

## Instalación

```bash
npm install
```

Copia:

```bash
cp .env.example .env.local
```

Completa:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_WHATSAPP_NUMBER=51XXXXXXXXX
```

## Supabase

Usar un proyecto NUEVO y separado para Tendencias Import.

Ejecutar:

`supabase/schema.sql`

Después crear a Sofía en:

Authentication > Users > Add user

Y registrar su perfil:

```sql
insert into public.profiles (user_id, full_name, role)
values ('UUID-DE-SOFIA', 'Sofía', 'admin');
```

## Rutas públicas

- `/`
- `/pacas`
- `/pacas/[slug]`
- `/series`
- `/series/[slug]`

## Rutas de Sofía

- `/admin/login`
- `/admin`
- `/admin/pacas`
- `/admin/series`

## Próxima fase

- uploader drag & drop de imágenes;
- uploader de videos;
- reordenar collages;
- editar/ocultar categorías;
- editar/ocultar series;
- registrar ventas manuales desde el panel;
- historial de movimientos de stock;
- aviso de stock bajo;
- estadísticas.

La compra directa, reservas automáticas y pagos online quedan fuera de esta
primera etapa y se pueden agregar después sin rehacer la base.
