DROP POLICY IF EXISTS "Anyone can insert a lead" ON public.leads;
CREATE POLICY "Anyone can insert a lead"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  name IS NOT NULL
  AND email IS NOT NULL
  AND length(btrim(name)) BETWEEN 1 AND 100
  AND length(btrim(email)) BETWEEN 3 AND 255
  AND email LIKE '%_@_%.__%'
  AND (message IS NULL OR length(message) <= 5000)
  AND (company IS NULL OR length(company) <= 200)
  AND (phone IS NULL OR length(phone) <= 50)
  AND (service IS NULL OR length(service) <= 200)
);
