import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  "https://sthxmafqzgvtukjzcgom.supabase.co/rest/v1/",
  "sb_secret_CaeF7ncwNgWR40GgjltRNg_6YZIYR5o"
);

export { supabase };