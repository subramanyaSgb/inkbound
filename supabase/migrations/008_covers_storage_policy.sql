-- Create the covers storage bucket (if not already created via dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload covers" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'covers' AND (storage.foldername(name))[1] = 'covers' AND (storage.foldername(name))[2] = auth.uid()::text);

-- Allow authenticated users to update/overwrite their own covers
CREATE POLICY "Users can update own covers" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'covers' AND (storage.foldername(name))[2] = auth.uid()::text);

-- Allow anyone to read covers (public bucket)
CREATE POLICY "Public cover access" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'covers');

-- Allow users to delete their own covers
CREATE POLICY "Users can delete own covers" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'covers' AND (storage.foldername(name))[2] = auth.uid()::text);
