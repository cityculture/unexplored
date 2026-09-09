const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kvhjzpqkzydvjwdtqswr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2aGp6cHFrenlkdmp3ZHRxc3dyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzEyNTY1NCwiZXhwIjoyMDg4NzAxNjU0fQ.6R61ojV93hNuMXpcqxxyWxNlCjdjZ_PiPBpfc0md-g4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: hostPages, error } = await supabase.from('host_pages').select('id, user_id, display_name, organisation_name, slug, is_approved');
  console.log('ALL HOST PAGES:');
  console.table(hostPages);
}

main().catch(console.error);
