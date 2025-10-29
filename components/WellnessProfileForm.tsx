import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WellnessProfileData } from '../types';
import ProgressBar from './ProgressBar';

interface WellnessProfileFormProps {
    userId: number;
    existingData: WellnessProfileData | null;
    onSave: (data: WellnessProfileData, isFinal: boolean) => void;
    onClose: () => void;
}

const WellnessProfileForm: React.FC<WellnessProfileFormProps> = ({ userId, existingData, onSave, onClose }) => {
    const initialData = useMemo(() => ({
        user_id: userId,
        goals: [],
        other_goals: '',
        referrals: [{ name: '', phone: '' }, { name: '', phone: '' }, { name: '', phone: '' }],
        wake_up_time: '', sleep_time: '', eats_breakfast: null, breakfast_time: '',
        breakfast_details: '', water_intake: '', other_drinks: '', snacks: '',
        fruit_veg_portions: '', low_energy_time: '', exercise_frequency: '',
        eats_more_at_night: false, food_challenge: '', alcohol_per_week: '',
        daily_food_spending: '', free_meal_interest: null,
        ...existingData
    }), [userId, existingData]);
    
    const [formData, setFormData] = useState<WellnessProfileData>(initialData);
    const formRef = useRef<HTMLDivElement>(null);

    const requiredFields = [
        'wake_up_time', 'sleep_time', 'eats_breakfast', 'water_intake', 
        'fruit_veg_portions', 'exercise_frequency', 'food_challenge', 'daily_food_spending'
    ];
    
    const calculateProgress = () => {
        const totalFields = requiredFields.length;
        let completedFields = 0;
        requiredFields.forEach(field => {
            const value = formData[field as keyof WellnessProfileData];
            if (value !== null && value !== '' && value !== undefined) {
                 if(Array.isArray(value) && value.length === 0) return;
                 completedFields++;
            }
        });
        return Math.round((completedFields / totalFields) * 100);
    };

    const progress = calculateProgress();

    useEffect(() => {
        // Scroll to top when the modal opens
        if (formRef.current) {
            formRef.current.scrollTop = 0;
        }
        // Disable body scroll when modal is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            const currentGoals = formData.goals || [];
            const newGoals = checked
                ? [...currentGoals, value]
                : currentGoals.filter(goal => goal !== value);
            setFormData(prev => ({ ...prev, goals: newGoals }));
        } else if (name.startsWith('referral_name_') || name.startsWith('referral_phone_')) {
            const [field, indexStr] = name.replace('referral_', '').split('_');
            const index = parseInt(indexStr, 10);
            const newReferrals = [...(formData.referrals || [])];
            
            // Ensure the referral object exists at the index
            if (!newReferrals[index]) {
                newReferrals[index] = { name: '', phone: '' };
            }

            newReferrals[index] = { ...newReferrals[index], [field]: value };
            setFormData(prev => ({...prev, referrals: newReferrals}));
        } else {
             setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
            }));
        }
    };
    
    const handleSubmit = (isFinal: boolean) => {
        // Clean up empty referrals before saving
        const cleanedReferrals = formData.referrals?.filter(r => r.name.trim() !== '' || r.phone.trim() !== '');

        // Sanitize empty time fields to null
        const sanitizedData: WellnessProfileData = {
            ...formData,
            referrals: cleanedReferrals,
            wake_up_time: formData.wake_up_time || undefined,
            sleep_time: formData.sleep_time || undefined,
            breakfast_time: formData.breakfast_time || undefined,
        };

        onSave(sanitizedData, isFinal);
    };
    
    const goalsOptions = [
        { value: 'perder_peso', label: 'Perder peso' },
        { value: 'aumentar_energia', label: 'Aumentar energía' },
        { value: 'mejorar_rendimiento', label: 'Mejorar rendimiento físico' },
        { value: 'tonificar', label: 'Tonificar/bajar %grasa' },
        { value: 'aumentar_masa_muscular', label: 'Aumentar masa muscular' },
        { value: 'mejorar_salud', label: 'Mejorar salud' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div ref={formRef} className="bg-white rounded-lg shadow-2xl w-full max-w-2xl transform transition-all max-h-[90vh] flex flex-col">
                <div className="p-6 border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Perfil de Bienestar</h2>
                            <p className="text-sm text-gray-500">ID de Usuario: {userId}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                    </div>
                    <div className="mt-4">
                        <ProgressBar percentage={progress} />
                    </div>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Metas Físicas y de Bienestar */}
                    <div className="p-4 border rounded-lg bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Metas Físicas y de Bienestar</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {goalsOptions.map(goal => (
                                <label key={goal.value} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                                    <input type="checkbox" name="goals" value={goal.value}
                                        checked={formData.goals?.includes(goal.value)} onChange={handleChange}
                                        className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                    />
                                    <span>{goal.label}</span>
                                </label>
                            ))}
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Otras metas:</label>
                            <input type="text" name="other_goals" value={formData.other_goals} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500" />
                        </div>
                    </div>

                    {/* Referidos */}
                    <div className="p-4 border rounded-lg bg-gray-50">
                         <h3 className="text-lg font-semibold text-gray-700 mb-3">Comparte Nuestro Estudio de Bienestar Gratis</h3>
                         <div className="space-y-3">
                            {[0, 1, 2].map(index => (
                                <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input type="text" name={`referral_name_${index}`} placeholder={`Nombre ${index + 1}`} 
                                    value={formData.referrals?.[index]?.name || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg"/>
                                    <input type="tel" name={`referral_phone_${index}`} placeholder={`Teléfono ${index + 1}`} 
                                    value={formData.referrals?.[index]?.phone || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg"/>
                                </div>
                            ))}
                         </div>
                    </div>

                    {/* Análisis de Nutrición y Salud */}
                    <div className="p-4 border rounded-lg bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Análisis de Nutrición y Salud</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hora de despertar: <span className="text-red-500">*</span></label>
                                <input type="time" name="wake_up_time" value={formData.wake_up_time} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hora de dormir: <span className="text-red-500">*</span></label>
                                <input type="time" name="sleep_time" value={formData.sleep_time} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">¿Desayunas cada mañana? <span className="text-red-500">*</span></label>
                                <select name="eats_breakfast" value={formData.eats_breakfast ?? ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required>
                                    <option value="" disabled>Selecciona...</option>
                                    <option value="SI">SI</option>
                                    <option value="NO">NO</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué desayunas?</label>
                                <input type="text" name="breakfast_details" value={formData.breakfast_details} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">En promedio, ¿cuánta agua bebes al día? <span className="text-red-500">*</span></label>
                                <input type="text" name="water_intake" value={formData.water_intake} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Otras bebidas (jugos, refrescos, etc.)</label>
                                <input type="text" name="other_drinks" value={formData.other_drinks} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meriendas entre comidas</label>
                                <input type="text" name="snacks" value={formData.snacks} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Porciones de frutas y verduras al día <span className="text-red-500">*</span></label>
                                <input type="text" name="fruit_veg_portions" value={formData.fruit_veg_portions} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hora en la que sientes menos energía</label>
                                <input type="text" name="low_energy_time" value={formData.low_energy_time} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">¿Con qué frecuencia te ejercitas? <span className="text-red-500">*</span></label>
                                <input type="text" name="exercise_frequency" value={formData.exercise_frequency} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">¿Cuál es tu mayor reto con respecto a la comida? <span className="text-red-500">*</span></label>
                                <input type="text" name="food_challenge" value={formData.food_challenge} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bebidas alcohólicas por semana</label>
                                <input type="text" name="alcohol_per_week" value={formData.alcohol_per_week} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">¿Cuánto dinero gastas en comida diariamente? <span className="text-red-500">*</span></label>
                                <input type="text" name="daily_food_spending" value={formData.daily_food_spending} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                            </div>
                        </div>
                    </div>
                     {/* Come Gratis */}
                    <div className="p-4 border rounded-lg bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Come Gratis</h3>
                        <p className="text-sm text-gray-600 mb-3">¿Te gustaría tener tu desayuno ó almuerzo gratis?</p>
                        <div className="flex flex-wrap gap-4">
                             <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="free_meal_interest" value="SI" onChange={handleChange} checked={formData.free_meal_interest === 'SI'} className="h-4 w-4"/><span>SI</span></label>
                             <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="free_meal_interest" value="MÁS INFO" onChange={handleChange} checked={formData.free_meal_interest === 'MÁS INFO'} className="h-4 w-4"/><span>MÁS INFO</span></label>
                             <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="free_meal_interest" value="NO" onChange={handleChange} checked={formData.free_meal_interest === 'NO'} className="h-4 w-4"/><span>NO</span></label>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-end items-center gap-3">
                    <button type="button" onClick={() => handleSubmit(false)} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                        Guardar Avance
                    </button>
                    <button type="button" onClick={() => handleSubmit(true)} disabled={progress < 100} 
                     className="bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                        Finalizar y Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WellnessProfileForm;
