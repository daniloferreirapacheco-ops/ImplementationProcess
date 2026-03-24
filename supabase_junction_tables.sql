-- ============================================================
-- Junction tables: link customers to machine/product catalogs
-- Run this in Supabase SQL Editor
-- ============================================================

-- Account <-> Machines (many-to-many)
CREATE TABLE IF NOT EXISTS account_machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(account_id, machine_id)
);

ALTER TABLE account_machines ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'account_machines_all_authenticated' AND tablename = 'account_machines') THEN
    CREATE POLICY account_machines_all_authenticated ON account_machines FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Account <-> Products (many-to-many)
CREATE TABLE IF NOT EXISTS account_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(account_id, product_id)
);

ALTER TABLE account_products ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'account_products_all_authenticated' AND tablename = 'account_products') THEN
    CREATE POLICY account_products_all_authenticated ON account_products FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Make machines/products account_id optional (catalog items don't need one)
ALTER TABLE machines ALTER COLUMN account_id DROP NOT NULL;
ALTER TABLE products ALTER COLUMN account_id DROP NOT NULL;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
