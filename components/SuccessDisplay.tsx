import React from 'react';

interface SuccessDisplayProps {
    title: string;
    message: string;
}

const CheckmarkIcon: React.FC = () => (
    <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
);

const SuccessDisplay: React.FC<SuccessDisplayProps> = ({ title, message }) => {
    return (
        <div className="text-center p-8 bg-green-50 rounded-lg border border-green-200 animate-fade-in-up">
            <CheckmarkIcon />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
            <p className="text-gray-600">{message}</p>
        </div>
    );
};

export default SuccessDisplay;
