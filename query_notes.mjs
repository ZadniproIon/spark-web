import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const code = fs.readFileSync('src/lib/supabase.ts', 'utf8');
const urlMatch = code.match(/url:\s*'([^']+)'/);
const keyMatch = code.match(/anonKey:\s*'([^']+)'/);

if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  const { data, error } = await supabase.from('notes').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Error:', error);
  console.log('Notes:', JSON.stringify(data, null, 2));
}
