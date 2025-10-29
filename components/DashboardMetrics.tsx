import React from 'react';
import { BmiData } from '../types';

interface DashboardMetricsProps {
    registrations: BmiData[];
    onFilterChange: (filter: 'all' | 'today' | 'pending' | 'active') => void;
    activeFilter: string;
}

const MetricCard: React.FC<{ title: string; value: number; onClick: () => void; isActive: boolean }> = ({ title, value, onClick, isActive }) => {
    const baseStyles = "p-4 rounded-lg shadow-sm cursor-pointer transition-all duration-300 transform";
    const activeStyles = "bg-green-600 text-white scale-105 shadow-lg";
    const inactiveStyles = "bg-white text-gray-800 hover:bg-gray-50 hover:shadow-md";
    
    return (
        <div onClick={onClick} className={`${baseStyles} ${isActive ? activeStyles : inactiveStyles}`}>
            <h3 className={`text-sm font-semibold ${isActive ? 'text-green-100' : 'text-gray-500'}`}>{title}</h3>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    );
};

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ registrations, onFilterChange, activeFilter }) => {
    
    const today = new Date().toISOString().slice(0, 10);
    
    const metrics = {
        today: registrations.filter(r => r.created_at?.slice(0, 10) === today).length,
        pending: registrations.filter(r => r.estado === 'Evaluación Agendada').length,
        active: registrations.filter(r => r.estado === 'En Acompañamiento').length,
    };

    return (
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
                title="Todos los Registros"
                value={registrations.length}
                onClick={() => onFilterChange('all')}
                isActive={activeFilter === 'all'}
            />
            <MetricCard 
                title="Nuevos Hoy"
                value={metrics.today}
                onClick={() => onFilterChange('today')}
                isActive={activeFilter === 'today'}
            />
            <MetricCard 
                title="Evaluaciones Pendientes"
                value={metrics.pending}
                onClick={() => onFilterChange('pending')}
                isActive={activeFilter === 'pending'}
            />
            <MetricCard 
                title="Clientes Activos"
                value={metrics.active}
                onClick={() => onFilterChange('active')}
                isActive={activeFilter === 'active'}
            />
        </div>
    );
};

export default DashboardMetrics;