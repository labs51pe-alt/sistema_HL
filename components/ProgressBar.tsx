import React from 'react';

interface ProgressBarProps {
    percentage: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => {
    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-base font-medium text-green-700">Progreso del Formulario</span>
                <span className="text-sm font-medium text-green-700">{percentage}% Completado</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                    className="bg-green-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

export default ProgressBar;
