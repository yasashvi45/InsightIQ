import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || '';

let client: SupabaseClient<any, "public", any> | null = null;

if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
  try {
    client = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
} else if (supabaseUrl || supabaseKey) {
  console.warn('Supabase URL or Key is invalid or missing. Ensure SUPABASE_URL starts with http:// or https://');
}

export const supabase = client;
