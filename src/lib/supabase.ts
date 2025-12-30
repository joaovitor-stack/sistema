import { createClient } from '@supabase/supabase-js';

// Essas informações você encontra no painel do Supabase em:
// Project Settings > API
const supabaseUrl = 'https://lciwsmrabmhckpybwpzi.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjaXdzbXJhYm1oY2tweWJ3cHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMTg4NjMsImV4cCI6MjA4MjU5NDg2M30.Y5hoJ-ArJHHtjMrkwHMjuwXS6rVgif4WNjhskOzxWBk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);