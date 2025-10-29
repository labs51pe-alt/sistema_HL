import React from 'react';
import { BmiData } from '../types';
import { ClipboardPlusIcon } from './icons/DocumentIcon';

interface ResultModalProps {
    data: BmiData;
    onClose: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({ data, onClose }) => {
    
    const getMotivationalMessage = (category: string) => {
        const lowerCaseCategory = category.toLowerCase();
        if (lowerCaseCategory.includes('bajo peso')) {
            return "Reconocer dónde estás es el primer paso hacia tu bienestar. Tienes la oportunidad de nutrir tu cuerpo y construir la fuerza que deseas. ¡Vamos a crear juntos un plan para que te sientas increíble!";
        }
        if (lowerCaseCategory.includes('peso normal')) {
            return "¡Felicidades, estás en una posición fantástica! Este es el momento ideal para consolidar hábitos saludables y llevar tu vitalidad a un nuevo nivel. ¡Exploremos cómo puedes sentirte aún más fuerte y con más energía!";
        }
        if (lowerCaseCategory.includes('sobrepeso')) {
            return "¡Excelente decisión la de tomar el control! Este cálculo es el punto de partida de una increíble transformación. Cada pequeño cambio que hagas desde hoy te acerca a tu meta. ¡Estoy aquí para guiarte en el proceso!";
        }
        if (lowerCaseCategory.includes('obesidad')) {
            return "¡El paso más valiente es siempre el primero, y lo acabas de dar! Olvídate de las etiquetas. Hoy empieza tu historia de superación y bienestar. Tienes toda la fuerza que necesitas para lograrlo, y no estarás solo en este camino. ¡Juntos lo haremos posible!";
        }
        return "Cada paso cuenta en el camino hacia tu bienestar. ¡Sigue adelante!";
    };

    const handleWhatsAppClick = () => {
        const whatsappNumber = '51900652150'; 
        const message = `¡Hola Cindy! Soy ${data.nombre} y estoy con toda la motivación para empezar mi transformación. Mi resultado de IMC es ${data.imc} (${data.categoria}). ¿Me podrías contar cuál es el siguiente paso para comenzar? ¡Gracias!`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300 scale-100 animate-fade-in-up relative max-h-[90vh] overflow-y-auto">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Cerrar modal"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">
                    ¡Un gran paso, <span className="text-green-600">{data.nombre}</span>!
                </h2>
                <p className="text-center text-gray-600 mb-6 px-4">
                    {getMotivationalMessage(data.categoria)}
                </p>
                
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-6">
                    <p className="text-sm text-green-800">Tu resultado de IMC es:</p>
                    <p className="text-5xl font-bold text-green-600 my-2">{data.imc}</p>
                    <p className="text-lg font-semibold text-gray-700">{data.categoria}</p>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                    <button
                        onClick={handleWhatsAppClick}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 px-8 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 text-lg"
                    >
                        ¡Quiero mi cambio AHORA!
                    </button>
                    <a
                        href={`/perfil-bienestar/${data.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-white border border-green-600 text-green-700 font-semibold py-3 px-6 rounded-lg hover:bg-green-50 transition-all duration-300 text-center text-md flex items-center justify-center"
                    >
                        <ClipboardPlusIcon />
                        <span className="ml-2">Adelanta tu Proceso: Llena tu Perfil</span>
                    </a>
                </div>
            </div>
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
        </div>
    );
};

export default ResultModal;