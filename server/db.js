import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) });

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in the server environment');
}

const projectUrl = SUPABASE_URL.replace(/\/rest\/v1\/?$/, '');
const supabase = createClient(projectUrl, SUPABASE_SERVICE_ROLE_KEY);

export { supabase };