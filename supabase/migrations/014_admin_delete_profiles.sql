-- Allow admins to delete profiles
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE
  USING (is_admin());
