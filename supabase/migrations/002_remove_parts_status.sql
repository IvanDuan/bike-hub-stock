-- Remove deprecated "parts" status (run if 001_initial.sql was applied with parts)
update public.bikes set status = 'sold' where status = 'parts';
