import { supabase } from './supabase';

async function postTrack(payload: { kind: 'essay' | 'lesson' | 'video_minutes' | 'xp'; value: number }) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    await fetch('/api/salas/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(payload),
    }).catch(() => { /* silencioso: tracking não bloqueia experiência */ });
  } catch { /* noop */ }
}

export function trackEssayScore(score: number) { return postTrack({ kind: 'essay', value: Math.max(0, Math.round(score)) }); }
export function trackLessonCompleted(count = 1) { return postTrack({ kind: 'lesson', value: count }); }
export function trackVideoMinutes(minutes: number) { return postTrack({ kind: 'video_minutes', value: Math.max(0, Math.round(minutes)) }); }
export function trackXpWeekly(xp: number) { return postTrack({ kind: 'xp', value: Math.max(0, Math.round(xp)) }); }
