import { createClient } from '@supabase/supabase-js';
import { SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY } from '../config';

export const supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY);


