import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let _tablesChecked = false;
let _tablesOk = false;

async function checkTables() {
  if (_tablesChecked) return _tablesOk;
  const { error } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
  _tablesOk = !(error?.message?.includes('does not exist') || error?.message?.includes('relation'));
  _tablesChecked = true;
  return _tablesOk;
}

export async function isSupabaseReady() {
  const { error } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
  return !(error?.message?.includes('does not exist') || error?.message?.includes('relation'));
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string) {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export async function upsertProfile(profile: any) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'id' })
      .select()
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function fetchEssays(userId: string) {
  try {
    const { data } = await supabase
      .from('essay_corrections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}

export async function saveEssay(essay: any) {
  try {
    const { error } = await supabase
      .from('essay_corrections')
      .upsert(essay, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteEssaysByUser(userId: string) {
  try {
    const { error } = await supabase.from('essay_corrections').delete().eq('user_id', userId);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchSimulados(userId: string) {
  try {
    const { data } = await supabase
      .from('simulado_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}

export async function saveSimulado(sim: any) {
  try {
    const { error } = await supabase
      .from('simulado_history')
      .insert(sim);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteSimuladosByUser(userId: string) {
  try {
    const { error } = await supabase.from('simulado_history').delete().eq('user_id', userId);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchLogs(userId: string) {
  try {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}

export async function saveLog(log: any) {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .upsert(log, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteLogsByUser(userId: string) {
  try {
    const { error } = await supabase.from('activity_logs').delete().eq('user_id', userId);
    return !error;
  } catch {
    return false;
  }
}

export async function saveLearningProgress(email: string, progress: { chapters?: any[]; xpPoints?: number; wrongAnswers?: any[] }) {
  try {
    const { error } = await supabase
      .from('ApexEnem_progress')
      .upsert(
        { email: email.toLowerCase(), progress, updated_at: new Date().toISOString() },
        { onConflict: 'email' }
      );
    if (error?.message?.includes('relation') || error?.message?.includes('does not exist')) {
      return false;
    }
    return !error;
  } catch {
    return false;
  }
}

export async function fetchLearningProgress(email: string) {
  try {
    const { data, error } = await supabase
      .from('ApexEnem_progress')
      .select('progress')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    if (error?.message?.includes('relation') || error?.message?.includes('does not exist')) {
      return null;
    }
    return data?.progress || null;
  } catch {
    return null;
  }
}
