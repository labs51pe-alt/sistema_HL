import React, { useEffect, useState } from 'react';
import { BmiData } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface ResultModalProps {
    data: BmiData;
    onClose: () => void;
}

// Estructura de respuesta de la IA Fuxion
interface AIRecommendation {
    analysis: string;
    nutritionTips: string[]; // Consejos de comida sólida
    habits: string[];
    fuxionProducts: {
        name: string;
        benefit: string;
        usage: string;
    }[];
}

const ResultModal: React.FC<ResultModalProps> = ({ data, onClose }) => {
    const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
    const [loadingAI, setLoadingAI] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const generatePlan = async () => {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                // Instrucción del Sistema: Coach Fuxion
                const systemInstruction = `
                    Eres un Coach de Bienestar Experto de la marca FUXION.
                    Tu misión es crear un plan personalizado analizando el IMC del usuario bajo estrictos reglamentos de la OMS.

                    **1. Análisis Reglamentario (OMS):**
                    - Evalúa el IMC (${data.imc}) y explica claramente los riesgos de salud asociados según la Organización Mundial de la Salud (ej. riesgo cardiovascular, diabetes, etc. para sobrepeso; anemia/inmunidad para bajo peso).

                    **2. Nutrición (QUÉ COMER):**
                    - Recomienda 3 pautas nutricionales sólidas (comida real).
                    - Enfócate en calidad de alimentos, horarios o tipos de cocción adecuados para su objetivo (Déficit calórico, Superávit o Mantenimiento).

                    **3. Suplementación Fuxion (QUÉ TOMAR):**
                    Selecciona 3 productos del catálogo Fuxion que mejor se adapten a su perfil:
                    - **Bajar Peso/Detox:** Prunex 1 (limpieza), Thermo T3 (quemador), Nocarb-T (bloqueador), Pack 5/14.
                    - **Energía/Deporte:** Vita Xtra T+, Pre Sport, Post Sport, Xpeed.
                    - **Inmunidad/Salud:** Veramas, Ganomas, Flora Liv (probióticos).
                    - **Anti-Edad/Huesos:** Beauty In, Youth Elixir.
                    - **Relajación:** Off.
                    
                    El tono debe ser profesional pero motivador.
                `;

                const prompt = `
                    Usuario: ${data.nombre}
                    Edad: ${data.edad}
                    Peso: ${data.peso} kg
                    Altura: ${data.altura} cm
                    IMC: ${data.imc}
                    Categoría: ${data.categoria}
                `;

                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: prompt,
                    config: {
                        systemInstruction: systemInstruction,
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                analysis: {
                                    type: Type.STRING,
                                    description: "Análisis de salud basado en reglamentos OMS y riesgos asociados.",
                                },
                                nutritionTips: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING },
                                    description: "3 consejos claros sobre alimentación (comida).",
                                },
                                habits: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING },
                                    description: "3 hábitos de estilo de vida saludable.",
                                },
                                fuxionProducts: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            name: { type: Type.STRING, description: "Nombre del producto Fuxion" },
                                            benefit: { type: Type.STRING, description: "Beneficio específico para este usuario" },
                                            usage: { type: Type.STRING, description: "Recomendación de consumo" },
                                        }
                                    },
                                    description: "Lista de 3 productos Fuxion recomendados.",
                                },
                            },
                        },
                    },
                });

                if (response.text) {
                    const parsedData = JSON.parse(response.text);
                    setRecommendation(parsedData);
                } else {
                    throw new Error("No response from AI");
                }

            } catch (err) {
                console.error("Error generating plan:", err);
                setError("Estamos diseñando tu plan Fuxion ideal...");
            } finally {
                setLoadingAI(false);
            }
        };

        generatePlan();
    }, [data]);

    const handleWhatsAppClick = () => {
        // Intenta obtener el número del usuario (aunque en este modal data.telefono es del usuario, el número destino es del coach)
        // Aquí asumimos un número genérico de coach o deberías configurarlo.
        const coachNumber = '51900000000'; // Reemplazar con el número real del admin/coach
        
        let message = `Hola, soy ${data.nombre}. Mi IMC es ${data.imc} (${data.categoria}).`;
        
        if (recommendation) {
            const products = recommendation.fuxionProducts.map(p => p.name).join(', ');
            message += ` Me interesa el pack Fuxion sugerido: ${products}. ¿Cómo lo consigo?`;
        }

        const encodedMessage = encodeURIComponent(message);
        // Si data.telefono es del usuario, usamos window.open para ir al WA del coach.
        // Nota: En un caso real, el "coachNumber" debería venir de una config.
        const whatsappUrl = `https://wa.me/?text=${encodedMessage}`; 
        // Abrir WA genérico para que el usuario seleccione contacto o poner numero fijo
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all relative max-h-[90vh] overflow-y-auto flex flex-col">
                
                {/* Header Sticky Fuxion Branding */}
                <div className="p-6 bg-gradient-to-r from-[#94c120] to-[#006D44] text-white rounded-t-2xl flex justify-between items-start sticky top-0 z-20 shadow-md">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            Plan Wellness FUXION
                        </h2>
                        <p className="text-green-100 text-sm mt-1 font-medium">Análisis y Recomendación Personalizada</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full"
                        aria-label="Cerrar"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto bg-gray-50">
                    {loadingAI ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-gray-200 border-t-[#94c120] rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center font-bold text-[#006D44]">
                                    X
                                </div>
                            </div>
                            <div className="text-center animate-pulse">
                                <p className="text-[#006D44] font-bold text-lg">Generando Plan Fuxion...</p>
                                <p className="text-gray-500 text-sm mt-1">Analizando IMC y consultando catálogo de bebidas funcionales</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 mb-4">{error}</p>
                            <p className="text-sm text-gray-400">Intenta recargar o contacta a tu coach.</p>
                        </div>
                    ) : recommendation ? (
                        <div className="space-y-6 animate-fade-in-up">
                            
                            {/* 1. Status Card */}
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">IMC Actual</p>
                                    <p className="text-3xl font-bold text-gray-800">{data.imc}</p>
                                </div>
                                <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                                    data.imc >= 25 ? 'bg-red-100 text-red-700' : 
                                    data.imc < 18.5 ? 'bg-yellow-100 text-yellow-700' : 
                                    'bg-green-100 text-green-700'
                                }`}>
                                    {data.categoria}
                                </div>
                            </div>

                            {/* 2. Diagnosis Section */}
                            <div className="bg-white p-5 rounded-xl border-l-4 border-[#006D44] shadow-sm">
                                <h3 className="text-[#006D44] font-bold text-lg mb-3 flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                    Análisis OMS
                                </h3>
                                <p className="text-gray-700 text-sm leading-relaxed text-justify">
                                    {recommendation.analysis}
                                </p>
                            </div>

                            {/* 3. Nutrition Tips */}
                            <div className="bg-white p-5 rounded-xl border-l-4 border-blue-500 shadow-sm">
                                <h3 className="text-blue-600 font-bold text-lg mb-3 flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                    Nutrición (Qué comer)
                                </h3>
                                <ul className="space-y-2">
                                    {recommendation.nutritionTips.map((tip, idx) => (
                                        <li key={idx} className="flex items-start text-sm text-gray-700">
                                            <span className="text-blue-500 mr-2">•</span> {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* 4. Fuxion Products Recommendation */}
                            <div className="bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] p-5 rounded-xl border border-[#94c120] shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-[#94c120] w-20 h-20 rounded-full opacity-20 blur-xl"></div>
                                <h3 className="text-[#006D44] font-bold text-lg mb-4 flex items-center relative z-10">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                                    Bebidas Fuxion Recomendadas
                                </h3>
                                <div className="space-y-3 relative z-10">
                                    {recommendation.fuxionProducts.map((prod, idx) => (
                                        <div key={idx} className="bg-white/80 p-3 rounded-lg border border-[#94c120]/30">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-[#006D44] text-sm">{prod.name}</h4>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1">{prod.benefit}</p>
                                            <p className="text-xs text-[#94c120] font-semibold mt-1">Uso: {prod.usage}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={handleWhatsAppClick}
                                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 rounded-xl font-bold shadow-lg flex items-center justify-center transition-transform transform hover:scale-[1.02]"
                            >
                                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.31 20.62C8.75 21.41 10.36 21.82 12.04 21.82C17.5 21.82 21.95 17.37 21.95 11.91C21.95 6.45 17.5 2 12.04 2M12.04 3.67C16.56 3.67 20.28 7.38 20.28 11.91C20.28 16.44 16.56 20.15 12.04 20.15C10.49 20.15 8.99 19.74 7.7 19L7.22 18.72L4.35 19.65L5.3 16.83L5 16.35C4.22 15 3.8 13.47 3.8 11.91C3.8 7.38 7.52 3.67 12.04 3.67M9.13 7.82C8.91 7.82 8.7 7.82 8.5 7.82C8.28 7.82 8.04 7.84 7.82 8.18C7.6 8.5 7.02 9.12 7.02 10.23C7.02 11.33 7.84 12.38 7.97 12.55C8.12 12.72 9.27 14.54 11.12 15.31C12.59 15.93 13.04 15.76 13.43 15.7C13.82 15.64 14.78 15.06 15 14.48C15.22 13.9 15.22 13.43 15.15 13.32C15.08 13.21 14.92 13.15 14.65 13C14.38 12.85 13.43 12.38 13.18 12.27C12.94 12.16 12.78 12.1 12.63 12.38C12.48 12.66 12.03 13.21 11.89 13.38C11.74 13.54 11.6 13.56 11.33 13.46C11.06 13.34 10.24 13.08 9.27 12.2C8.5 11.53 7.97 10.7 7.84 10.43C7.7 10.16 7.84 10 7.97 9.87C8.1 9.76 8.24 9.57 8.37 9.44C8.5 9.3 8.56 9.19 8.63 9.02C8.7 8.85 8.67 8.7 8.63 8.63C8.58 8.56 8.37 8.04 8.16 7.84" /></svg>
                                ¡Quiero este Plan Fuxion!
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default ResultModal;