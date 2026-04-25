-- Migration: Add deadline to tasks table
-- Run this script in the Supabase SQL Editor

ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;
