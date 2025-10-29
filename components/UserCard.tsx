import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { BmiData } from '../types';
import { WhatsappIcon } from './icons/WhatsappIcon';
import WellnessProfileForm from './WellnessProfileForm';
import { WellnessProfileData, WellnessQuestionnaireData } from '../types';
import supabase from '../supabaseClient';
import { FileTextIcon, ClipboardListIcon, DownloadIcon } from './icons/DocumentIcon';
import WellnessQuestionnaireForm from './WellnessQuestionnaireForm';
import WellnessProfilePDF from './pdf/WellnessProfilePDF';
import WellnessQuestionnairePDF from './pdf/WellnessQuestionnairePDF';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '../App';
import LoadingSpinner from './LoadingSpinner';

interface UserCardProps {
    data: BmiData;
    onDelete: (id: number) => void;
    onUpdateStatus: (id: number, newStatus: string) => void;
    onUpdateNotes: (id: number, newNotes: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ data, onDelete, onUpdateStatus, onUpdateNotes }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(data.estado || 'Nuevo');
    const [notes, setNotes] = useState(data.notas || '');
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    const [isQuestionnaireModalOpen, setQuestionnaireModalOpen] = useState(false);
    const [profileData, setProfileData] = useState<WellnessProfileData | null>(null);
    const [questionnaireData, setQuestionnaireData] = useState<WellnessQuestionnaireData | null>(null);
    const [isExporting, setIsExporting] = useState< 'profile' | 'questionnaire' | null>(null);
    const { addToast } = useToast();

    const statusOptions = ['Nuevo', 'Contactado', 'Evaluación Agendada', 'Evaluación Realizada', 'En Acompañamiento', 'Seguimiento (Post-Evaluación)', 'No Interesado'];
    const statusColors: { [key: string]: string } = {
        'Nuevo': 'bg-blue-100 text-blue-800',
        'Contactado': 'bg-yellow-100 text-yellow-800',
        'Evaluación Agendada': 'bg-purple-100 text-purple-800',
        'Evaluación Realizada': 'bg-indigo-100 text-indigo-800',
        'En Acompañamiento': 'bg-green-100 text-green-800',
        'Seguimiento (Post-Evaluación)': 'bg-pink-100 text-pink-800',
        'No Interesado': 'bg-red-100 text-red-800',
    };
    
    const getCategoryColor = (category: string) => {
        const lowerCaseCategory = category.toLowerCase();
        if (lowerCaseCategory.includes('obesidad')) return 'border-red-500';
        if (lowerCaseCategory.includes('sobrepeso')) return 'border-yellow-500';
        if (lowerCaseCategory.includes('peso normal')) return 'border-green-500';
        if (lowerCaseCategory.includes('bajo peso')) return 'border-blue-500';
        return 'border-gray-300';
    };

    const fetchDataForModals = useCallback(async () => {
        if (!data.id) return;
        try {
            const [profileRes, questionnaireRes] = await Promise.all([
                supabase.from('wellness_profiles').select('*').eq('user_id', data.id).single(),
                supabase.from('wellness_consultations').select('*').eq('user_id', data.id).single()
            ]);

            if (profileRes.error && profileRes.error.code !== 'PGRST116') throw profileRes.error;
            setProfileData(profileRes.data);

            if (questionnaireRes.error && questionnaireRes.error.code !== 'PGRST116') throw questionnaireRes.error;
            setQuestionnaireData(questionnaireRes.data);

        } catch (err: any) {
            console.error("Error fetching data:", err);
            addToast(`Error al cargar datos: ${err.message}`, 'error');
        }
    }, [data.id, addToast]);

    useEffect(() => {
        if (isExpanded) {
            fetchDataForModals();
        }
    }, [isExpanded, fetchDataForModals]);


    useEffect(() => {
        if (isEditingNotes && notesTextareaRef.current) {
            notesTextareaRef.current.style.height = 'auto';
            notesTextareaRef.current.style.height = `${notesTextareaRef.current.scrollHeight}px`;
        }
    }, [isEditingNotes, notes]);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        setCurrentStatus(newStatus);
        if(data.id) {
            onUpdateStatus(data.id, newStatus);
        }
    };

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
        if (notesTextareaRef.current) {
            notesTextareaRef.current.style.height = 'auto';
            notesTextareaRef.current.style.height = `${notesTextareaRef.current.scrollHeight}px`;
        }
    };

    const handleSaveNotes = () => {
        if (data.id) {
            onUpdateNotes(data.id, notes);
            setIsEditingNotes(false);
        }
    };

    const handleDeleteClick = () => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar a ${data.nombre}? Esta acción no se puede deshacer.`)) {
            if (data.id) {
                onDelete(data.id);
            }
        }
    };
    
    const handleWhatsAppClick = () => {
        const whatsappNumber = data.telefono.replace(/\D/g, '');
        const message = `¡Hola ${data.nombre}! Soy Cindy, tu coach de bienestar. Recibí tu evaluación y estoy emocionada de que comencemos juntos tu transformación. ¿Te parece si coordinamos una llamada para conversar sobre tus metas? 😊`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    };

    const handleSaveProfile = async (formData: WellnessProfileData, isFinal: boolean) => {
        if (!data.id) return;
        const dataToSave = { ...formData, user_id: data.id };

        const { error } = await (profileData
            ? supabase.from('wellness_profiles').update(dataToSave).eq('user_id', data.id)
            : supabase.from('wellness_profiles').insert(dataToSave));

        if (error) {
            console.error('Error saving profile:', error);
            addToast(`Error al guardar el perfil: ${error.message}`, 'error');
        } else {
            addToast('Perfil guardado con éxito.', 'success');
            setProfileModalOpen(false);
            fetchDataForModals();
            if (!profileData || isFinal) {
                onUpdateStatus(data.id, 'Evaluación Realizada');
            }
        }
    };
    
    const handleSaveQuestionnaire = async (formData: WellnessQuestionnaireData, isFinal: boolean) => {
        if (!data.id) return;
        const dataToSave = { ...formData, user_id: data.id };

        const { error } = await (questionnaireData
            ? supabase.from('wellness_consultations').update(dataToSave).eq('user_id', data.id)
            : supabase.from('wellness_consultations').insert(dataToSave));

        if (error) {
            console.error('Error saving questionnaire:', error);
            addToast(`Error al guardar el cuestionario: ${error.message}`, 'error');
        } else {
            addToast('Cuestionario guardado con éxito.', 'success');
            setQuestionnaireModalOpen(false);
            fetchDataForModals();
            if (!questionnaireData || isFinal) {
                onUpdateStatus(data.id, 'Evaluación Realizada');
            }
        }
    };

    const exportToPDF = async (type: 'profile' | 'questionnaire') => {
        setIsExporting(type);
        let componentToRender;
        let fileName;
    
        if (type === 'profile' && profileData) {
            componentToRender = <WellnessProfilePDF data={profileData} userData={data} />;
            fileName = `Perfil_de_Bienestar_${data.nombre.replace(/\s/g, '_')}.pdf`;
        } else if (type === 'questionnaire' && questionnaireData) {
            componentToRender = <WellnessQuestionnairePDF data={questionnaireData} userData={data} />;
            fileName = `Cuestionario_de_Evaluacion_${data.nombre.replace(/\s/g, '_')}.pdf`;
        } else {
            addToast('No hay datos para exportar.', 'error');
            setIsExporting(null);
            return;
        }
    
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.width = '794px';
        document.body.appendChild(container);
    
        const root = ReactDOM.createRoot(container);
        root.render(componentToRender);
    
        setTimeout(async () => {
            try {
                const canvas = await html2canvas(container, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const ratio = canvas.width / canvas.height;
                const imgHeight = pdfWidth / ratio;
                let height = imgHeight;
                let position = 0;
                let pageCount = 1;

                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, height);
                let remainingHeight = height - pdfHeight;
                
                while (remainingHeight > 0) {
                    position -= pdfHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, height);
                    remainingHeight -= pdfHeight;
                    pageCount++;
                }

                pdf.save(fileName);
                addToast('PDF generado correctamente.', 'success');
            } catch (error) {
                console.error('Error generating PDF:', error);
                addToast('Error al generar el PDF.', 'error');
            } finally {
                root.unmount();
                document.body.removeChild(container);
                setIsExporting(null);
            }
        }, 500);
    };

    return (
        <div className={`bg-white rounded-lg shadow-md transition-all duration-300 border-l-4 ${getCategoryColor(data.categoria)}`}>
            <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">{data.nombre}</h3>
                        <p className="text-sm text-gray-500">{new Date(data.created_at || '').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[currentStatus] || 'bg-gray-100 text-gray-800'}`}>
                            {currentStatus}
                        </span>
                         <span className={`text-lg font-bold ${data.imc >= 25 ? 'text-red-600' : 'text-green-600'}`}>
                            {data.imc}
                         </span>
                         <svg className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="p-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                            <p className="font-semibold text-gray-600">Teléfono</p>
                            <p className="text-gray-800">{data.telefono}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-600">Edad</p>
                            <p className="text-gray-800">{data.edad} años</p>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-600">Peso/Altura</p>
                            <p className="text-gray-800">{data.peso} kg / {data.altura} cm</p>
                        </div>
                         <div>
                            <p className="font-semibold text-gray-600">Categoría</p>
                            <p className="text-gray-800 font-medium">{data.categoria}</p>
                        </div>
                    </div>

                     <div className="mb-6 pt-4 border-t">
                        <label className="block text-sm font-semibold text-gray-600 mb-2">Acciones de Evaluación</label>
                        <div className="flex flex-wrap gap-2">
                             <button onClick={() => setProfileModalOpen(true)} className="flex items-center text-sm bg-teal-100 hover:bg-teal-200 text-teal-800 font-medium py-2 px-3 rounded-lg transition-colors">
                                <FileTextIcon />
                                {profileData ? 'Ver / Editar Perfil' : 'Realizar Perfil'}
                            </button>
                            <button onClick={() => setQuestionnaireModalOpen(true)} className="flex items-center text-sm bg-sky-100 hover:bg-sky-200 text-sky-800 font-medium py-2 px-3 rounded-lg transition-colors">
                                <ClipboardListIcon />
                                {questionnaireData ? 'Ver Cuestionario' : 'Realizar Cuestionario'}
                            </button>
                             {profileData && (
                                <button onClick={() => exportToPDF('profile')} disabled={isExporting === 'profile'} className="flex items-center text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-3 rounded-lg transition-colors disabled:bg-gray-200 disabled:cursor-wait">
                                    {isExporting === 'profile' ? <LoadingSpinner/> : <DownloadIcon />}
                                    Exportar Perfil
                                </button>
                            )}
                            {questionnaireData && (
                                <button onClick={() => exportToPDF('questionnaire')} disabled={isExporting === 'questionnaire'} className="flex items-center text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-3 rounded-lg transition-colors disabled:bg-gray-200 disabled:cursor-wait">
                                    {isExporting === 'questionnaire' ? <LoadingSpinner/> : <DownloadIcon />}
                                    Exportar Cuestionario
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="mb-4">
                         <label className="block text-sm font-semibold text-gray-600 mb-2">Cambiar Estado</label>
                         <select
                            value={currentStatus}
                            onChange={handleStatusChange}
                            className="w-full sm:w-auto p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                         >
                            {statusOptions.map(option => <option key={option} value={option}>{option}</option>)}
                         </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">Notas</label>
                        {isEditingNotes ? (
                            <>
                                <textarea
                                    ref={notesTextareaRef}
                                    value={notes}
                                    onChange={handleNotesChange}
                                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none overflow-hidden"
                                    rows={3}
                                    placeholder="Añadir notas sobre el seguimiento, próximas citas, etc."
                                />
                                <div className="flex justify-end space-x-2 mt-2">
                                    <button onClick={() => { setIsEditingNotes(false); setNotes(data.notas || ''); }} className="text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                                    <button onClick={handleSaveNotes} className="text-sm bg-green-600 text-white py-1 px-3 rounded-lg hover:bg-green-700">Guardar</button>
                                </div>
                            </>
                        ) : (
                            <div onClick={() => setIsEditingNotes(true)} className="w-full p-2 border border-dashed rounded-lg min-h-[60px] cursor-text whitespace-pre-wrap text-gray-700">
                                {notes || <span className="text-gray-400">Haz clic para añadir una nota...</span>}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex justify-end items-center space-x-3 mt-4">
                        <button onClick={handleWhatsAppClick} className="flex items-center text-sm text-green-600 hover:text-green-800 font-semibold p-2 rounded-lg hover:bg-green-50 transition-colors">
                            <WhatsappIcon />
                            <span className="ml-1.5">Enviar Mensaje</span>
                        </button>
                        <button onClick={handleDeleteClick} className="text-sm text-red-600 hover:text-red-800 font-semibold p-2 rounded-lg hover:bg-red-50 transition-colors">
                            Eliminar
                        </button>
                    </div>
                </div>
            )}
            {isProfileModalOpen && (
                <WellnessProfileForm
                    userId={data.id!}
                    existingData={profileData}
                    onSave={handleSaveProfile}
                    onClose={() => setProfileModalOpen(false)}
                />
            )}
            {isQuestionnaireModalOpen && (
                 <WellnessQuestionnaireForm
                    userId={data.id!}
                    existingData={questionnaireData}
                    onSave={handleSaveQuestionnaire}
                    onClose={() => setQuestionnaireModalOpen(false)}
                />
            )}
        </div>
    );
};

export default UserCard;
