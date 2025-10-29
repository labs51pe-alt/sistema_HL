import React from 'react';

const QuickAccessIcon: React.FC = () => (
     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
    </svg>
);

interface QuickAccessFabProps {
    onClick: () => void;
}

const QuickAccessFab: React.FC<QuickAccessFabProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300 z-30"
            aria-label="Acceso Rápido a Evaluaciones"
            title="Acceso Rápido a Evaluaciones"
        >
            <QuickAccessIcon />
        </button>
    );
};

export default QuickAccessFab;
