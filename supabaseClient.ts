import { createClient } from '@supabase/supabase-js';

// --- ACCIÓN REQUERIDA PARA LA CONFIGURACIÓN ---
// Para que la aplicación funcione, necesitas añadir tus claves de Supabase aquí.
//
// 1. Ve a tu panel de Supabase: https://app.supabase.com
// 2. Abre tu proyecto y ve a "Project Settings" (icono de engranaje).
// 3. Haz clic en "API".
// 4. Copia la "Project URL" y pégala en `supabaseUrl`.
// 5. Copia la "Project API Key" (la que dice 'anon' y 'public') y pégala en `supabaseAnonKey`.

const supabaseUrl = 'https://wszxpxpkyugnslsmehoq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzenhweHBreXVnbnNsc21laG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MDgyOTIsImV4cCI6MjA3NjI4NDI5Mn0.UOlFGO8QejAbU-T-oGj_6_ovqxe5_PkPc8Em5pwaGfw';

// --- Fin de la sección de configuración ---

// Esta variable revisa si has actualizado las claves.
// Si es 'false', la aplicación mostrará una pantalla de instrucciones.
export const isSupabaseConfigured = 
    !supabaseUrl.includes('URL_DE_TU_PROYECTO_SUPABASE') && 
    !supabaseAnonKey.includes('TU_CLAVE_PUBLICA_ANONIMA_DE_SUPABASE');


// Aunque las claves no estén, inicializamos el cliente.
// La lógica en App.tsx evitará que se use si no está configurado.
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;