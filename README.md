# 🛒 Shopify Dashboard

Dashboard de ventas en tiempo real: Shopify → Supabase → Vercel.

## Stack
- **Next.js 14** — frontend + API routes
- **Supabase** — base de datos PostgreSQL
- **Vercel** — hosting gratuito
- **Recharts** — gráfico de ventas

---

## 1. Crear tabla en Supabase

Andá a **SQL Editor** en tu proyecto Supabase y ejecutá:

```sql
create table ventas (
  id uuid default gen_random_uuid() primary key,
  order_id text,
  sku text,
  producto text,
  cantidad integer,
  precio_unitario numeric,
  total numeric,
  created_at timestamptz default now()
);
```

---

## 2. Subir a GitHub

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/shopify-dashboard.git
git push -u origin main
```

> ⚠️ Asegurate de que `.gitignore` incluya `.env.local` (ya está configurado)

---

## 3. Deployar en Vercel

1. Entrá a [vercel.com](https://vercel.com) → "Add New Project"
2. Importá tu repositorio de GitHub
3. En **Environment Variables**, agregá:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hfamtbjvosmaijttomore.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tu anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | tu service_role key |
| `SHOPIFY_WEBHOOK_SECRET` | (lo obtenés en el paso 4) |

4. Click en **Deploy** ✅

---

## 4. Configurar Webhook en Shopify

1. En tu tienda Shopify → **Configuración → Notificaciones → Webhooks**
2. Crear webhook:
   - **Evento**: `Pedido creado` (orders/create)
   - **URL**: `https://TU-APP.vercel.app/api/webhook`
   - **Formato**: JSON
3. Copiá el **Signing Secret** que te da Shopify
4. Agregalo en Vercel como `SHOPIFY_WEBHOOK_SECRET`
5. Redeploy

---

## 5. Probar

Hacé un pedido de prueba en tu Shopify → debería aparecer automáticamente en el dashboard.

Para pruebas manuales podés hacer un POST a `/api/webhook` con el formato de Shopify.
