-- Add missing SELECT policy for tenants table
DROP POLICY IF EXISTS "tenants_select" ON public.tenants;
CREATE POLICY "tenants_select" ON public.tenants 
    FOR SELECT 
    USING (id = public.current_user_tenant_id());
