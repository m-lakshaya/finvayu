import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useCustomFields
 * Fetches and caches custom field definitions for an org + entity type.
 * entityType: 'lead' | 'customer' | 'task'
 */
export const useCustomFields = (orgId, entityType) => {
  const [fields,  setFields]  = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!orgId || !entityType) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await supabase
        .from('custom_field_definitions')
        .select('*')
        .eq('org_id', orgId)
        .eq('entity_type', entityType)
        .order('sort_order', { ascending: true });
      setFields(data || []);
    } catch (_) {
      setFields([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, entityType]);

  useEffect(() => { fetch(); }, [fetch]);

  return { fields, loading, refetch: fetch };
};

/**
 * saveCustomField — upsert a definition
 */
export const saveCustomFieldDef = async (def) => {
  const { data, error } = await supabase
    .from('custom_field_definitions')
    .upsert(def, { onConflict: 'org_id,entity_type,field_key' })
    .select().single();
  return { data, error };
};

/**
 * deleteCustomFieldDef — remove a definition
 */
export const deleteCustomFieldDef = async (id) => {
  const { error } = await supabase
    .from('custom_field_definitions')
    .delete().eq('id', id);
  return { error };
};
