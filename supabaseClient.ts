import { createClient } from '@supabase/supabase-js';

// --- CONFIGURACIÓN DE SUPABASE (FUXION) ---
// Asegurando conexión al proyecto qfbkkynoymuiqaankdcf
const supabaseUrl = 'https://qfbkkynoymuiqaankdcf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYmtreW5veW11aXFhYW5rZGNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0Nzc5NjIsImV4cCI6MjA3OTA1Mzk2Mn0.bwV51-wKcfl6qMxVB52Gn1mY60ZGM0E7vCGDwybGXEc';

// Variable para verificar configuración
export const isSupabaseConfigured = 
    !supabaseUrl.includes('URL_DE_TU_PROYECTO') && 
    !supabaseAnonKey.includes('TU_CLAVE_PUBLICA');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;