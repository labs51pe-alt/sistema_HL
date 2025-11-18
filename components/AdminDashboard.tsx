
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import supabase from '../supabaseClient';
import { BmiData } from '../types';
import UserCard from './UserCard';
import AddUserForm from './AddUserForm';
import DashboardMetrics from './DashboardMetrics';
import { PlusIcon } from './icons/FabIcon';
import HerbalifeLogo from './icons/HerbalifeLogo';
import { useToast } from '../App';

// Se añaden las props para manejar el logout
interface AdminDashboardProps {
    onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
    const [registrations, setRegistrations] = useState<BmiData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddUserFormOpen, setIsAddUserFormOpen] = useState(false);
    
    // Filtros
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [crmMode, setCrmMode] = useState(false); // Toggle for CRM sorting
    
    const { addToast } = useToast();

    // Debug info
    const TABLE_NAME = 'fuxion_registros';

    const handleLogout = () => {
        onLogout();
        addToast('Sesión cerrada correctamente.', 'success');
    };

    const priorityMap: { [key: string]: number } = {
        'obesidad clase iii': 5,
        'obesidad clase ii': 4,
        'obesidad clase i': 3,
        'obesidad': 3,
        'sobrepeso': 2,
        'bajo peso': 1,
        'peso normal': 0,
    };

    const getPriority = (category: string | undefined | null) => {
        if (!category) return -1;
        const lowerCaseCategory = category.toLowerCase();
        for (const key in priorityMap) {
            if (lowerCaseCategory.includes(key)) {
                return priorityMap[key];
            }
        }
        return -1;
    };

    const fetchRegistrations = useCallback(async () => {
        setIsLoading(true);
        // Explicitly fetching from the NEW table: fuxion_registros
        const { data, error } = await supabase
            .from('fuxion_registros')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching registrations:', error);
            addToast(`Error conectando a ${TABLE_NAME}: ${error.message}`, 'error');
            setRegistrations([]);
        } else if (data) {
            // Default sort by BMI priority initially
            const sortedData = data.sort((a, b) => getPriority(b.categoria) - getPriority(a.categoria));
            setRegistrations(sortedData as BmiData[]);
        } else {
            setRegistrations([]);
        }
        setIsLoading(false);
    }, [addToast]);

    useEffect(() => {
        fetchRegistrations();
    }, [fetchRegistrations]);

    const handleAddUserSuccess = () => {
        setIsAddUserFormOpen(false);
        addToast('Participante registrado con éxito.', 'success');
        fetchRegistrations();
    };

    const handleDeleteRegistration = async (id: number) => {
        const { error } = await supabase
            .from('fuxion_registros')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting registration:', error);
            addToast('Error al eliminar el registro.', 'error');
        } else {
            addToast('Registro eliminado correctamente.', 'success');
            setRegistrations(prev => prev.filter(reg => reg.id !== id));
        }
    };

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        const { data, error } = await supabase
            .from('fuxion_registros')
            .update({ estado: newStatus })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating status:', error);
            addToast('Error al actualizar el estado.', 'error');
        } else if (data) {
            addToast('Estado actualizado.', 'success');
            setRegistrations(prev => 
                prev.map(reg => (reg.id === id ? { ...reg, estado: data.estado } : reg))
            );
        }
    };

    const handleUpdateNotes = async (id: number, newNotes: string) => {
        const { data, error } = await supabase
            .from('fuxion_registros')
            .update({ notas: newNotes })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating notes:', error);
            addToast('Error al actualizar las notas.', 'error');
        } else if (data) {
            addToast('Notas guardadas.', 'success');
            setRegistrations(prev => 
                prev.map(reg => (reg.id === id ? { ...reg, notas: data.notas } : reg))
            );
        }
    };

    const uniqueCategories = useMemo(() => {
        if (!registrations) return ['all'];
        return ['all', ...Array.from(new Set(registrations.map(r => r.categoria || 'Sin Categoría')))];
    }, [registrations]);

    const filteredRegistrations = useMemo(() => {
        if (!registrations) return [];
        const today = new Date().toISOString().slice(0, 10);

        let result = registrations.filter(reg => {
            const statusFilterMatch = (() => {
                if (activeFilter === 'all') return true;
                switch (activeFilter) {
                    case 'today':
                        return reg.created_at?.slice(0, 10) === today;
                    case 'pending':
                        return reg.estado === 'Evaluación Agendada';
                    case 'active':
                        return reg.estado === 'En Acompañamiento';
                    default:
                        return true;
                }
            })();
            const searchFilterMatch = searchTerm
                ? reg.nombre.toLowerCase().includes(searchTerm.toLowerCase())
                : true;
            const categoryFilterMatch = categoryFilter !== 'all'
                ? (reg.categoria || 'Sin Categoría') === categoryFilter
                : true;
            return statusFilterMatch && searchFilterMatch && categoryFilterMatch;
        });

        // CRM Sorting Logic: Risk First
        if (crmMode) {
            result = result.sort((a, b) => {
                const getDays = (dateStr?: string) => {
                    if (!dateStr) return 999;
                    return Math.abs(new Date().getTime() - new Date(dateStr).getTime());
                };
                // Descending order of days since contact (Highest gap = Higher risk = Top)
                return getDays(b.last_interaction) - getDays(a.last_interaction);
            });
        }

        return result;

    }, [registrations, activeFilter, searchTerm, categoryFilter, crmMode]);


    return (
        <div className="min-h-screen bg-gray-100 font-sans p-4 md:p-8">
            <header className="mb-8 max-w-4xl mx-auto">
                <div className="flex justify-between items-center">
                    <button onClick={onLogout} className="text-gray-500 hover:text-gray-800">&larr; Volver</button>
                    <div className="flex gap-3">
                        <button 
                            onClick={fetchRegistrations}
                            className="bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-300 text-sm flex items-center"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            Recargar BD
                        </button>
                        <button 
                            onClick={handleLogout}
                            className="bg-red-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-600 transition-colors duration-300 text-sm"
                        >
                            Salir
                        </button>
                    </div>
                </div>
                <div className="mt-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                    <div className="w-20 md:w-24">
                         <HerbalifeLogo className="w-full h-auto" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Panel</h1>
                    </div>
                </div>
            </header>
            <main className="max-w-4xl mx-auto pb-12">
                <DashboardMetrics 
                    registrations={registrations} 
                    onFilterChange={setActiveFilter}
                    activeFilter={activeFilter}
                />

                <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-700">Filtros & CRM</h3>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <span className={`text-xs font-bold uppercase ${crmMode ? 'text-red-500' : 'text-gray-400'}`}>
                                {crmMode ? 'Orden: Prioridad Seguimiento (CRM)' : 'Orden: Prioridad IMC (Venta)'}
                            </span>
                            <div className="relative">
                                <input type="checkbox" className="sr-only" checked={crmMode} onChange={() => setCrmMode(!crmMode)} />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${crmMode ? 'bg-red-400' : 'bg-gray-300'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${crmMode ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                        >
                            {uniqueCategories.map(category => (
                                <option key={category} value={category}>
                                    {category === 'all' ? 'Todas las categorías' : category}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                
                {isLoading && (
                    <div className="flex justify-center items-center py-16">
                        <svg className="animate-spin w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}
                {!isLoading && (
                    filteredRegistrations.length > 0 ? (
                        <div className="space-y-3">
                            {filteredRegistrations.map((reg) => (
                                <UserCard 
                                    key={reg.id} 
                                    data={reg} 
                                    onDelete={handleDeleteRegistration}
                                    onUpdateStatus={handleUpdateStatus}
                                    onUpdateNotes={handleUpdateNotes}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                            <div className="text-6xl mb-4">📂</div>
                            <h3 className="text-xl font-bold text-gray-800">Base de datos nueva</h3>
                            <p className="text-gray-500 mt-2">
                                No hay registros en la tabla <code>{TABLE_NAME}</code>.
                            </p>
                            <p className="text-sm text-gray-400 mt-1">Los datos antiguos no se muestran aquí.</p>
                            <button 
                                onClick={() => setIsAddUserFormOpen(true)}
                                className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                            >
                                Crear primer registro
                            </button>
                        </div>
                    )
                )}
            </main>
            
            <button
                onClick={() => setIsAddUserFormOpen(true)}
                className="fixed bottom-8 right-6 bg-green-600 text-white rounded-full p-4 shadow-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300 z-30"
                aria-label="Abrir Calculadora y Registro"
            >
                <PlusIcon />
            </button>

            {isAddUserFormOpen && (
                <AddUserForm 
                    onClose={() => setIsAddUserFormOpen(false)} 
                    onSuccess={handleAddUserSuccess} 
                />
            )}
        </div>
    );
};

export default AdminDashboard;
