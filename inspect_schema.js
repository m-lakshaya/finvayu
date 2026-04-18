import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try to find .env file
const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.existsSync(envLocalPath) ? envLocalPath : (fs.existsSync(envPath) ? envPath : null);

if (envFile) {
  dotenv.config({ path: envFile });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectSchema() {
  console.log('Inspecting leads table...');
  const { data: leads, error: leadsError } = await supabase.from('leads').select('*').limit(1);
  if (leadsError) {
    console.error('Error fetching lead:', leadsError.message);
  } else if (leads && leads.length > 0) {
    console.log('Lead columns:', Object.keys(leads[0]));
  } else {
    console.log('No leads found to inspect columns.');
  }

  console.log('\nInspecting customers table...');
  const { data: customers, error: customersError } = await supabase.from('customers').select('*').limit(1);
  if (customersError) {
    console.error('Error fetching customer:', customersError.message);
  } else if (customers && customers.length > 0) {
    console.log('Customer columns:', Object.keys(customers[0]));
  } else {
    console.log('No customers found to inspect columns.');
  }

  console.log('\nInspecting profiles (for executives)...');
  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*').limit(1);
  if (profilesError) {
    console.error('Error fetching profile:', profilesError.message);
  } else if (profiles && profiles.length > 0) {
    console.log('Profile columns:', Object.keys(profiles[0]));
  }
}

inspectSchema();
