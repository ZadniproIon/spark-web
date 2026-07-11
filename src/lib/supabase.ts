import { createClient } from '@supabase/supabase-js';

export const supabaseConfig = {
  url: 'https://hmwamtchzxeyrvrcjlkb.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhtd2FtdGNoenhleXJ2cmNqbGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNTEzNTMsImV4cCI6MjA4NTYyNzM1M30.QRihEOBI3_VXXlgrn_xUcZJZzQlFI8waFcJO8aJHX-Q',
  voiceBucket: 'voice-notes',
};

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
