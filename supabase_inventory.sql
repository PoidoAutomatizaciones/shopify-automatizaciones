-- Tabla de productos
create table productos (
  id uuid default gen_random_uuid() primary key,
  sku text unique not null,
  nombre text not null,
  stock_inicial integer default 0,
  created_at timestamptz default now()
);

-- Tabla de movimientos
create table movimientos (
  id uuid default gen_random_uuid() primary key,
  sku text not null,
  tipo text not null check (tipo in ('entrada', 'salida')),
  cantidad integer not null,
  origen text not null default 'carga manual',
  order_id text,
  nota text,
  created_at timestamptz default now()
);

-- Vista de stock actual (calculada)
create view stock_actual as
select
  p.sku,
  p.nombre,
  p.stock_inicial,
  coalesce(sum(case when m.tipo = 'entrada' then m.cantidad else -m.cantidad end), 0) as movimientos_netos,
  p.stock_inicial + coalesce(sum(case when m.tipo = 'entrada' then m.cantidad else -m.cantidad end), 0) as stock_disponible
from productos p
left join movimientos m on m.sku = p.sku
group by p.sku, p.nombre, p.stock_inicial;
