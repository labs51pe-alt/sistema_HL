import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WellnessProfileData } from '../types';
import Stepper from './Stepper';

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
    const [currentStep, setCurrentStep] = useState(1);
    const formRef = useRef<HTMLDivElement>(null);

    const steps = ['Metas', 'Referidos', 'Análisis', 'Cierre'];
    const totalSteps = steps.length;

    // Required fields calculation for validation enabling
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
        // Scroll to top when the modal opens or step changes
        if (formRef.current) {
            formRef.current.scrollTop = 0;
        }
    }, [currentStep]);

    useEffect(() => {
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
        const cleanedReferrals = formData.referrals?.filter(r => r.name.trim() !== '' || r.phone.trim() !== '');
        const sanitizedData: WellnessProfileData = {
            ...formData,
            referrals: cleanedReferrals,
            wake_up_time: formData.wake_up_time || undefined,
            sleep_time: formData.sleep_time || undefined,
            breakfast_time: formData.breakfast_time || undefined,
        };
        onSave(sanitizedData, isFinal);
    };
    
    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const goalsOptions = [
        { value: 'perder_peso', label: 'Perder peso' },
        { value: 'aumentar_energia', label: 'Aumentar energía' },
        { value: 'mejorar_rendimiento', label: 'Mejorar rendimiento físico' },
        { value: 'tonificar', label: 'Tonificar/bajar %grasa' },
        { value: 'aumentar_masa_muscular', label: 'Aumentar masa muscular' },
        { value: 'mejorar_salud', label: 'Mejorar salud' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div ref={formRef} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all max-h-[90vh] flex flex-col">
                <div className="p-6 border-b bg-gray-50 rounded-t-xl">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Perfil de Bienestar</h2>
                            <p className="text-sm text-gray-500">ID: {userId}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    <Stepper currentStep={currentStep} steps={steps} />
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {currentStep === 1 && (
                        <div className="p-1 animate-fade-in-up">
                            <h3 className="text-lg font-bold text-[#006D44] mb-4 flex items-center">
                                <span className="w-8 h-8 bg-[#94c120]/20 rounded-full flex items-center justify-center text-[#006D44] mr-2">1</span>
                                Metas Físicas y de Bienestar
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {goalsOptions.map(goal => (
                                    <label key={goal.value} className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${formData.goals?.includes(goal.value) ? 'bg-green-50 border-green-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                        <input type="checkbox" name="goals" value={goal.value}
                                            checked={formData.goals?.includes(goal.value)} onChange={handleChange}
                                            className="h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                        />
                                        <span className="text-gray-700 font-medium">{goal.label}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">¿Tienes alguna otra meta específica?</label>
                                <input type="text" name="other_goals" value={formData.other_goals} onChange={handleChange} placeholder="Ej: Correr una maratón, dormir mejor..." className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white" />
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="p-1 animate-fade-in-up">
                             <h3 className="text-lg font-bold text-[#006D44] mb-2 flex items-center">
                                <span className="w-8 h-8 bg-[#94c120]/20 rounded-full flex items-center justify-center text-[#006D44] mr-2">2</span>
                                Comparte Nuestro Estudio
                             </h3>
                             <p className="text-gray-600 mb-6 text-sm ml-10">Ayúdanos a llegar a más personas nominando amigos o familiares para una evaluación gratuita.</p>
                             <div className="space-y-4">
                                {[0, 1, 2].map(index => (
                                    <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <div className="col-span-1 sm:col-span-2 font-medium text-sm text-gray-500">Nominado #{index + 1}</div>
                                        <input type="text" name={`referral_name_${index}`} placeholder="Nombre completo" 
                                        value={formData.referrals?.[index]?.name || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"/>
                                        <input type="tel" name={`referral_phone_${index}`} placeholder="Teléfono" 
                                        value={formData.referrals?.[index]?.phone || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"/>
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="p-1 animate-fade-in-up">
                            <h3 className="text-lg font-bold text-[#006D44] mb-4 flex items-center">
                                <span className="w-8 h-8 bg-[#94c120]/20 rounded-full flex items-center justify-center text-[#006D44] mr-2">3</span>
                                Análisis de Nutrición y Salud
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Hora de despertar <span className="text-red-500">*</span></label>
                                    <input type="time" name="wake_up_time" value={formData.wake_up_time} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500 bg-gray-50" required />
                                </div>
                                 <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Hora de dormir <span className="text-red-500">*</span></label>
                                    <input type="time" name="sleep_time" value={formData.sleep_time} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500 bg-gray-50" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">¿Desayunas? <span className="text-red-500">*</span></label>
                                    <select name="eats_breakfast" value={formData.eats_breakfast ?? ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500 bg-gray-50" required>
                                        <option value="" disabled>Selecciona...</option>
                                        <option value="SI">SI</option>
                                        <option value="NO">NO</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">¿Qué desayunas?</label>
                                    <input type="text" name="breakfast_details" value={formData.breakfast_details} onChange={handleChange} placeholder="Ej: Café con pan" className="w-full px-4 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500 bg-gray-50" />
                                </div>
                                 <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Agua al día (Vasos/Litros) <span className="text-red-500">*</span></label>
                                    <input type="text" name="water_intake" value={formData.water_intake} onChange={handleChange} placeholder="Ej: 2 litros" className="w-full px-4 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500 bg-gray-50" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Otras bebidas</label>
                                    <input type="text" name="other_drinks" value={formData.other_drinks} onChange={handleChange} placeholder="Ej: Gaseosa, jugo" className="w-full px-4 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500 bg-gray-50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Meriendas</label>
                                    <input type="text" name="snacks" value={formData.snacks} onChange={handleChange} placeholder="Ej: Galletas, fruta" className="w-full px-4 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500 bg-gray-50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Porciones Frutas/Verduras <span className="text-red-500">*</span></label>
                                    <input type="text" name="fruit_veg_portions" value={formData.fruit_veg_portions} onChange={handleChange} placeholder="Ej: 1 o 2" className="w-full px-4 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500 bg-gray-50" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Hora de bajón de energía</label>
                                    <input type="text" name="low_energy_time" value={formData.low_energy_time} onChange={handleChange} placeholder="Ej: 4:00 PM" className="w-full px-4 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500 bg-gray-50" />
                                </div>
                                 <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Frecuencia Ejercicio <span className="text-red-500">*</span></label>
                                    <input type="text" name="exercise_frequency" value={formData.exercise_frequency} onChange={handleChange} placeholder="Ej: 3 veces por semana" className="w-full px-4 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500 bg-gray-50" required />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mayor reto con la comida <span className="text-red-500">*</span></label>
                                    <input type="text" name="food_challenge" value={formData.food_challenge} onChange={handleChange} placeholder="Ej: Ansiedad por dulces" className="w-full px-4 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500 bg-gray-50" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Bebidas alcohólicas por semana</label>
                                    <input type="text" name="alcohol_per_week" value={formData.alcohol_per_week} onChange={handleChange} placeholder="Ej: 2 cervezas" className="w-full px-4 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500 bg-gray-50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Gasto diario comida ($) <span className="text-red-500">*</span></label>
                                    <input type="text" name="daily_food_spending" value={formData.daily_food_spending} onChange={handleChange} placeholder="Ej: 30 soles" className="w-full px-4 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500 bg-gray-50" required />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="p-1 animate-fade-in-up">
                            <h3 className="text-lg font-bold text-[#006D44] mb-4 flex items-center">
                                <span className="w-8 h-8 bg-[#94c120]/20 rounded-full flex items-center justify-center text-[#006D44] mr-2">4</span>
                                Cierre y Oportunidad
                            </h3>
                            <div className="bg-[#eef6e8] p-6 rounded-xl border border-[#94c120]/30 text-center">
                                <h4 className="text-xl font-bold text-[#006D44] mb-2">¿Te gustaría comer gratis?</h4>
                                <p className="text-gray-700 mb-6">Tenemos un programa de referidos donde puedes obtener tu desayuno o almuerzo gratis.</p>
                                <div className="flex flex-col sm:flex-row justify-center gap-4">
                                     <label className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.free_meal_interest === 'SI' ? 'bg-green-100 border-green-600 shadow-md' : 'bg-white border-gray-200'}`}>
                                        <input type="radio" name="free_meal_interest" value="SI" onChange={handleChange} checked={formData.free_meal_interest === 'SI'} className="h-5 w-5 text-green-600"/>
                                        <span className="font-bold text-gray-800">¡SÍ, ME INTERESA!</span>
                                     </label>
                                     <label className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.free_meal_interest === 'MÁS INFO' ? 'bg-blue-100 border-blue-600 shadow-md' : 'bg-white border-gray-200'}`}>
                                        <input type="radio" name="free_meal_interest" value="MÁS INFO" onChange={handleChange} checked={formData.free_meal_interest === 'MÁS INFO'} className="h-5 w-5 text-blue-600"/>
                                        <span className="font-bold text-gray-800">Quiero más info</span>
                                     </label>
                                     <label className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.free_meal_interest === 'NO' ? 'bg-gray-100 border-gray-400 shadow-md' : 'bg-white border-gray-200'}`}>
                                        <input type="radio" name="free_meal_interest" value="NO" onChange={handleChange} checked={formData.free_meal_interest === 'NO'} className="h-5 w-5 text-gray-600"/>
                                        <span className="font-bold text-gray-800">No, gracias</span>
                                     </label>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 rounded-b-xl border-t flex justify-between items-center gap-3">
                     <div>
                        {currentStep > 1 && (
                            <button onClick={prevStep} className="text-gray-600 font-semibold hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                                Anterior
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => handleSubmit(false)} className="hidden sm:block text-gray-600 bg-white border border-gray-300 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm">
                            Guardar Borrador
                        </button>
                        {currentStep === totalSteps ? (
                            <button type="button" onClick={() => handleSubmit(true)} disabled={progress < 100} 
                             className="bg-gradient-to-r from-[#94c120] to-[#006D44] text-white py-2 px-6 rounded-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                Finalizar y Guardar
                            </button>
                        ) : (
                             <button onClick={nextStep} className="bg-[#006D44] text-white py-2 px-6 rounded-lg font-semibold shadow-md hover:bg-[#005635] transition-colors">
                                Siguiente
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WellnessProfileForm;