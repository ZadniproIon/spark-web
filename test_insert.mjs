import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const code = fs.readFileSync('src/lib/supabase.ts', 'utf8');
const urlMatch = code.match(/url:\s*'([^']+)'/);
const keyMatch = code.match(/anonKey:\s*'([^']+)'/);

if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  
  // Create a dummy user
  const email = `test_${Date.now()}@example.com`;
  const password = 'password123';
  console.log('Signing up', email);
  
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) {
    console.error('Signup error:', authError);
    process.exit(1);
  }
  
  const user = authData.user;
  console.log('User created:', user.id);
  
  const note = {
    id: crypto.randomUUID(),
    type: 'text',
    content: 'test note from script',
    audio_url: null,
    owner_id: user.id,
    created_at: '2026-08-04T12:00:00.000',
    updated_at: '2026-08-04T12:00:00.000',
    created_at_local: '2026-08-04T12:00:00.000',
    updated_at_local: '2026-08-04T12:00:00.000',
    is_pinned: false,
    is_trashed: false,
    trashed_at: null
  };
  
  console.log('Upserting note...');
  const { data: noteData, error: noteError } = await supabase.from('notes').upsert(note);
  
  if (noteError) {
    console.error('Upsert error:', noteError);
  } else {
    console.log('Upsert success!', noteData);
  }
}
