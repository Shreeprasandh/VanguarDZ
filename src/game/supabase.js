import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sonmafrtldaiymqirmuv.supabase.co';
const supabaseAnonKey = 'sb_publishable_0V2SUUQ-xuuf9yPxAh3bMg_DfaRltt9';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

  // 3. Insert new pilot profile with password
  const { error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: uuid,
      username: normalizedUser,
      password: password,
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

  // 2. Validate password
  if (profile.password && profile.password !== password) {
    throw new Error('The access key entered is incorrect.');
  }

  // 3. If profile exists but didn't have password saved yet, save it now (backward compatibility)
  if (!profile.password) {
    await supabase
      .from('profiles')
      .update({ password: password })
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
