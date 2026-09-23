import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL)
  || 'https://sonmafrtldaiymqirmuv.supabase.co';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY)
  || 'sb_publishable_0V2SUUQ-xuuf9yPxAh3bMg_DfaRltt9';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Derives a salted SHA-256 hash for pilot passwords using the Web Crypto API
 */
export async function hashPassword(username, password) {
  if (!password) return '';
  const normalizedUser = username.trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(`vanguardz:${normalizedUser}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function registerPilot(username, password) {
  const normalizedUser = username.trim().toLowerCase();
  
  if (!supabase) {
    throw new Error('Connection to the server failed. Please check your network connection.');
  }

  // 1. Check if username already exists
  const { data: existingUser, error: checkError } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', normalizedUser)
    .maybeSingle();

  if (checkError) {
    throw new Error('Failed to verify callsign availability: ' + checkError.message);
  }

  if (existingUser) {
    throw new Error('Callsign already registered. Choose a different callsign.');
  }

  // 2. Generate UUID client-side for the ID column
  const uuid = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });

  const hashedPassword = await hashPassword(normalizedUser, password);

  // 3. Insert new pilot profile with salted hash
  const { error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: uuid,
      username: normalizedUser,
      password: hashedPassword,
      max_unlocked_checkpoint: 0
    });

  if (insertError) {
    throw new Error('Registration failed: ' + insertError.message);
  }

  return { username: normalizedUser, maxCheckpoint: 0 };
}

export async function loginPilot(username, password) {
  const normalizedUser = username.trim().toLowerCase();
  
  if (!supabase) {
    throw new Error('Connection to the server failed. Please check your network connection.');
  }

  // 1. Retrieve profile matching username
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('username, password, max_unlocked_checkpoint')
    .eq('username', normalizedUser)
    .maybeSingle();

  if (fetchError) {
    throw new Error('Authentication failed: ' + fetchError.message);
  }

  if (!profile) {
    throw new Error('The entered callsign does not match any active pilot profiles.');
  }

  const hashedPassword = await hashPassword(normalizedUser, password);

  // 2. Validate password (supports both SHA-256 hashed and legacy plain-text entries)
  if (profile.password) {
    const isMatch = profile.password === hashedPassword || profile.password === password;
    if (!isMatch) {
      throw new Error('The access key entered is incorrect.');
    }

    // Auto-migrate legacy plain-text password to salted SHA-256 hash on successful login
    if (profile.password === password) {
      await supabase
        .from('profiles')
        .update({ password: hashedPassword })
        .eq('username', normalizedUser);
    }
  } else {
    // If profile exists without password saved yet, hash and save it now
    await supabase
      .from('profiles')
      .update({ password: hashedPassword })
      .eq('username', normalizedUser);
  }

  return { 
    username: normalizedUser, 
    maxCheckpoint: profile.max_unlocked_checkpoint || 0 
  };
}

export async function saveCheckpoint(username, checkpointLevel) {
  if (!supabase || !username) return;

  const normalizedUser = username.trim().toLowerCase();

  // 1. Fetch current max checkpoint from DB
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('max_unlocked_checkpoint')
    .eq('username', normalizedUser)
    .maybeSingle();

  if (fetchError || !profile) return;

  const currentMax = profile.max_unlocked_checkpoint || 0;

  // 2. Update if new level is higher
  if (checkpointLevel > currentMax) {
    await supabase
      .from('profiles')
      .update({ max_unlocked_checkpoint: checkpointLevel })
      .eq('username', normalizedUser);
  }
}

export async function saveHighScore(username, score) {
  if (!supabase || !username) return;

  const normalizedUser = username.trim().toLowerCase();

  try {
    // 1. Fetch current high score from profiles table
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('high_score')
      .eq('username', normalizedUser)
      .maybeSingle();

    if (fetchError || !profile) return;

    const currentHighScore = profile.high_score || 0;

    // 2. Update if new score is higher
    if (score > currentHighScore) {
      await supabase
        .from('profiles')
        .update({ high_score: score })
        .eq('username', normalizedUser);
    }
  } catch (err) {
    console.error('Supabase saveHighScore error:', err);
  }
}

export async function submitFeedback(username, feedbackText) {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const { error } = await supabase
    .from('feedbacks')
    .insert({
      username: username ? username.trim() : 'anonymous',
      feedback: feedbackText
    });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getLeaderboard() {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('username, high_score')
    .not('high_score', 'is', null)
    .order('high_score', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Supabase getLeaderboard error:', error);
    return [];
  }

  return data.map(p => ({
    username: p.username,
    score: p.high_score || 0
  }));
}
