import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WellnessQuestionnaireData } from '../types';
import Stepper from './Stepper';

interface WellnessQuestionnaireFormProps {
    userId: number;
    existingData: WellnessQuestionnaireData | null;
    onSave: (data: WellnessQuestionnaireData, isFinal: boolean) => void;
    onClose: () => void;
}

const WellnessQuestionnaireForm: React.FC<WellnessQuestionnaireFormProps> = ({ userId, existingData, onSave, onClose }) => {
    const initialData = useMemo(() => ({
        user_id: userId,
        readiness_scale: 0,
        consultation_referrals: Array(5).fill({ name: '', phone: '' }),
        ...existingData
    }), [userId, existingData]);

    const [formData, setFormData] = useState<WellnessQuestionnaireData>(initialData);
    const [currentStep, setCurrentStep] = useState(1);
    const formRef = useRef<HTMLDivElement>(null);

    const steps = ['Objetivo', 'Nutrición', 'Método', 'Referidos', 'Feedback'];
    const totalSteps = steps.length;

    const requiredFieldsPerStep: { [key: number]: (keyof WellnessQuestionnaireData)[] } = {
        1: ['clothing_size', 'body_parts_to_improve', 'previous_attempts', 'wardrobe_goal', 'benefit_of_achieving_goals', 'plan_3_to_6_months', 'motivation_today', 'readiness_scale'],
        2: ['daily_food_spending', 'daily_coffee_spending', 'weekly_alcohol_spending', 'weekly_takeout_spending'],
        3: [],
        4: [],
        5: ['coach_notes', 'mentor_feedback']
    };

    const allRequiredFields = Object.values(requiredFieldsPerStep).flat();

    const calculateProgress = () => {
        const totalFields = allRequiredFields.length;
        if (totalFields === 0) return 100;

        let completedFields = 0;
        allRequiredFields.forEach(field => {
            const value = formData[field as keyof WellnessQuestionnaireData];
            if (value !== null && value !== '' && value !== undefined && value !== 0) {
                if (Array.isArray(value) && value.length === 0) return;
                completedFields++;
            }
        });
        return Math.round((completedFields / totalFields) * 100);
    };

    const progress = calculateProgress();
    
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    useEffect(() => {
        // Scroll to top when step changes
        if (formRef.current) {
            formRef.current.scrollTop = 0;
        }
    }, [currentStep]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (name.startsWith('ref_name_') || name.startsWith('ref_phone_')) {
            const [field, indexStr] = name.replace('ref_', '').split('_');
            const index = parseInt(indexStr, 10);
            const newReferrals = [...(formData.consultation_referrals || [])];
             if (!newReferrals[index]) {
                newReferrals[index] = { name: '', phone: '' };
            }
            newReferrals[index] = { ...newReferrals[index], [field]: value };
            setFormData(prev => ({...prev, consultation_referrals: newReferrals}));
        } else {
             setFormData(prev => ({
                ...prev,
                [name]: type === 'number' ? parseInt(value, 10) || 0 : value
            }));
        }
    };
    
    const handleSubmit = (isFinal: boolean) => {
        const cleanedReferrals = formData.consultation_referrals?.filter(r => r.name.trim() !== '' || r.phone.trim() !== '');
        
        const sanitizedData: WellnessQuestionnaireData = {
            ...formData,
            consultation_referrals: cleanedReferrals,
            readiness_scale: formData.readiness_scale || undefined,
        };
        onSave(sanitizedData, isFinal);
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div ref={formRef} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all max-h-[90vh] flex flex-col">
                <div className="p-6 border-b bg-gray-50 rounded-t-xl">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Evaluación de Bienestar</h2>
                            <p className="text-sm text-gray-500">Cuestionario Coach</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    <Stepper currentStep={currentStep} steps={steps} />
                </div>
                
                 <div className="p-6 space-y-6 overflow-y-auto">
                    {currentStep === 1 && (
                        <div className="space-y-4 animate-fade-in-up">
                            <h3 className="text-lg font-bold text-[#006D44] border-b pb-2">Paso 1: Objetivo - Conectar</h3>
                            <div><label className="block text-sm font-medium text-gray-700">Talla de ropa:</label><input type="text" name="clothing_size" value={formData.clothing_size || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg focus:ring-[#94c120] focus:border-[#94c120]"/></div>
                            <div><label className="block text-sm font-medium text-gray-700">3 partes del cuerpo que te gustaría mejorar:</label><input type="text" name="body_parts_to_improve" value={formData.body_parts_to_improve || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg focus:ring-[#94c120] focus:border-[#94c120]"/></div>
                            <div><label className="block text-sm font-medium text-gray-700">¿Qué has hecho antes para intentarlo?</label><input type="text" name="previous_attempts" value={formData.previous_attempts || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg focus:ring-[#94c120] focus:border-[#94c120]"/></div>
                            <div><label className="block text-sm font-medium text-gray-700">¿Qué tienes en tu armario que podríamos usar como objetivo?</label><input type="text" name="wardrobe_goal" value={formData.wardrobe_goal || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg focus:ring-[#94c120] focus:border-[#94c120]"/></div>
                            <div><label className="block text-sm font-medium text-gray-700">¿Cómo te beneficiaría lograr estos objetivos?</label><input type="text" name="benefit_of_achieving_goals" value={formData.benefit_of_achieving_goals || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg focus:ring-[#94c120] focus:border-[#94c120]"/></div>
                            <div><label className="block text-sm font-medium text-gray-700">¿Qué tienes planeado para los próximos 3 a 6 meses?</label><input type="text" name="plan_3_to_6_months" value={formData.plan_3_to_6_months || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg focus:ring-[#94c120] focus:border-[#94c120]"/></div>
                            <div><label className="block text-sm font-medium text-gray-700">¿Qué te impulsó hoy finalmente a hacer algo al respecto? (Apego emocional)</label><input type="text" name="motivation_today" value={formData.motivation_today || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg focus:ring-[#94c120] focus:border-[#94c120]"/></div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="block text-sm font-bold text-gray-700 mb-2">En una escala del 1 al 10, ¿qué tan listo te sientes para comenzar? <span className="text-[#006D44] text-lg">({formData.readiness_scale})</span></label>
                                <input type="range" name="readiness_scale" value={formData.readiness_scale || 0} onChange={handleChange} min="1" max="10" className="w-full mt-1 accent-[#006D44]"/>
                                <div className="flex justify-between text-xs text-gray-500 px-1">
                                    <span>Nada listo</span>
                                    <span>¡Vamos!</span>
                                </div>
                            </div>
                        </div>
                    )}
                    {currentStep === 2 && (
                        <div className="space-y-4 animate-fade-in-up">
                            <h3 className="text-lg font-bold text-[#006D44] border-b pb-2">Paso 2: Cuestionario de Nutrición (Ritmo y Gastos)</h3>
                             <div><label className="block text-sm font-medium text-gray-700">¿Cuánto gastas en comida diariamente?</label><input type="text" name="daily_food_spending" value={formData.daily_food_spending || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg focus:ring-[#94c120] focus:border-[#94c120]"/></div>
                             <div><label className="block text-sm font-medium text-gray-700">¿Cuánto gastas en café?</label><input type="text" name="daily_coffee_spending" value={formData.daily_coffee_spending || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg focus:ring-[#94c120] focus:border-[#94c120]"/></div>
                             <div><label className="block text-sm font-medium text-gray-700">¿Cuánto gastas semanalmente en alcohol?</label><input type="text" name="weekly_alcohol_spending" value={formData.weekly_alcohol_spending || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg focus:ring-[#94c120] focus:border-[#94c120]"/></div>
                             <div><label className="block text-sm font-medium text-gray-700">¿Cuánto gastas semanalmente en comida para llevar o salir a comer?</label><input type="text" name="weekly_takeout_spending" value={formData.weekly_takeout_spending || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg focus:ring-[#94c120] focus:border-[#94c120]"/></div>
                        </div>
                    )}
                    {currentStep === 3 && (
                        <div className="p-6 border border-[#94c120] rounded-xl bg-[#f4f9f0] animate-fade-in-up">
                            <h3 className="text-xl font-bold text-[#006D44] mb-4 flex items-center">
                                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                Paso 3: Solución 80/20
                            </h3>
                            <p className="text-gray-700 mb-4 leading-relaxed">
                                "La mayoría de las personas cuando quieren perder peso simplemente dejan de comer para “bajar calorías” sin fijarse en la calidad nutricional. Haciendo eso se sienten mal, se enojan, y se cansan."
                            </p>
                             <p className="text-[#006D44] font-bold mb-2">Con nuestro plan Fuxion lograrás:</p>
                             <ul className="space-y-2">
                                <li className="flex items-center text-gray-700"><span className="text-green-500 mr-2">✓</span> Aumento de energía inmediato.</li>
                                <li className="flex items-center text-gray-700"><span className="text-green-500 mr-2">✓</span> No pasarás hambre (comida real).</li>
                                <li className="flex items-center text-gray-700"><span className="text-green-500 mr-2">✓</span> Tu cuerpo cambiará garantizado.</li>
                             </ul>
                        </div>
                    )}
                     {currentStep === 4 && (
                        <div className="space-y-4 animate-fade-in-up">
                            <h3 className="text-lg font-bold text-[#006D44] border-b pb-2">Paso 4: Referidos</h3>
                             <p className="text-sm text-gray-600 mb-4">Nominar hasta 5 personas para una Evaluación de Bienestar Gratuita.</p>
                            {[0, 1, 2, 3, 4].map(index => (
                                <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div className="col-span-1 sm:col-span-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Referido {index + 1}</div>
                                    <input type="text" name={`ref_name_${index}`} placeholder="Nombre" 
                                    value={formData.consultation_referrals?.[index]?.name || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-[#94c120] focus:border-[#94c120]"/>
                                    <input type="tel" name={`ref_phone_${index}`} placeholder="Teléfono" 
                                    value={formData.consultation_referrals?.[index]?.phone || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-[#94c120] focus:border-[#94c120]"/>
                                </div>
                            ))}
                        </div>
                    )}
                    {currentStep === 5 && (
                         <div className="space-y-4 animate-fade-in-up">
                            <h3 className="text-lg font-bold text-[#006D44] border-b pb-2">Paso 5: Notas del Coach y Feedback</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">¿Cómo te fue en la evaluación? (Feedback)</label>
                                <textarea name="mentor_feedback" value={formData.mentor_feedback || ''} onChange={handleChange} rows={4} className="w-full p-3 border rounded-lg focus:ring-[#94c120] focus:border-[#94c120] bg-gray-50" placeholder="Escribe aquí tus impresiones..."/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plan de acción / Notas del Coach</label>
                                <textarea name="coach_notes" value={formData.coach_notes || ''} onChange={handleChange} rows={4} className="w-full p-3 border rounded-lg focus:ring-[#94c120] focus:border-[#94c120] bg-gray-50" placeholder="Detalles del plan acordado..."/>
                            </div>
                         </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 rounded-b-xl border-t flex justify-between items-center gap-3">
                    <div>
                        {currentStep > 1 && <button onClick={prevStep} className="text-gray-600 font-semibold hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">Anterior</button>}
                    </div>
                     <div className="flex items-center gap-3">
                         <button type="button" onClick={() => handleSubmit(false)} className="hidden sm:block text-gray-600 bg-white border border-gray-300 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm">Guardar Borrador</button>
                         {currentStep === totalSteps ? (
                            <button type="button" onClick={() => handleSubmit(true)} disabled={progress < 100} className="bg-[#006D44] text-white py-2 px-6 rounded-lg font-bold shadow-lg hover:bg-[#005635] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Finalizar</button>
                         ) : (
                            <button onClick={nextStep} className="bg-[#006D44] text-white py-2 px-6 rounded-lg font-semibold shadow-md hover:bg-[#005635] transition-colors">Siguiente</button>
                         )}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default WellnessQuestionnaireForm;