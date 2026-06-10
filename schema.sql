-- Create categories table
create table categories (
  id serial primary key,
  name text not null,
  icon text,
  sort_order int default 0
);

-- Create menu_items table
create table menu_items (
  id serial primary key,
  category_id int references categories(id),
  name text not null,
  price_min int not null,
  price_max int,  -- for range prices like 160-180
  description text,
  is_available boolean default true,
  is_featured boolean default false,
  created_at timestamptz default now()
);

-- Create orders table
create table orders (
  id serial primary key,
  order_number text unique not null,
  customer_name text not null,
  customer_phone text not null,
  customer_address text,
  order_type text check (order_type in ('delivery', 'pickup')),
  items jsonb not null,
  total_amount int not null,
  payment_status text default 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  order_status text default 'pending' check (order_status in ('pending','confirmed','preparing','ready','delivered','cancelled')),
  notes text,
  created_at timestamptz default now()
);

-- Enable Row Level Security (optional, or disable it for testing)
-- For a simple project, you can disable RLS for these tables to allow anonymous reads/writes,
-- or run the following permissive policies to allow all operations:
alter table categories enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;

create policy "Allow public read/write categories" on categories for all using (true) with check (true);
create policy "Allow public read/write menu_items" on menu_items for all using (true) with check (true);
create policy "Allow public read/write orders" on orders for all using (true) with check (true);

-- Enable Realtime for menu_items and orders
alter publish publication supabase_realtime add table menu_items;
alter publish publication supabase_realtime add table orders;
alter publish publication supabase_realtime add table categories;
