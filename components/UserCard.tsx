
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
import CRMActionModal from './CRMActionModal';

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
    const [isCRMModalOpen, setCRMModalOpen] = useState(false);
    
    const [profileData, setProfileData] = useState<WellnessProfileData | null>(null);
    const [questionnaireData, setQuestionnaireData] = useState<WellnessQuestionnaireData | null>(null);
    const [isExporting, setIsExporting] = useState< 'profile' | 'questionnaire' | null>(null);
    const { addToast } = useToast();

    const statusOptions = ['Nuevo', 'Contactado', 'Evaluación Agendada', 'Evaluación Realizada', 'En Acompañamiento', 'Seguimiento (Post-Evaluación)', 'No Interesado'];
    
    // --- CRM LOGIC: Traffic Light ---
    const getLastInteractionDays = () => {
        if (!data.last_interaction) return 999;
        const lastDate = new Date(data.last_interaction);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    };

    const daysSinceContact = getLastInteractionDays();
    
    const getTrafficLightColor = () => {
        if (daysSinceContact <= 7) return 'bg-green-500'; // Seguro
        if (daysSinceContact <= 14) return 'bg-yellow-500'; // Riesgo medio
        return 'bg-red-500'; // Riesgo alto/Abandono
    };
    // --------------------------------

    const fetchDataForModals = useCallback(async () => {
        if (!data.id) return;
        try {
            const [profileRes, questionnaireRes] = await Promise.all([
                supabase.from('fuxion_profiles').select('*').eq('user_id', data.id).single(),
                supabase.from('fuxion_consultations').select('*').eq('user_id', data.id).single()
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

    const handleSendProfileLinkViaWhatsApp = () => {
        if (!data.id) return;
        const whatsappNumber = data.telefono.replace(/\D/g, '');
        const profileUrl = `${window.location.origin}/perfil-bienestar/${data.id}`;
        const message = `¡Hola ${data.nombre}! Para poder recomendarte los productos exactos que tu cuerpo necesita (y no gastar en lo que no), ayúdame con este breve perfil de hábitos:\n\n${profileUrl}`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    };

    const handleSaveProfile = async (formData: WellnessProfileData, isFinal: boolean) => {
        if (!data.id) return;
        const dataToSave = { ...formData, user_id: data.id };

        const { error } = await (profileData
            ? supabase.from('fuxion_profiles').update(dataToSave).eq('user_id', data.id)
            : supabase.from('fuxion_profiles').insert(dataToSave));

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
            ? supabase.from('fuxion_consultations').update(dataToSave).eq('user_id', data.id)
            : supabase.from('fuxion_consultations').insert(dataToSave));

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

    // Refresh list if CRM update happens
    const handleCRMUpdate = () => {
         // This is a bit hacky, but effectively we just want the parent to reload data. 
         // Ideally pass a callback from parent to reload list.
         // For now we rely on local state update or force reload if critical.
         // Actually, onUpdateStatus triggers a state update in parent, we can try to piggyback or just let the data be stale until refresh.
         // Better approach: The modal updates DB, next time we load/expand we see new data.
    };

    return (
        <div className={`bg-white rounded-lg shadow-md transition-all duration-300 border-l-4 relative overflow-hidden ${data.imc >= 25 ? 'border-orange-300' : 'border-green-300'}`}>
            
            {/* Traffic Light Indicator Strip */}
            <div className={`absolute top-0 right-0 w-3 h-3 m-2 rounded-full ${getTrafficLightColor()} shadow-sm z-10`} title={`Último contacto: hace ${daysSinceContact} días`}></div>

            <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-800">{data.nombre}</h3>
                            {profileData && (
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" title="Perfil Completado"></span>
                                </span>
                            )}
                             {/* Product Badges (Mini) */}
                             {Array.isArray(data.products) && data.products.length > 0 && (
                                <div className="hidden sm:flex gap-1 ml-2">
                                    {data.products.slice(0, 2).map((p, i) => (
                                        <span key={i} className="text-[9px] bg-gray-100 text-gray-600 px-1 rounded border border-gray-200">{p}</span>
                                    ))}
                                    {data.products.length > 2 && <span className="text-[9px] text-gray-400">+{data.products.length - 2}</span>}
                                </div>
                             )}
                        </div>
                        <p className="text-xs text-gray-500">{new Date(data.created_at || '').toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}</p>
                    </div>
                    <div className="flex items-center space-x-3 pr-4">
                         <span className={`text-sm font-bold px-2 ${data.imc >= 25 ? 'text-red-600' : 'text-green-600'}`}>
                            IMC: {data.imc}
                         </span>
                         <svg className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 text-sm bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <div>
                            <p className="font-bold text-gray-500 text-xs uppercase">Teléfono</p>
                            <p className="text-gray-800 font-medium">{data.telefono}</p>
                        </div>
                        <div>
                            <p className="font-bold text-gray-500 text-xs uppercase">Edad</p>
                            <p className="text-gray-800 font-medium">{data.edad} años</p>
                        </div>
                        <div>
                            <p className="font-bold text-gray-500 text-xs uppercase">Físico</p>
                            <p className="text-gray-800 font-medium">{data.peso} kg / {data.altura} cm</p>
                        </div>
                         <div>
                            <p className="font-bold text-gray-500 text-xs uppercase">Estado</p>
                             <select
                                value={currentStatus}
                                onChange={handleStatusChange}
                                className="w-full mt-1 p-1 text-xs border rounded bg-white focus:ring-1 focus:ring-green-500"
                             >
                                {statusOptions.map(option => <option key={option} value={option}>{option}</option>)}
                             </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Columna 1: Comunicación CRM */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">CRM & Estrategia</h4>
                            <div className="flex flex-col gap-2">
                                {/* CRM MAIN ACTION */}
                                <button onClick={() => setCRMModalOpen(true)} className="flex items-center justify-between bg-gradient-to-r from-gray-800 to-gray-700 hover:from-black hover:to-gray-900 text-white text-sm font-bold py-3 px-4 rounded-lg shadow-md transition-all">
                                    <div className="flex items-center">
                                        <span className={`w-3 h-3 rounded-full mr-3 ${getTrafficLightColor()} animate-pulse`}></span>
                                        <span>Estrategia & Seguimiento</span>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                </button>
                                
                                <button onClick={handleSendProfileLinkViaWhatsApp} className="flex items-center justify-center text-xs bg-white border border-green-600 text-green-600 hover:bg-green-50 font-semibold py-2.5 px-4 rounded-lg transition-colors">
                                    <span className="mr-2">🔗</span> Enviar Link de Perfil
                                </button>
                            </div>
                        </div>

                        {/* Columna 2: Herramientas de Venta */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Herramientas Coach</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {/* Perfil de Bienestar - PRIMARY TOOL */}
                                <button onClick={() => setProfileModalOpen(true)} className={`col-span-2 flex items-center justify-between text-sm font-medium py-3 px-4 rounded-lg transition-all border ${profileData ? 'bg-teal-50 border-teal-200 text-teal-800' : 'bg-white border-gray-300 text-gray-600 hover:border-teal-500 hover:text-teal-600'}`}>
                                    <div className="flex items-center">
                                        <FileTextIcon />
                                        <span className="ml-2">Perfil de Hábitos</span>
                                    </div>
                                    {profileData ? <span className="text-xs bg-teal-200 text-teal-800 px-2 py-0.5 rounded-full">Completado</span> : <span className="text-xs text-gray-400">Pendiente</span>}
                                </button>

                                {/* Downloads */}
                                <div className="flex gap-1 col-span-2">
                                    <button onClick={() => exportToPDF('profile')} disabled={!profileData || isExporting === 'profile'} className="flex-1 flex items-center justify-center py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg disabled:opacity-30 text-xs" title="Descargar Perfil PDF">
                                        {isExporting === 'profile' ? <LoadingSpinner /> : <><DownloadIcon /> Perfil PDF</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Notas Section */}
                    <div className="mt-4">
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Notas Privadas</label>
                            {isEditingNotes && (
                                <div className="flex space-x-2">
                                    <button onClick={() => { setIsEditingNotes(false); setNotes(data.notas || ''); }} className="text-xs text-gray-500 hover:text-gray-800 underline">Cancelar</button>
                                    <button onClick={handleSaveNotes} className="text-xs bg-gray-800 text-white py-1 px-3 rounded hover:bg-black">Guardar</button>
                                </div>
                            )}
                        </div>
                        
                        {isEditingNotes ? (
                            <textarea
                                ref={notesTextareaRef}
                                value={notes}
                                onChange={handleNotesChange}
                                className="w-full p-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none bg-white"
                                rows={3}
                                autoFocus
                            />
                        ) : (
                            <div 
                                onClick={() => setIsEditingNotes(true)} 
                                className="w-full p-3 text-sm border border-dashed border-gray-300 rounded-lg min-h-[60px] cursor-text bg-white hover:bg-gray-50 transition-colors"
                            >
                                {notes ? <span className="text-gray-700 whitespace-pre-wrap">{notes}</span> : <span className="text-gray-400 italic">Clic para añadir notas de seguimiento...</span>}
                            </div>
                        )}
                    </div>

                    {/* Delete Action */}
                    <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                        <button onClick={handleDeleteClick} className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline">
                            Eliminar Registro Permanentemente
                        </button>
                    </div>
                </div>
            )}
            
            {/* Modals */}
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
            {isCRMModalOpen && (
                <CRMActionModal 
                    data={data}
                    onClose={() => setCRMModalOpen(false)}
                    onUpdate={handleCRMUpdate}
                />
            )}
        </div>
    );
};

export default UserCard;
