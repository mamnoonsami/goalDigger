-- =====================================================
-- Goal Digger — Dynamic Tenant E-Transfer Emails Migration
-- =====================================================

-- 1. Add etransfer_email column to public.tenants if not exists
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS etransfer_email TEXT DEFAULT 'mamnoon909@gmail.com';

-- Update existing records to default email if NULL
UPDATE public.tenants SET etransfer_email = 'mamnoon909@gmail.com' WHERE etransfer_email IS NULL;

-- 2. Create tenant_etransfer_emails table for storing group-managed e-transfer emails
CREATE TABLE IF NOT EXISTS public.tenant_etransfer_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT unique_tenant_email UNIQUE (tenant_id, email)
);

-- Set default tenant_id for inserts
ALTER TABLE public.tenant_etransfer_emails ALTER COLUMN tenant_id SET DEFAULT public.current_user_tenant_id();

-- Enable RLS on tenant_etransfer_emails
ALTER TABLE public.tenant_etransfer_emails ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security Policies for tenant_etransfer_emails
DROP POLICY IF EXISTS "tenant_emails_select" ON public.tenant_etransfer_emails;
DROP POLICY IF EXISTS "tenant_emails_insert" ON public.tenant_etransfer_emails;
DROP POLICY IF EXISTS "tenant_emails_delete" ON public.tenant_etransfer_emails;

-- SELECT: Users can only see e-transfer emails belonging to their tenant
CREATE POLICY "tenant_emails_select" ON public.tenant_etransfer_emails 
    FOR SELECT 
    USING (tenant_id = public.current_user_tenant_id());

-- INSERT: Admins and Kings can insert e-transfer emails for their tenant
CREATE POLICY "tenant_emails_insert" ON public.tenant_etransfer_emails 
    FOR INSERT 
    WITH CHECK (
        tenant_id = public.current_user_tenant_id() 
        AND (public.is_admin() OR public.is_king())
    );

-- DELETE: Admins and Kings can delete e-transfer emails for their tenant
CREATE POLICY "tenant_emails_delete" ON public.tenant_etransfer_emails 
    FOR DELETE 
    USING (
        tenant_id = public.current_user_tenant_id() 
        AND (public.is_admin() OR public.is_king())
    );

-- 4. Seed default email into tenant_etransfer_emails for all existing tenants
INSERT INTO public.tenant_etransfer_emails (tenant_id, email)
SELECT id, 'mamnoon909@gmail.com' FROM public.tenants
ON CONFLICT (tenant_id, email) DO NOTHING;
