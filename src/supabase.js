import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcovvpoitrzyfafbicfu.supabase.co';
const supabasePublishableKey = 'sb_publishable_bdqn0q4G9_TTQz4cdu3v1Q_8xWrovtX';

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);
