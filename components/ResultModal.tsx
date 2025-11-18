import React, { useEffect, useState } from 'react';
import { BmiData } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface ResultModalProps {
    data: BmiData;
    onClose: () => void;
}

// Estructura del Plan Fuxion en 3 Pasos
interface FuxionPhase {
    step: number;
    title: string;
    duration: string;
    productName: string;
    reason: string; // Por qué este producto para este usuario
    iconType: 'detox' | 'nutrition' | 'boost';
}

interface AIRecommendation {
    shortDiagnosis: string; // Frase de impacto de 1 linea
    phases: FuxionPhase[];
    nutritionTips: string[];
}

const ResultModal: React.FC<ResultModalProps> = ({ data, onClose }) => {
    const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
    const [loadingAI, setLoadingAI] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Cálculo visual para el medidor (Gauge)
    const getRotation = (imc: number) => {
        // Mapear IMC (15 a 45) a Grados (0 a 180)
        const minBMI = 15;
        const maxBMI = 45;
        const clampedBMI = Math.min(Math.max(imc, minBMI), maxBMI);
        const percentage = (clampedBMI - minBMI) / (maxBMI - minBMI);
        return percentage * 180 - 90; // -90 a 90 grados
    };

    useEffect(() => {
        const generatePlan = async () => {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                // Instrucción del Sistema: Lógica de Trazabilidad Fuxion
                const systemInstruction = `
                    Eres un Master Coach de FUXION ("Salud Verdadera"). Tu objetivo es trazar una ruta de bienestar de 3 pasos basada en el IMC del usuario.
                    
                    **LÓGICA OBLIGATORIA FUXION:**
                    
                    **PASO 1: LIMPIAR Y DESINTOXICAR (Días 1-5)**
                    - Si tiene sobrepeso/obesidad: **Prunex 1** (Limpieza de colon necesaria para absorber nutrientes).
                    - Si tiene bajo peso o gastritis: **Flora Liv** (Regenerar flora) o **Liquid Fibra**.
                    
                    **PASO 2: REGENERAR Y NUTRIR (Diario)**
                    - Si quiere bajar peso: **Biopro Fit** (Proteína quema grasa).
                    - Si quiere subir peso/musculo: **Biopro+ Sport** o **Biopro+ Active**.
                    - Si busca salud general: **Biopro+ Active**.
                    
                    **PASO 3: REVITALIZAR Y POTENCIAR (Según necesidad)**
                    - Grasa abdominal/IMC alto: **Thermo T3** (Termogénico).
                    - Fatiga/Cansancio: **Vita Xtra T+**.
                    - Estrés/Ansiedad: **No Stress** o **Off**.
                    - Carbohidratos altos: **Nocarb-T**.
                    
                    **Salida requerida:**
                    Genera un diagnóstico corto y contundente basado en OMS.
                    Luego define las 3 fases con el producto exacto y la razón específica para ESTE usuario (menciona su nombre o IMC en la razón).
                `;

                const prompt = `
                    Usuario: ${data.nombre}
                    Edad: ${data.edad}
                    Peso: ${data.peso} kg
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
                                shortDiagnosis: {
                                    type: Type.STRING,
                                    description: "Frase de impacto sobre su estado actual (Ej: 'Tu IMC indica riesgo cardiovascular moderado, es hora de actuar').",
                                },
                                phases: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            step: { type: Type.INTEGER },
                                            title: { type: Type.STRING, description: "Ej: FASE 1: DETOX PROFUNDO" },
                                            duration: { type: Type.STRING, description: "Ej: Primeros 5 días" },
                                            productName: { type: Type.STRING, description: "Nombre del producto Fuxion" },
                                            reason: { type: Type.STRING, description: "Por qué este usuario lo necesita" },
                                            iconType: { type: Type.STRING, enum: ["detox", "nutrition", "boost"] }
                                        }
                                    },
                                    description: "Array exacto de 3 fases (Limpiar, Nutrir, Potenciar).",
                                },
                                nutritionTips: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING },
                                    description: "3 consejos de comida real cortos.",
                                }
                            },
                        },
                    },
                });

                if (response.text) {
                    setRecommendation(JSON.parse(response.text));
                } else {
                    throw new Error("No response from AI");
                }

            } catch (err) {
                console.error("Error generating plan:", err);
                setError("Diseñando ruta de bienestar...");
            } finally {
                setLoadingAI(false);
            }
        };

        generatePlan();
    }, [data]);

    const handleWhatsAppClick = () => {
        const coachNumber = '51900000000'; // Configurar número real
        
        let message = `Hola Coach, soy ${data.nombre} (IMC: ${data.imc}). El sistema me recomendó el Plan Fuxion: `;
        if (recommendation) {
            const products = recommendation.phases.map(p => p.productName).join(' + ');
            message += `${products}. ¡Quiero activar mi Fase 1!`;
        }
        
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-md overflow-hidden">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[95vh]">
                
                {/* Header con Branding */}
                <div className="bg-gradient-to-r from-[#94c120] to-[#006D44] p-4 pt-6 rounded-t-3xl text-white text-center relative shrink-0">
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1 transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    <p className="text-xs font-bold tracking-widest uppercase opacity-90">Sistema de Bienestar</p>
                    <h2 className="text-2xl font-extrabold mt-1">Tu Ruta FUXION</h2>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-6 space-y-6 bg-gray-50 flex-grow">
                    
                    {loadingAI ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-16 h-16 border-4 border-gray-200 border-t-[#94c120] rounded-full animate-spin"></div>
                            <p className="text-[#006D44] font-medium animate-pulse">Analizando metabolismo...</p>
                        </div>
                    ) : recommendation ? (
                        <>
                            {/* 1. Velocímetro IMC (Gauge) */}
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center relative overflow-hidden">
                                <h3 className="text-gray-500 text-xs font-bold uppercase mb-4">Diagnóstico IMC Actual</h3>
                                
                                <div className="relative w-64 h-32 flex justify-center overflow-hidden mb-2">
                                    {/* Background Arc */}
                                    <div className="absolute w-64 h-64 rounded-full bg-gray-200" 
                                         style={{
                                             background: `conic-gradient(from 180deg, #3b82f6 0deg 36deg, #22c55e 36deg 72deg, #eab308 72deg 108deg, #ef4444 108deg 180deg)`
                                         }}>
                                         {/* Mask to create arc */}
                                         <div className="absolute top-4 left-4 right-4 bottom-4 bg-white rounded-full"></div>
                                    </div>
                                    
                                    {/* Needle */}
                                    <div className="absolute bottom-0 left-1/2 w-1 h-32 bg-gray-800 origin-bottom transition-all duration-1000 ease-out"
                                         style={{ transform: `translateX(-50%) rotate(${getRotation(data.imc)}deg)` }}>
                                         <div className="w-4 h-4 bg-gray-800 rounded-full absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2"></div>
                                    </div>
                                </div>
                                
                                <div className="text-center mt-2 relative z-10">
                                    <p className="text-4xl font-black text-gray-800">{data.imc}</p>
                                    <p className={`text-sm font-bold uppercase tracking-wide px-3 py-1 rounded-full inline-block mt-1
                                        ${data.imc < 18.5 ? 'bg-blue-100 text-blue-700' : 
                                          data.imc < 25 ? 'bg-green-100 text-green-700' : 
                                          data.imc < 30 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-700'}`}>
                                        {data.categoria}
                                    </p>
                                </div>
                                <p className="text-center text-xs text-gray-500 mt-3 px-4 italic">
                                    "{recommendation.shortDiagnosis}"
                                </p>
                            </div>

                            {/* 2. El Camino Fuxion (Timeline) */}
                            <div>
                                <h3 className="text-[#006D44] font-bold text-lg mb-4 flex items-center">
                                    <span className="bg-[#94c120] w-2 h-6 mr-2 rounded-full"></span>
                                    Tu Plan de Acción
                                </h3>
                                
                                <div className="relative border-l-2 border-dashed border-gray-300 ml-4 space-y-8 py-2">
                                    {recommendation.phases.map((phase, index) => (
                                        <div key={index} className="relative pl-8">
                                            {/* Icon Marker */}
                                            <div className={`absolute -left-[21px] top-0 w-10 h-10 rounded-full border-4 border-white shadow-md flex items-center justify-center
                                                ${phase.iconType === 'detox' ? 'bg-purple-600' : 
                                                  phase.iconType === 'nutrition' ? 'bg-blue-500' : 'bg-red-500'}`}>
                                                {phase.iconType === 'detox' && <span className="text-white text-xs">🧹</span>}
                                                {phase.iconType === 'nutrition' && <span className="text-white text-xs">🛡️</span>}
                                                {phase.iconType === 'boost' && <span className="text-white text-xs">🔥</span>}
                                            </div>

                                            {/* Content Card */}
                                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white
                                                        ${phase.iconType === 'detox' ? 'bg-purple-600' : 
                                                          phase.iconType === 'nutrition' ? 'bg-blue-500' : 'bg-red-500'}`}>
                                                        {phase.title}
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-medium">{phase.duration}</span>
                                                </div>
                                                
                                                <h4 className="text-lg font-bold text-gray-800 mt-2">{phase.productName}</h4>
                                                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                                    <span className="font-semibold text-gray-800">Por qué: </span> 
                                                    {phase.reason}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Nutrition Tips Compact */}
                            <div className="bg-[#eef6e8] p-4 rounded-xl border border-[#94c120]/20">
                                <h4 className="text-[#006D44] font-bold text-sm mb-2 flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                    Tips Nutricionales
                                </h4>
                                <ul className="space-y-1">
                                    {recommendation.nutritionTips.map((tip, i) => (
                                        <li key={i} className="text-xs text-gray-700 flex items-start">
                                            <span className="text-[#94c120] mr-1">•</span> {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                        </>
                    ) : null}
                </div>

                {/* Footer Fixed CTA */}
                <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                    <button 
                        onClick={handleWhatsAppClick}
                        disabled={loadingAI}
                        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center transition-transform transform hover:scale-[1.02] disabled:opacity-50"
                    >
                        <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.31 20.62C8.75 21.41 10.36 21.82 12.04 21.82C17.5 21.82 21.95 17.37 21.95 11.91C21.95 6.45 17.5 2 12.04 2M12.04 3.67C16.56 3.67 20.28 7.38 20.28 11.91C20.28 16.44 16.56 20.15 12.04 20.15C10.49 20.15 8.99 19.74 7.7 19L7.22 18.72L4.35 19.65L5.3 16.83L5 16.35C4.22 15 3.8 13.47 3.8 11.91C3.8 7.38 7.52 3.67 12.04 3.67M9.13 7.82C8.91 7.82 8.7 7.82 8.5 7.82C8.28 7.82 8.04 7.84 7.82 8.18C7.6 8.5 7.02 9.12 7.02 10.23C7.02 11.33 7.84 12.38 7.97 12.55C8.12 12.72 9.27 14.54 11.12 15.31C12.59 15.93 13.04 15.76 13.43 15.7C13.82 15.64 14.78 15.06 15 14.48C15.22 13.9 15.22 13.43 15.15 13.32C15.08 13.21 14.92 13.15 14.65 13C14.38 12.85 13.43 12.38 13.18 12.27C12.94 12.16 12.78 12.1 12.63 12.38C12.48 12.66 12.03 13.21 11.89 13.38C11.74 13.54 11.6 13.56 11.33 13.46C11.06 13.34 10.24 13.08 9.27 12.2C8.5 11.53 7.97 10.7 7.84 10.43C7.7 10.16 7.84 10 7.97 9.87C8.1 9.76 8.24 9.57 8.37 9.44C8.5 9.3 8.56 9.19 8.63 9.02C8.7 8.85 8.67 8.7 8.63 8.63C8.58 8.56 8.37 8.04 8.16 7.84" /></svg>
                        Quiero activar mi Fase 1
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResultModal;