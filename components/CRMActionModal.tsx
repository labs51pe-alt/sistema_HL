
import React, { useState, useEffect } from 'react';
import { BmiData } from '../types';
import supabase from '../supabaseClient';
import { WhatsappIcon } from './icons/WhatsappIcon';

interface CRMActionModalProps {
    data: BmiData;
    onClose: () => void;
    onUpdate: () => void; // Refrescar lista padre
}

const CRMActionModal: React.FC<CRMActionModalProps> = ({ data, onClose, onUpdate }) => {
    const [selectedProducts, setSelectedProducts] = useState<string[]>(data.products || []);
    const [generatedScript, setGeneratedScript] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Fuxion Product Catalog
    const productsList = [
        { id: 'prunex', name: 'Prunex 1 (Detox)', category: 'Limpieza' },
        { id: 'flora', name: 'Flora Liv', category: 'Limpieza' },
        { id: 'biopro_fit', name: 'Biopro Fit', category: 'Nutrición' },
        { id: 'biopro_sport', name: 'Biopro Sport', category: 'Nutrición' },
        { id: 'thermo', name: 'Thermo T3', category: 'Potenciador' },
        { id: 'nocart', name: 'Nocarb-T', category: 'Potenciador' },
        { id: 'vita', name: 'Vita Xtra T+', category: 'Energía' },
        { id: 'off', name: 'Off / No Stress', category: 'Mental' },
    ];

    // Calculate Risk (Traffic Light)
    const getLastInteractionDays = () => {
        if (!data.last_interaction) return 999; // Nunca contactado
        const lastDate = new Date(data.last_interaction);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    };

    const daysSinceContact = getLastInteractionDays();

    const getRiskStatus = () => {
        if (daysSinceContact <= 7) return { color: 'bg-green-500', text: 'Cliente Activo', level: 'low' };
        if (daysSinceContact <= 14) return { color: 'bg-yellow-500', text: 'Alerta Seguimiento', level: 'medium' };
        return { color: 'bg-red-500', text: 'Riesgo Abandono', level: 'high' };
    };

    const risk = getRiskStatus();

    // Generate Smart Script based on context
    useEffect(() => {
        const firstName = data.nombre.split(' ')[0];
        let script = '';

        if (data.estado === 'Nuevo') {
            script = `Hola ${firstName}, vi que te registraste para la evaluación. ¿Tienes 5 minutos para revisar tus resultados de IMC (${data.imc}) y ver cómo bajar esa grasa abdominal?`;
        } else if (selectedProducts.length === 0) {
            // No products yet - Focus on Closing
            script = `Hola ${firstName}, revisando tu perfil, lo ideal para arrancar es el Pack Detox de 5 días. ¿Te animas a empezar el lunes con el equipo?`;
        } else {
            // Has products - Contextual Follow-up
            const productNames = selectedProducts.join(', ');
            
            if (risk.level === 'low') {
                script = `¡Hola ${firstName}! ¿Cómo vas con tu ${productNames}? Cuéntame qué tal sentiste la energía hoy.`;
            } else if (risk.level === 'medium') {
                script = `Hola ${firstName}, hace unos días no hablamos. Quería asegurarme de que estés tomando el ${productNames} a la hora correcta para ver resultados. ¿Todo bien?`;
            } else {
                // High Risk / Abandonment
                script = `¡Hola ${firstName}! Te he extrañado por aquí. Tengo una estrategia nueva para acelerar tu meta de peso sin pasar hambre. ¿Te cuento rapidito?`;
            }
        }
        setGeneratedScript(script);
    }, [data, selectedProducts, risk.level]);

    const handleProductToggle = (productName: string) => {
        setSelectedProducts(prev => 
            prev.includes(productName) 
                ? prev.filter(p => p !== productName)
                : [...prev, productName]
        );
    };

    const handleInteraction = async (method: 'whatsapp' | 'log_only') => {
        setIsSaving(true);
        const now = new Date().toISOString();

        // Update DB
        await supabase
            .from('fuxion_registros')
            .update({ 
                last_interaction: now,
                products: selectedProducts
            })
            .eq('id', data.id);

        setIsSaving(false);
        onUpdate(); // Refresh UI

        if (method === 'whatsapp') {
            const whatsappNumber = data.telefono.replace(/\D/g, '');
            window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(generatedScript)}`, '_blank');
            onClose();
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                
                {/* Header with Risk Status */}
                <div className={`${risk.color} p-4 text-white flex justify-between items-center`}>
                    <div>
                        <h2 className="text-xl font-bold">Estrategia CRM</h2>
                        <p className="text-sm opacity-90">
                            {daysSinceContact === 999 ? 'Sin contacto previo' : `Último contacto: hace ${daysSinceContact} días`}
                        </p>
                    </div>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">
                        {risk.text}
                    </span>
                </div>

                <div className="p-6 space-y-6">
                    
                    {/* Product Tagger */}
                    <div>
                        <h3 className="text-gray-700 font-bold text-sm mb-3 uppercase tracking-wide">Tratamiento Actual (Productos)</h3>
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border p-2 rounded-lg bg-gray-50">
                            {productsList.map(prod => (
                                <label key={prod.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedProducts.includes(prod.name)}
                                        onChange={() => handleProductToggle(prod.name)}
                                        className="rounded text-green-600 focus:ring-green-500"
                                    />
                                    <span className="text-sm text-gray-700">{prod.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Smart Script Area */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 relative">
                        <label className="text-blue-800 font-bold text-xs uppercase mb-2 block">
                            Guion Inteligente Sugerido
                        </label>
                        <textarea
                            className="w-full bg-white border border-blue-200 rounded-lg p-3 text-sm text-gray-700 focus:ring-2 focus:ring-blue-400 outline-none resize-none h-24"
                            value={generatedScript}
                            onChange={(e) => setGeneratedScript(e.target.value)}
                        />
                        <div className="absolute top-4 right-4">
                             {risk.level === 'high' && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold animate-pulse">🔥 Reactivación</span>}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 gap-3">
                        <button 
                            onClick={() => handleInteraction('whatsapp')}
                            disabled={isSaving}
                            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3 rounded-xl font-bold shadow-md flex items-center justify-center transition-transform transform hover:scale-[1.02]"
                        >
                            <WhatsappIcon />
                            <span className="ml-2">Enviar Guion y Registrar Contacto</span>
                        </button>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => handleInteraction('log_only')}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm transition-colors"
                            >
                                Solo Guardar Cambios
                            </button>
                            <button 
                                onClick={onClose}
                                className="px-4 text-gray-400 hover:text-gray-600 font-medium text-sm underline"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CRMActionModal;
