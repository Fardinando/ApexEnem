import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return data;
}

export async function upsertProfile(profile: any) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchEssays(userId: string) {
  const { data } = await supabase
    .from('essay_corrections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function saveEssay(essay: any) {
  const { error } = await supabase
    .from('essay_corrections')
    .upsert(essay, { onConflict: 'id' });
  if (error) throw error;
}

export async function fetchSimulados(userId: string) {
  const { data } = await supabase
    .from('simulado_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function saveSimulado(sim: any) {
  const { error } = await supabase
    .from('simulado_history')
    .insert(sim);
  if (error) throw error;
}

export async function fetchLogs(userId: string) {
  const { data } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function saveLog(log: any) {
  const { error } = await supabase
    .from('activity_logs')
    .upsert(log, { onConflict: 'id' });
  if (error) throw error;
}

export async function saveLearningProgress(email: string, progress: { chapters?: any[]; xpPoints?: number; wrongAnswers?: any[] }) {
  const { error } = await supabase
    .from('ApexEnem_progress')
    .upsert(
      { email: email.toLowerCase(), progress, updated_at: new Date().toISOString() },
      { onConflict: 'email' }
    );
  if (error) throw error;
}

export async function fetchLearningProgress(email: string) {
  const { data, error } = await supabase
    .from('ApexEnem_progress')
    .select('progress')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data?.progress || null;
}
