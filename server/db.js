import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  "https://sthxmafqzgvtukjzcgom.supabase.co",
  "sb_publishable_95CYByFUg9K9eq1f372i5Q_bejK9ugb"
);

export { supabase };