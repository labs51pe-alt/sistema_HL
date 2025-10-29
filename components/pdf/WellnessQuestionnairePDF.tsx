import React from 'react';
import { WellnessQuestionnaireData, BmiData } from '../../types';
import HerbalifeLogo from '../icons/HerbalifeLogo';

interface WellnessQuestionnairePDFProps {
    data: WellnessQuestionnaireData;
    userData: BmiData;
}

const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`mb-4 ${className}`}>
        <div className="bg-[#94c120] text-white font-bold p-2 rounded-t-md text-center">
            {title}
        </div>
        <div className="border border-t-0 p-3 rounded-b-md">
            {children}
        </div>
    </div>
);

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex border-b py-1.5">
        <p className="w-1/2 font-bold text-gray-700">{label}:</p>
        <p className="w-1/2 text-gray-600">{value || <span className="text-gray-400">No especificado</span>}</p>
    </div>
);

const WellnessQuestionnairePDF: React.FC<WellnessQuestionnairePDFProps> = ({ data, userData }) => {
    return (
         <div className="bg-white p-8 font-sans text-sm" style={{ width: '794px' }}>
            <header className="flex justify-between items-center mb-2">
                <HerbalifeLogo className="h-12 w-auto" />
                <div>
                     <h1 className="text-2xl font-bold text-gray-800 text-right">Cuestionario de Evaluación de Bienestar</h1>
                     <p className="text-xs text-gray-500 text-right mt-1">(lo va rellenando el Coach mientras hace la Evaluación de Bienestar)</p>
                </div>
            </header>
            
            <div className="grid grid-cols-2 gap-x-8 mt-4 mb-4 pb-4 border-b">
                 <InfoRow label="Nombre" value={userData.nombre} />
                 <InfoRow label="Fecha" value={new Date(data.created_at || userData.created_at || '').toLocaleDateString('es-ES')} />
            </div>

            <Section title="Objetivo - Conectar">
                 <InfoRow label="¿Qué talla de ropa?" value={data.clothing_size} />
                 <InfoRow label="3 partes del cuerpo que te gustaría mejorar" value={data.body_parts_to_improve} />
                 <InfoRow label="¿Qué has hecho antes para intentarlo?" value={data.previous_attempts} />
                 <InfoRow label="¿Qué tienes en tu armario que podríamos usar como objetivo?" value={data.wardrobe_goal} />
                 <InfoRow label="¿Cómo te beneficiaría lograr estos objetivos?" value={data.benefit_of_achieving_goals} />
                 <InfoRow label="¿Qué tienes planeado para los próximos 3 a 6 meses?" value={data.plan_3_to_6_months} />
                 <InfoRow label="¿Qué te impulsó hoy? (Apego Emocional)" value={data.motivation_today} />
                 <InfoRow label="Escala de disposición (1-10)" value={data.readiness_scale} />
            </Section>
            
             <div className="grid grid-cols-2 gap-x-4">
                 <div className="col-span-1">
                     <Section title="Cuestionario de nutrición">
                         <InfoRow label="Gasto diario en comida" value={data.daily_food_spending} />
                         <InfoRow label="Gasto diario en café" value={data.daily_coffee_spending} />
                         <InfoRow label="Gasto semanal en alcohol" value={data.weekly_alcohol_spending} />
                         <InfoRow label="Gasto semanal en comida para llevar" value={data.weekly_takeout_spending} />
                     </Section>
                 </div>
                 <div className="col-span-1">
                     <Section title="Solución 80/20">
                         <p className="text-xs text-gray-600">
                             Con nuestro plan bajaremos el consumo calórico a la vez que aportamos muchos nutrientes.
                         </p>
                         <ul className="list-decimal list-inside text-xs font-bold mt-2">
                            <li>Aumento de energía.</li>
                            <li>No pasarás hambre.</li>
                            <li>Tu cuerpo comenzará a cambiar.</li>
                         </ul>
                     </Section>
                 </div>
             </div>

            <Section title="Referidos">
                 {data.consultation_referrals && data.consultation_referrals.length > 0 ? (
                    data.consultation_referrals.map((ref, index) => (
                         <InfoRow key={index} label={`Referido ${index + 1}`} value={`${ref.name} - ${ref.phone}`} />
                    ))
                 ) : (
                    <p className="text-gray-500">No se añadieron referidos.</p>
                 )}
            </Section>
            
            <Section title="Feedback del Mentor">
                <p className="text-gray-600">{data.mentor_feedback || <span className="text-gray-400">Sin feedback.</span>}</p>
            </Section>
             <Section title="Notas del Coach / Plan de Acción">
                <p className="text-gray-600">{data.coach_notes || <span className="text-gray-400">Sin notas.</span>}</p>
            </Section>
        </div>
    );
};

export default WellnessQuestionnairePDF;