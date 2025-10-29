import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WellnessQuestionnaireData } from '../types';
import ProgressBar from './ProgressBar';

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

    const totalSteps = 5;

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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div ref={formRef} className="bg-white rounded-lg shadow-2xl w-full max-w-2xl transform transition-all max-h-[90vh] flex flex-col">
                <div className="p-6 border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Cuestionario de Evaluación de Bienestar</h2>
                            <p className="text-sm text-gray-500">Paso {currentStep} de {totalSteps}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                    </div>
                     <div className="mt-4">
                        <ProgressBar percentage={progress} />
                    </div>
                </div>
                
                 <div className="p-6 space-y-6 overflow-y-auto">
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-700">Paso 1: Objetivo - Conectar</h3>
                            <div><label className="block text-sm font-medium">Talla de ropa:</label><input type="text" name="clothing_size" value={formData.clothing_size || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded"/></div>
                            <div><label className="block text-sm font-medium">3 partes del cuerpo que te gustaría mejorar:</label><input type="text" name="body_parts_to_improve" value={formData.body_parts_to_improve || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded"/></div>
                            <div><label className="block text-sm font-medium">¿Qué has hecho antes para intentarlo?</label><input type="text" name="previous_attempts" value={formData.previous_attempts || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded"/></div>
                            <div><label className="block text-sm font-medium">¿Qué tienes en tu armario que podríamos usar como objetivo?</label><input type="text" name="wardrobe_goal" value={formData.wardrobe_goal || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded"/></div>
                            <div><label className="block text-sm font-medium">¿Cómo te beneficiaría lograr estos objetivos?</label><input type="text" name="benefit_of_achieving_goals" value={formData.benefit_of_achieving_goals || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded"/></div>
                            <div><label className="block text-sm font-medium">¿Qué tienes planeado para los próximos 3 a 6 meses?</label><input type="text" name="plan_3_to_6_months" value={formData.plan_3_to_6_months || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded"/></div>
                            <div><label className="block text-sm font-medium">¿Qué te impulsó hoy finalmente a hacer algo al respecto? (Apego emocional)</label><input type="text" name="motivation_today" value={formData.motivation_today || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded"/></div>
                            <div><label className="block text-sm font-medium">En una escala del 1 al 10, ¿qué tan listo te sientes para comenzar? ({formData.readiness_scale})</label><input type="range" name="readiness_scale" value={formData.readiness_scale || 0} onChange={handleChange} min="1" max="10" className="w-full mt-1"/></div>
                        </div>
                    )}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-700">Paso 2: Cuestionario de Nutrición (Ritmo y Gastos)</h3>
                             <div><label className="block text-sm font-medium">¿Cuánto gastas en comida diariamente?</label><input type="text" name="daily_food_spending" value={formData.daily_food_spending || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded"/></div>
                             <div><label className="block text-sm font-medium">¿Cuánto gastas en café?</label><input type="text" name="daily_coffee_spending" value={formData.daily_coffee_spending || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded"/></div>
                             <div><label className="block text-sm font-medium">¿Cuánto gastas semanalmente en alcohol?</label><input type="text" name="weekly_alcohol_spending" value={formData.weekly_alcohol_spending || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded"/></div>
                             <div><label className="block text-sm font-medium">¿Cuánto gastas semanalmente en comida para llevar o salir a comer?</label><input type="text" name="weekly_takeout_spending" value={formData.weekly_takeout_spending || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded"/></div>
                        </div>
                    )}
                    {currentStep === 3 && (
                        <div className="p-4 border rounded-lg bg-green-50">
                            <h3 className="text-lg font-semibold text-green-800">Paso 3: Solución 80/20 (Guion para el Coach)</h3>
                            <p className="mt-2 text-gray-700">La mayoría de las personas cuando quieren perder peso simplemente dejan de comer para “bajar calorías” sin fijarse en la calidad nutricional de lo que comen. Haciendo eso se sienten horrible, se enojan, se sienten cansados.</p>
                             <p className="mt-2 text-gray-700 font-semibold">Con nuestro plan bajaremos el consumo calórico a la vez que aportamos muchos nutrientes a tu dieta. Si hacemos las cosas bien, tres cosas van a pasar:</p>
                             <ul className="list-disc list-inside mt-2 text-gray-700 space-y-1">
                                <li>Aumento de energía.</li>
                                <li>No pasarás hambre.</li>
                                <li>Tu cuerpo comenzará a cambiar, ¡garantizado! Es respaldado por la ciencia.</li>
                             </ul>
                        </div>
                    )}
                     {currentStep === 4 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-700">Paso 4: Referidos</h3>
                             <p className="text-sm text-gray-600">Puedes nominar hasta 5 personas para una Evaluación de Bienestar Gratuita.</p>
                            {[0, 1, 2, 3, 4].map(index => (
                                <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input type="text" name={`ref_name_${index}`} placeholder={`Nombre referido ${index + 1}`} 
                                    value={formData.consultation_referrals?.[index]?.name || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg"/>
                                    <input type="tel" name={`ref_phone_${index}`} placeholder={`Teléfono referido ${index + 1}`} 
                                    value={formData.consultation_referrals?.[index]?.phone || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg"/>
                                </div>
                            ))}
                        </div>
                    )}
                    {currentStep === 5 && (
                         <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-700">Paso 5: Notas del Coach y Feedback</h3>
                            <div><label className="block text-sm font-medium">¿Cómo te fue en la evaluación? (Notas para tu mentor)</label><textarea name="mentor_feedback" value={formData.mentor_feedback || ''} onChange={handleChange} rows={4} className="w-full mt-1 p-2 border rounded"/></div>
                            <div><label className="block text-sm font-medium">Plan de acción / Notas adicionales (Para ti)</label><textarea name="coach_notes" value={formData.coach_notes || ''} onChange={handleChange} rows={4} className="w-full mt-1 p-2 border rounded"/></div>
                         </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-between items-center gap-3">
                    <div>
                        {currentStep > 1 && <button onClick={prevStep} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300">Anterior</button>}
                    </div>
                     <div className="flex items-center gap-3">
                         <button type="button" onClick={() => handleSubmit(false)} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300">Guardar Avance</button>
                         {currentStep === totalSteps ? (
                            <button type="button" onClick={() => handleSubmit(true)} disabled={progress < 100} className="bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400">Finalizar y Guardar</button>
                         ) : (
                            <button onClick={nextStep} className="bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700">Siguiente</button>
                         )}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default WellnessQuestionnaireForm;
