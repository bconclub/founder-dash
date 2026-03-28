/**
 * Delete all test data for specific phone numbers from Supabase.
 * Only touches leads matching these numbers — nothing else.
 */
require('dotenv').config();
require('dotenv').config({ path: '../agent/.env.local', override: false });

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_BCON_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_PHONES = ['9731660933', '9353253817'];

async function deleteTestLeads() {
  for (const phone of TEST_PHONES) {
    console.log(`\n── Deleting data for ${phone} ──`);

    // Find lead IDs for this phone
    const { data: leads } = await supabase
      .from('all_leads')
      .select('id, customer_name')
      .or(`customer_phone_normalized.eq.${phone},phone.ilike.%${phone}%`);

    if (!leads || leads.length === 0) {
      console.log(`  No leads found for ${phone}`);
      continue;
    }

    for (const lead of leads) {
      const id = lead.id;
      console.log(`  Lead: ${lead.customer_name || 'Unknown'} (${id})`);

      // Delete all associated data
      const tables = [
        'conversations',
        'agent_tasks',
        'voice_sessions',
        'activities',
        'web_sessions',
      ];

      for (const table of tables) {
        const { error, count } = await supabase
          .from(table)
          .delete({ count: 'exact' })
          .eq('lead_id', id);
        if (error) console.log(`    ${table}: error — ${error.message}`);
        else console.log(`    ${table}: deleted ${count ?? '?'} rows`);
      }

      // Delete the lead itself
      const { error: leadErr } = await supabase
        .from('all_leads')
        .delete()
        .eq('id', id);
      if (leadErr) console.log(`  all_leads: error — ${leadErr.message}`);
      else console.log(`  all_leads: deleted`);
    }
  }

  console.log('\nDone.');
}

deleteTestLeads().catch(console.error);
