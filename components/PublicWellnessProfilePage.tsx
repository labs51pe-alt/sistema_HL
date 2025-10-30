import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WellnessProfileData, BmiData } from '../types';
import supabase from '../supabaseClient';
import HeaderIcon from './icons/HeaderIcon';
import LoadingSpinner from './LoadingSpinner';
import ProgressBar from './ProgressBar';
import SuccessDisplay from './SuccessDisplay';
import { useToast } from '../App';

interface PublicWellnessProfilePageProps {
    userId: number;
}

const PublicWellnessProfilePage: React.FC<PublicWellnessProfilePageProps> = ({ userId }) => {
    const [user, setUser] = useState<BmiData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { addToast } = useToast();

    // Initial form state structure
    const initialData = useMemo(() => ({
        user_id: userId,
        goals: [], other_goals: '',
        referrals: [{ name: '', phone: '' }, { name: '', phone: '' }, { name: '', phone: '' }],
        wake_up_time: '', sleep_time: '', eats_breakfast: null, breakfast_time: '',
        breakfast_details: '', water_intake: '', other_drinks: '', snacks: '',
        fruit_veg_portions: '', low_energy_time: '', exercise_frequency: '',
        eats_more_at_night: false, food_challenge: '', alcohol_per_week: '',
        daily_food_spending: '', free_meal_interest: null,
    }), [userId]);

    const [formData, setFormData] = useState<WellnessProfileData>(initialData);
    const formRef = useRef<HTMLDivElement>(null);

    // Required fields for progress calculation
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

    // Fetch user and existing profile data on component mount
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);

            // First, check if a profile already exists.
            const { data: profileData, error: profileError } = await supabase
                .from('wellness_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();
            
            if (profileError && profileError.code !== 'PGRST116') {
                 console.error("Error fetching profile data", profileError);
                 addToast('Error al cargar tu perfil.', 'error');
                 setIsLoading(false);
                 return;
            }

            // If profile exists, user has already submitted. Show success page.
            if (profileData) {
                setFormData(prev => ({...prev, ...profileData}));
                setIsSuccess(true);
                setIsLoading(false);
                return;
            }

            // If no profile, fetch user name to display on the form.
            const { data: userData, error: userError } = await supabase
                .from('registros_imc')
                .select('nombre')
                .eq('id', userId)
                .single();

            if (userError || !userData) {
                console.error("Error fetching user data", userError);
                addToast('No se pudo encontrar tu registro. Contacta a tu coach.', 'error');
            } else {
                 setUser(userData as BmiData);
            }
            
            setIsLoading(false);
        };
        fetchData();
    }, [userId, addToast]);


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
            let newReferrals = [...(formData.referrals || Array(3).fill({ name: '', phone: '' }))];
            
            while (newReferrals.length <= index) {
                newReferrals.push({ name: '', phone: '' });
            }
            
            if (!newReferrals[index]) newReferrals[index] = { name: '', phone: '' };

            newReferrals[index] = { ...newReferrals[index], [field]: value };
            setFormData(prev => ({...prev, referrals: newReferrals}));
        } else {
             setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
            }));
        }
    };
    
    // Function to save data (used by both buttons)
    const performSave = async () => {
        const cleanedReferrals = formData.referrals?.filter(r => r && (r.name.trim() !== '' || r.phone.trim() !== ''));
        const sanitizedData: WellnessProfileData = {
            ...formData,
            referrals: cleanedReferrals,
            wake_up_time: formData.wake_up_time || undefined,
            sleep_time: formData.sleep_time || undefined,
            breakfast_time: formData.breakfast_time || undefined,
        };
        
        const { data: existingProfile } = await supabase
            .from('wellness_profiles')
            .select('id')
            .eq('user_id', userId)
            .single();

        const { error } = await (existingProfile
            ? supabase.from('wellness_profiles').update(sanitizedData).eq('user_id', userId)
            : supabase.from('wellness_profiles').insert(sanitizedData));
        
        if (error) {
            addToast(`Error al guardar el perfil: ${error.message}`, 'error');
            return false;
        }
        return true;
    };
    
    const handleSaveProgress = async () => {
        setIsSubmitting(true);
        const success = await performSave();
        if (success) {
            addToast('Progreso guardado con éxito.', 'success');
        }
        setIsSubmitting(false);
    };

    const handleSubmit = async () => {
        if (progress < 100) {
            addToast('Por favor, completa todos los campos marcados con *.', 'error');
            return;
        }
        setIsSubmitting(true);
        const success = await performSave();
        
        if (success) {
            await supabase
                .from('registros_imc')
                .update({ estado: 'Evaluación Realizada' })
                .eq('id', userId);
            setIsSuccess(true);
        }
        setIsSubmitting(false);
    };
    
    const goalsOptions = [
        { value: 'perder_peso', label: 'Perder peso' },
        { value: 'aumentar_energia', label: 'Aumentar energía' },
        { value: 'mejorar_rendimiento', label: 'Mejorar rendimiento físico' },
        { value: 'tonificar', label: 'Tonificar/bajar %grasa' },
        { value: 'aumentar_masa_muscular', label: 'Aumentar masa muscular' },
        { value: 'mejorar_salud', label: 'Mejorar salud' },
    ];
    
    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Cargando perfil...</div>;
    }
    
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center font-sans p-4">
                 <header className="mb-8 text-center w-full max-w-2xl">
                    <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-lg mb-4">
                        <HeaderIcon />
                    </div>
                </header>
                <main className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
                     <SuccessDisplay 
                        title="¡Perfil Recibido!"
                        message="Gracias por completar tu información. Tu coach se pondrá en contacto contigo muy pronto para discutir los siguientes pasos."
                    />
                </main>
            </div>
        );
    }
    
    if (!user) {
         return <div className="min-h-screen flex items-center justify-center text-red-500">Error: No se pudo cargar la información del usuario.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center font-sans p-4">
            <header className="mb-8 text-center w-full max-w-2xl">
                <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-lg mb-4">
                    <HeaderIcon />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
                    Tu Perfil de Bienestar
                </h1>
            </header>
            <main ref={formRef} className="bg-white rounded-lg shadow-2xl w-full max-w-2xl transform transition-all flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">¡Hola, <span className="text-green-600">{user?.nombre}</span>!</h2>
                    <p className="text-sm text-gray-500">Completa el siguiente formulario para que podamos conocerte mejor.</p>
                    <div className="mt-4"><ProgressBar percentage={progress} /></div>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
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
                            <input type="text" name="other_goals" value={formData.other_goals || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500" />
                        </div>
                    </div>

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

                    <div className="p-4 border rounded-lg bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Análisis de Nutrición y Salud</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hora de despertar: <span className="text-red-500">*</span></label>
                                <input type="time" name="wake_up_time" value={formData.wake_up_time || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hora de dormir: <span className="text-red-500">*</span></label>
                                <input type="time" name="sleep_time" value={formData.sleep_time || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">¿A qué hora desayunas?</label>
                                <input type="time" name="breakfast_time" value={formData.breakfast_time || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué desayunas?</label>
                                <input type="text" name="breakfast_details" value={formData.breakfast_details || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">En promedio, ¿cuánta agua bebes al día? <span className="text-red-500">*</span></label>
                                <input type="text" name="water_intake" value={formData.water_intake || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Otras bebidas (jugos, refrescos, etc.)</label>
                                <input type="text" name="other_drinks" value={formData.other_drinks || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meriendas entre comidas</label>
                                <input type="text" name="snacks" value={formData.snacks || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Porciones de frutas y verduras al día <span className="text-red-500">*</span></label>
                                <input type="text" name="fruit_veg_portions" value={formData.fruit_veg_portions || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hora en la que sientes menos energía</label>
                                <input type="text" name="low_energy_time" value={formData.low_energy_time || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">¿Con qué frecuencia te ejercitas? <span className="text-red-500">*</span></label>
                                <input type="text" name="exercise_frequency" value={formData.exercise_frequency || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">¿Cuál es tu mayor reto con respecto a la comida? <span className="text-red-500">*</span></label>
                                <input type="text" name="food_challenge" value={formData.food_challenge || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bebidas alcohólicas por semana</label>
                                <input type="text" name="alcohol_per_week" value={formData.alcohol_per_week || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">¿Cuánto dinero gastas en comida diariamente? <span className="text-red-500">*</span></label>
                                <input type="text" name="daily_food_spending" value={formData.daily_food_spending || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                            </div>
                        </div>
                    </div>
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
                    <button type="button" onClick={handleSaveProgress} disabled={isSubmitting}
                        className="bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center">
                        {isSubmitting ? <LoadingSpinner /> : 'Guardar Avance'}
                    </button>
                    <button type="button" onClick={handleSubmit} disabled={isSubmitting || progress < 100} 
                    className="bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center">
                        {isSubmitting ? <LoadingSpinner /> : 'Enviar mi Perfil'}
                    </button>
                </div>
            </main>
        </div>
    );
};

export default PublicWellnessProfilePage;
