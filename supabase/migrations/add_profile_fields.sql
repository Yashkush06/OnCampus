-- This migration adds the new fields to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS snapchat TEXT;
