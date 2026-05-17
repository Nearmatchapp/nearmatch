-- Avatars bucket policy
create policy "Avatar képek nyilvánosan láthatók"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Saját avatar feltöltése"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

create policy "Saját avatar felülírása"
  on storage.objects for update
  using ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );
