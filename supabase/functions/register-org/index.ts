import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * register-org Edge Function
 *
 * Called from the public /signup page to atomically:
 *   1. Create a new organization row
 *   2. Sign up the user with Supabase Auth, passing org_id in metadata
 *      so the on_auth_user_created trigger wires them together
 *   3. Elevate the founding user to SYSTEM_ADMIN / CEO
 *
 * This runs server-side with the service_role key so we can:
 *   - Insert into organizations without an existing auth session
 *   - Set profile_type = SYSTEM_ADMIN for the org owner
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { email, password, first_name, last_name, org_name } = await req.json();

    if (!email || !password || !first_name || !org_name) {
      throw new Error('Missing required fields: email, password, first_name, org_name');
    }

    // 1. Create the organization first
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert([{ name: org_name.trim() }])
      .select('id')
      .single();

    if (orgError) throw orgError;
    const org_id = orgData.id;

    // 2. Sign up the user, passing org_id in metadata for the trigger
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: false, // sends confirmation email
      user_metadata: {
        first_name: first_name.trim(),
        last_name: (last_name || '').trim(),
        full_name: `${first_name.trim()} ${(last_name || '').trim()}`.trim(),
        org_id,
        role_id: 'ceo',
      },
    });

    if (authError) {
      // Roll back org creation if user creation fails
      await supabaseAdmin.from('organizations').delete().eq('id', org_id);
      throw authError;
    }

    const userId = authData.user.id;

    // 3. Elevate the profile to SYSTEM_ADMIN + CEO (trigger may have already inserted it)
    //    Use upsert to handle both cases gracefully
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        org_id,
        email: email.toLowerCase().trim(),
        first_name: first_name.trim(),
        last_name: (last_name || '').trim(),
        full_name: `${first_name.trim()} ${(last_name || '').trim()}`.trim(),
        role_id: 'ceo',
        profile_type: 'SYSTEM_ADMIN',
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile upsert error (non-fatal):', profileError.message);
    }

    // 4. Link the org owner_id back to the organization
    await supabaseAdmin
      .from('organizations')
      .update({ owner_id: userId })
      .eq('id', org_id);

    return new Response(
      JSON.stringify({ success: true, message: 'Account created. Please check your email to verify.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
