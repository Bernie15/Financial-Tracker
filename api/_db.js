import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || "https://sthxmafqzgvtukjzcgom.supabase.co",
  process.env.SUPABASE_ANON_KEY || "sb_publishable_95CYByFUg9K9eq1f372i5Q_bejK9ugb"
);

export { supabase };
