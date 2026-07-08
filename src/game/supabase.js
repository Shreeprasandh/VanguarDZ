import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.warn("Vanguardz WARNING: Supabase keys not loaded. Configure your .env file and restart your Vite server.");
} else {
  console.info("Vanguardz INFO: Connected to Supabase security service.");
}

export async function registerPilot(username, password) {
  const normalizedUser = username.trim().toLowerCase();
  
  if (!supabase) {
    throw new Error('Supabase configuration is missing. Please restart your Vite dev server to load your .env settings.');
  }

  const email = `${normalizedUser}@vanguardz.local`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;

  const user = authData.user;
  if (!user) throw new Error('Registration failed');

  // Insert profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      username: username,
      max_unlocked_checkpoint: 0
    });

  if (profileError) {
    console.error('Profile registration write error:', profileError);
  }

  return { username, maxCheckpoint: 0 };
}

export async function loginPilot(username, password) {
  const normalizedUser = username.trim().toLowerCase();
  
  if (!supabase) {
    throw new Error('Supabase configuration is missing. Please restart your Vite dev server to load your .env settings.');
  }

  const email = `${normalizedUser}@vanguardz.local`;
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) throw authError;

  // Retrieve profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('max_unlocked_checkpoint')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    console.error('Error fetching profile checkpoint:', profileError);
    return { username, maxCheckpoint: 0 };
  }

  return { 
    username, 
    maxCheckpoint: profileData ? profileData.max_unlocked_checkpoint : 0 
  };
}

export async function saveCheckpoint(username, checkpointLevel) {
  if (!supabase) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('max_unlocked_checkpoint')
    .eq('id', user.id)
    .single();

  const currentMax = profile ? profile.max_unlocked_checkpoint : 0;

  if (checkpointLevel > currentMax) {
    await supabase
      .from('profiles')
      .update({ max_unlocked_checkpoint: checkpointLevel })
      .eq('id', user.id);
  }
}
