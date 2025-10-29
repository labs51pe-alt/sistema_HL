import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { BmiData } from './types';
import RegistrationForm from './components/RegistrationForm';
import ResultModal from './components/ResultModal';
import HeaderIcon from './components/icons/HeaderIcon';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import { isSupabaseConfigured } from './supabaseClient';
import QuickAccessFab from './components/QuickAccessFab';
import QuickAccessModal from './components/QuickAccessModal';
import PublicWellnessProfilePage from './components/PublicWellnessProfilePage';

// --- Toast Notification System ---
interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface ToastContextType {
  addToast: (message: string, type: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const Toast: React.FC<{ message: ToastMessage; onDismiss: (id: number) => void }> = ({ message, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(message.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  const bgColor = message.type === 'success' ? 'bg-green-600' : 'bg-red-600';

  return (
    <div className={`${bgColor} text-white font-semibold py-3 px-5 rounded-lg shadow-xl mb-3 animate-fade-in-up`}>
      {message.message}
    </div>
  );
};

const ToastContainer: React.FC<{ toasts: ToastMessage[]; dismissToast: (id: number) => void }> = ({ toasts, dismissToast }) => (
  <div className="fixed top-5 right-5 z-[100]">
    {toasts.map(toast => (
      <Toast key={toast.id} message={toast} onDismiss={dismissToast} />
    ))}
  </div>
);
// --- End of Toast System ---

// --- Onboarding Component for Supabase Setup ---
const SupabaseSetupInstructions: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl border-t-8 border-red-500">
                <div className="flex items-center mb-6">
                    <svg className="w-12 h-12 text-red-500 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">¡Acción Requerida!</h1>
                        <p className="text-gray-600">La aplicación necesita conectarse a tu base de datos Supabase.</p>
                    </div>
                </div>

                <div className="space-y-4 text-gray-700">
                    <p>Para continuar, debes configurar tus credenciales de Supabase. Es un paso sencillo y rápido.</p>
                    <p>Abre el siguiente archivo en tu editor de código:</p>
                    <div className="bg-gray-800 text-white font-mono text-sm rounded-lg p-4">
                        <code>supabaseClient.ts</code>
                    </div>
                    <p>
                        Dentro de ese archivo, verás dos constantes que debes reemplazar con tus propias claves. Puedes encontrarlas en tu panel de{' '}
                        <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-green-600 font-semibold hover:underline">
                            Supabase
                        </a> (en la sección <span className="font-semibold">Project Settings &gt; API</span>).
                    </p>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <pre className="text-sm whitespace-pre-wrap">
                            <code className="language-typescript">
                                <span className="text-gray-500">// Reemplaza estas líneas con tus claves reales</span><br />
                                const supabaseUrl = '<span className="text-red-500 font-bold">https://URL_DE_TU_PROYECTO...</span>';<br />
                                const supabaseAnonKey = '<span className="text-red-500 font-bold">TU_CLAVE_PUBLICA_ANONIMA...</span>';
                            </code>
                        </pre>
                    </div>
                    <p className="mt-4">
                        Una vez que guardes los cambios en el archivo, <strong>esta página se recargará automáticamente</strong> y podrás comenzar a usar la aplicación.
                    </p>
                </div>
            </div>
        </div>
    );
};
// --- End of Onboarding Component ---

const App: React.FC = () => {
  const [result, setResult] = useState<BmiData | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isQuickAccessOpen, setQuickAccessOpen] = useState(false);
  
  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // --- NEW: Configuration Check ---
  if (!isSupabaseConfigured) {
      return <SupabaseSetupInstructions />;
  }
  // --- End of New Check ---

  useEffect(() => {
    // Revisa sessionStorage para ver si el admin ya había iniciado sesión
    const loggedIn = sessionStorage.getItem('isAdminLoggedIn') === 'true';
    setIsAdminLoggedIn(loggedIn);
    setLoading(false);
  }, []);

  const handleAdminLogin = () => {
    sessionStorage.setItem('isAdminLoggedIn', 'true');
    setIsAdminLoggedIn(true);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('isAdminLoggedIn');
    setIsAdminLoggedIn(false);
  };

  const handleSuccess = (data: BmiData) => {
    setResult(data);
  };

  const handleCloseModal = () => {
    setResult(null);
  };

  const renderContent = () => {
    if (loading) {
      return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
    }

    const path = window.location.pathname;
    const profileMatch = path.match(/^\/perfil-bienestar\/(\d+)$/);

    if (profileMatch) {
        const userId = parseInt(profileMatch[1], 10);
        return <PublicWellnessProfilePage userId={userId} />;
    }
    
    if (path === '/admin') {
      if (isAdminLoggedIn) {
        return <AdminDashboard onLogout={handleAdminLogout} />;
      } else {
        return <Login onLoginSuccess={handleAdminLogin} />;
      }
    }

    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center font-sans p-4">
        <header className="mb-8 text-center w-full max-w-md">
          <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-lg mb-4">
              <HeaderIcon />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
              ¡Transforma Tu Vida!
          </h1>
        </header>
        <main className="w-full flex justify-center">
           <RegistrationForm onSuccess={handleSuccess} />
           {result && <ResultModal data={result} onClose={handleCloseModal} />}
        </main>
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>"Hoy es tu oportunidad de construir el mañana que quieres."</p>
          <a href="/admin" className="text-gray-400 hover:text-gray-600 text-xs mt-2 block">Admin Panel</a>
        </footer>
        <QuickAccessFab onClick={() => setQuickAccessOpen(true)} />
        {isQuickAccessOpen && <QuickAccessModal onClose={() => setQuickAccessOpen(false)} />}
      </div>
    );
  };

  return (
     <ToastContext.Provider value={{ addToast }}>
        <ToastContainer toasts={toasts} dismissToast={dismissToast} />
        {renderContent()}
        <style>{`
            @keyframes fade-in-up {
                0% {
                    opacity: 0;
                    transform: translateY(20px) scale(0.95);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            .animate-fade-in-up {
                animation: fade-in-up 0.4s ease-out forwards;
            }
        `}</style>
    </ToastContext.Provider>
  );
};

export default App;