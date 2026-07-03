-- Switch has_role from SECURITY DEFINER to SECURITY INVOKER so it runs as the caller.
-- Row-level rules on user_roles still restrict rows to the requesting user, so the result is unchanged.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Anonymous callers need SELECT on user_roles for the invoker-mode function to execute;
-- the existing row-level policy limits visible rows to auth.uid() = user_id, so anon sees nothing.
GRANT SELECT ON public.user_roles TO anon;

-- Replace overly permissive lead-insert policy with a meaningful check.
DROP POLICY IF EXISTS "Anyone can insert a lead" ON public.leads;
CREATE POLICY "Anyone can insert a lead"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  name IS NOT NULL
  AND email IS NOT NULL
  AND length(btrim(name)) > 0
  AND length(btrim(email)) > 0
  AND email LIKE '%_@_%.__%'
);
