import React, { useState } from 'react';
import HeaderIcon from './icons/HeaderIcon';
import supabase from '../supabaseClient';
import { useToast } from '../App';
import LoadingSpinner from './LoadingSpinner';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            addToast(error.message, 'error');
        } 
        // Si el login es exitoso, el onAuthStateChange en App.tsx se encargará
        // de actualizar el estado y mostrar el Dashboard.
        
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center font-sans p-4">
            <header className="mb-8 text-center w-full max-w-xs">
                <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-lg mb-4">
                    <HeaderIcon />
                </div>
                <h1 className="text-3xl font-bold text-gray-800">
                    Acceso de Administrador
                </h1>
            </header>
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-xs">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                     <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300 flex items-center justify-center disabled:bg-gray-400"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Ingresar'}
                    </button>
                </form>
            </div>
             <footer className="mt-8 text-center text-gray-500 text-sm">
                <a href="/" className="text-gray-500 hover:text-gray-800">&larr; Volver al sitio principal</a>
            </footer>
        </div>
    );
};

export default Login;