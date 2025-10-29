import React, { useState, useCallback } from 'react';
import supabase from '../supabaseClient';
import { BmiData, WellnessProfileData, WellnessQuestionnaireData } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { useToast } from '../App';
import WellnessProfileForm from './WellnessProfileForm';
import WellnessQuestionnaireForm from './WellnessQuestionnaireForm';

interface QuickAccessModalProps {
    onClose: () => void;
}

const QuickAccessModal: React.FC<QuickAccessModalProps> = ({ onClose }) => {
    const [step, setStep] = useState<'lookup' | 'actions'>('lookup');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [foundUser, setFoundUser] = useState<BmiData | null>(null);
    const { addToast } = useToast();

    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    const [isQuestionnaireModalOpen, setQuestionnaireModalOpen] = useState(false);
    const [profileData, setProfileData] = useState<WellnessProfileData | null>(null);
    const [questionnaireData, setQuestionnaireData] = useState<WellnessQuestionnaireData | null>(null);

    const handleSearch = async () => {
        if (!phone.trim()) {
            addToast('Por favor, introduce un número de teléfono.', 'error');
            return;
        }
        setIsLoading(true);
        setFoundUser(null);

        try {
            const { data, error } = await supabase
                .from('registros_imc')
                .select('*')
                .eq('telefono', phone.trim())
                .single();

            if (error || !data) {
                addToast('No se encontró ningún participante con ese teléfono.', 'error');
                if (error && error.code !== 'PGRST116') console.error('Search error:', error);
            } else {
                setFoundUser(data as BmiData);
                setStep('actions');
            }
        } catch (err) {
            console.error(err);
            addToast('Ocurrió un error inesperado al buscar.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const resetLookup = () => {
        setPhone('');
        setFoundUser(null);
        setStep('lookup');
    };

    const openForm = useCallback(async (formType: 'profile' | 'questionnaire') => {
        if (!foundUser?.id) return;
        setIsLoading(true);
        try {
            const [profileRes, questionnaireRes] = await Promise.all([
                supabase.from('wellness_profiles').select('*').eq('user_id', foundUser.id).single(),
                supabase.from('wellness_consultations').select('*').eq('user_id', foundUser.id).single()
            ]);

            if (profileRes.error && profileRes.error.code !== 'PGRST116') throw profileRes.error;
            setProfileData(profileRes.data);

            if (questionnaireRes.error && questionnaireRes.error.code !== 'PGRST116') throw questionnaireRes.error;
            setQuestionnaireData(questionnaireRes.data);

            if (formType === 'profile') {
                setProfileModalOpen(true);
            } else {
                setQuestionnaireModalOpen(true);
            }

        } catch (err: any) {
            console.error("Error fetching data for forms:", err);
            addToast(`Error al cargar datos del formulario: ${err.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [foundUser?.id, addToast]);
    
    const handleSaveProfile = async (formData: WellnessProfileData, isFinal: boolean) => {
        if (!foundUser?.id) return;
        const dataToSave = { ...formData, user_id: foundUser.id };

        const { error } = await (profileData
            ? supabase.from('wellness_profiles').update(dataToSave).eq('user_id', foundUser.id)
            : supabase.from('wellness_profiles').insert(dataToSave));

        if (error) {
            addToast(`Error al guardar el perfil: ${error.message}`, 'error');
        } else {
            addToast('Perfil guardado con éxito.', 'success');
            setProfileModalOpen(false);
        }
    };

    const handleSaveQuestionnaire = async (formData: WellnessQuestionnaireData, isFinal: boolean) => {
        if (!foundUser?.id) return;
        const dataToSave = { ...formData, user_id: foundUser.id };

        const { error } = await (questionnaireData
            ? supabase.from('wellness_consultations').update(dataToSave).eq('user_id', foundUser.id)
            : supabase.from('wellness_consultations').insert(dataToSave));

        if (error) {
            addToast(`Error al guardar el cuestionario: ${error.message}`, 'error');
        } else {
            addToast('Cuestionario guardado con éxito.', 'success');
            setQuestionnaireModalOpen(false);
        }
    };


    const renderLookupStep = () => (
        <>
            <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">Acciones de Evaluación</h2>
            <p className="text-center text-gray-600 mb-6">Busca un participante por su número de teléfono para acceder a los formularios de evaluación.</p>
            <div className="space-y-4">
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Número de teléfono"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center disabled:bg-gray-400"
                >
                    {isLoading ? <LoadingSpinner /> : 'Buscar Participante'}
                </button>
            </div>
        </>
    );

    const renderActionsStep = () => (
        <>
            <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">
                <span className="text-blue-600">{foundUser?.nombre}</span>
            </h2>
            <p className="text-center text-gray-600 mb-6">Selecciona una acción de evaluación para continuar.</p>
            <div className="space-y-3">
                 <button onClick={() => openForm('profile')} className="w-full text-left flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors">
                    Realizar Perfil de Bienestar
                </button>
                <button onClick={() => openForm('questionnaire')} className="w-full text-left flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors">
                    Realizar Cuestionario de Evaluación
                </button>
            </div>
             <div className="mt-6 text-center">
                <button onClick={resetLookup} className="text-sm text-blue-600 hover:underline">
                    &larr; Volver a buscar
                </button>
            </div>
        </>
    );

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
                <div 
                    className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md transform transition-all relative"
                    onClick={(e) => e.stopPropagation()}
                >
                     <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Cerrar modal"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    {step === 'lookup' ? renderLookupStep() : renderActionsStep()}
                </div>
            </div>

            {isProfileModalOpen && foundUser && (
                <WellnessProfileForm
                    userId={foundUser.id!}
                    existingData={profileData}
                    onSave={handleSaveProfile}
                    onClose={() => setProfileModalOpen(false)}
                />
            )}
            {isQuestionnaireModalOpen && foundUser && (
                 <WellnessQuestionnaireForm
                    userId={foundUser.id!}
                    existingData={questionnaireData}
                    onSave={handleSaveQuestionnaire}
                    onClose={() => setQuestionnaireModalOpen(false)}
                />
            )}
        </>
    );
};

export default QuickAccessModal;
