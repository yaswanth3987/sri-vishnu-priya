-- ====================================================================
-- SUPABASE SCHEMA FOR SRI VISHNU PRIYA POS & BILLING SYSTEM
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. Main POS Sync Store (Guarantees instant, full-state backup & live sync)
CREATE TABLE IF NOT EXISTS public.pos_sync_store (
  id TEXT PRIMARY KEY,
  products JSONB DEFAULT '[]'::jsonb,
  customers JSONB DEFAULT '[]'::jsonb,
  sales JSONB DEFAULT '[]'::jsonb,
  purchases JSONB DEFAULT '[]'::jsonb,
  users JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS & Allow public access for anon key (POS system)
ALTER TABLE public.pos_sync_store ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon full access to pos_sync_store" ON public.pos_sync_store;
CREATE POLICY "Allow anon full access to pos_sync_store"
  ON public.pos_sync_store
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Stationery',
  stock NUMERIC DEFAULT 0,
  price NUMERIC NOT NULL,
  cost NUMERIC,
  supplier TEXT DEFAULT '',
  gst NUMERIC DEFAULT 18,
  barcode TEXT DEFAULT '',
  isbn TEXT DEFAULT '',
  author TEXT DEFAULT '',
  publisher TEXT DEFAULT '',
  class_std TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon full access to products" ON public.products;
CREATE POLICY "Allow anon full access to products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- 3. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'Retail',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  company TEXT DEFAULT '',
  gstin TEXT DEFAULT '',
  customer_code TEXT DEFAULT '',
  total NUMERIC DEFAULT 0,
  visits INTEGER DEFAULT 0,
  last_visit TEXT DEFAULT '',
  due_amount NUMERIC DEFAULT 0,
  credit_limit NUMERIC DEFAULT 0,
  khata JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon full access to customers" ON public.customers;
CREATE POLICY "Allow anon full access to customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

-- 4. Sales / Invoices Table
CREATE TABLE IF NOT EXISTS public.sales (
  id BIGINT PRIMARY KEY,
  bill_number INTEGER,
  bill_date DATE,
  bill_type TEXT DEFAULT 'Tax Invoice',
  customer TEXT DEFAULT 'Walk-in',
  customer_type TEXT DEFAULT 'Retail',
  customer_company TEXT DEFAULT '',
  billing_company TEXT DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  payment_method TEXT DEFAULT 'Cash',
  subtotal NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  paid_amount NUMERIC DEFAULT 0,
  change NUMERIC DEFAULT 0,
  cashier TEXT DEFAULT 'Admin',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon full access to sales" ON public.sales;
CREATE POLICY "Allow anon full access to sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);

-- 5. Purchases Table
CREATE TABLE IF NOT EXISTS public.purchases (
  id TEXT PRIMARY KEY,
  supplier TEXT NOT NULL,
  date DATE NOT NULL,
  items INTEGER DEFAULT 1,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'Received',
  bill_file TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon full access to purchases" ON public.purchases;
CREATE POLICY "Allow anon full access to purchases" ON public.purchases FOR ALL USING (true) WITH CHECK (true);

-- 6. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
  id BIGINT PRIMARY KEY DEFAULT 1,
  shop_name TEXT DEFAULT 'Sri Vishnu Priya Fancy And General Stores',
  shop_subtitle TEXT DEFAULT '& Book Store',
  gst_in TEXT DEFAULT '27AABCU9603R1ZX',
  phone TEXT DEFAULT '9876543210',
  address TEXT DEFAULT 'Shop No. 12, MG Road, Pune - 411001',
  default_gst_on BOOLEAN DEFAULT true,
  default_gst_rate NUMERIC DEFAULT 18,
  company_list JSONB DEFAULT '[]'::jsonb,
  customer_types JSONB DEFAULT '["School","College","Bank","Office","Company","Government","Retail Customer","Khata Customer"]'::jsonb,
  tab_portal_options JSONB DEFAULT '{}'::jsonb,
  receipt_settings JSONB DEFAULT '{}'::jsonb,
  printer_type TEXT DEFAULT 'Thermal (80mm)',
  admin_password TEXT DEFAULT 'shopease123',
  logo TEXT DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon full access to settings" ON public.settings;
CREATE POLICY "Allow anon full access to settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
