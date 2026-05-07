import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Allow requests from the deployed site and local dev only.
// SITE_URL should be set in your Supabase Edge Function secrets, e.g.:
//   https://m-lakshaya.github.io
const ALLOWED_ORIGIN = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Create an admin client using the service_role key (safe — runs server-side)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 2. Verify the calling user is authenticated and is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    // 3. Check the caller's profile_type is SYSTEM_ADMIN
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('profile_type, org_id')
      .eq('id', user.id)
      .single();

    if (profileError || callerProfile?.profile_type !== 'SYSTEM_ADMIN') {
      throw new Error('Only system administrators can invite users.');
    }

    // 4. Parse the request body
    const { email, first_name, last_name, role_id } = await req.json();

    if (!email || !first_name || !role_id) {
      throw new Error('Missing required fields: email, first_name, role_id');
    }

    // 5. Invite the user via Supabase Auth — this sends the email
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.toLowerCase().trim(),
      {
        data: {
          first_name,
          last_name: last_name || '',
          role_id,
          org_id: callerProfile.org_id,
        },
        redirectTo: `${req.headers.get('origin') ?? Deno.env.get('SITE_URL')}/reset-password`,
      }
    );

    if (inviteError) throw inviteError;

    return new Response(
      JSON.stringify({ success: true, user_id: inviteData.user?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
