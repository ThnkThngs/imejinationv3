
ALTER TABLE public.portfolio ADD COLUMN IF NOT EXISTS media jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Public read of the portfolio bucket
DROP POLICY IF EXISTS "Portfolio bucket public read" ON storage.objects;
CREATE POLICY "Portfolio bucket public read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'portfolio');

-- Admin-only writes
DROP POLICY IF EXISTS "Portfolio bucket admin insert" ON storage.objects;
CREATE POLICY "Portfolio bucket admin insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'portfolio' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Portfolio bucket admin update" ON storage.objects;
CREATE POLICY "Portfolio bucket admin update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'portfolio' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'portfolio' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Portfolio bucket admin delete" ON storage.objects;
CREATE POLICY "Portfolio bucket admin delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'portfolio' AND public.has_role(auth.uid(), 'admin'));
