import React from 'react';
import { WellnessProfileData, BmiData } from '../../types';
import HerbalifeLogo from '../icons/HerbalifeLogo';

interface WellnessProfilePDFProps {
    data: WellnessProfileData;
    userData: BmiData;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-4">
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


const WellnessProfilePDF: React.FC<WellnessProfilePDFProps> = ({ data, userData }) => {

    const goalsOptions = [
        { value: 'perder_peso', label: 'Perder peso' },
        { value: 'aumentar_energia', label: 'Aumentar energía' },
        { value: 'mejorar_rendimiento', label: 'Mejorar rendimiento físico' },
        { value: 'tonificar', label: 'Tonificar/bajar %grasa' },
        { value: 'aumentar_masa_muscular', label: 'Aumentar masa muscular' },
        { value: 'mejorar_salud', label: 'Mejorar salud' },
    ];

    return (
        <div className="bg-white p-8 font-sans text-sm" style={{ width: '794px' }}>
            <header className="flex justify-between items-center mb-6 pb-4 border-b">
                <HerbalifeLogo className="h-12 w-auto" />
                <h1 className="text-3xl font-bold text-gray-800">Perfil de Bienestar</h1>
            </header>

            <Section title="Información Personal">
                <div className="grid grid-cols-2 gap-x-8">
                     <InfoRow label="Nombre" value={userData.nombre} />
                     <InfoRow label="Móvil" value={userData.telefono} />
                     <InfoRow label="Edad" value={`${userData.edad} años`} />
                     <InfoRow label="Fecha" value={new Date(data.created_at || userData.created_at || '').toLocaleDateString('es-ES')} />
                </div>
            </Section>

            <Section title="Metas Físicas y de Bienestar">
                 <p className="font-bold mb-2 text-gray-700">¿Cuáles son tus metas físicas y bienestar general?</p>
                 <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                    {goalsOptions.map(goal => (
                        <div key={goal.value} className="flex items-center">
                            <span className="inline-block w-4 h-4 border border-gray-400 rounded-sm mr-2 flex-shrink-0 text-center">
                                {data.goals?.includes(goal.value) && <span className="text-green-600 font-bold">✓</span>}
                            </span>
                            <span>{goal.label}</span>
                        </div>
                    ))}
                 </div>
                 <div className="mt-3">
                     <InfoRow label="Otras metas" value={data.other_goals} />
                 </div>
            </Section>
            
            <Section title="Comparte Nuestro Estudio de Bienestar Gratis">
                 {data.referrals && data.referrals.length > 0 ? (
                    data.referrals.map((ref, index) => (
                         <InfoRow key={index} label={`Nominado ${index + 1}`} value={`${ref.name} - ${ref.phone}`} />
                    ))
                 ) : (
                    <p className="text-gray-500">No se nominaron personas.</p>
                 )}
            </Section>

            <Section title="Análisis de Nutrición y Salud">
                 <div className="grid grid-cols-2 gap-x-8">
                    <InfoRow label="Hora de despertar" value={data.wake_up_time} />
                    <InfoRow label="Hora de dormir" value={data.sleep_time} />
                    <InfoRow label="Desayunas cada mañana?" value={data.eats_breakfast} />
                    <InfoRow label="Qué desayunas?" value={data.breakfast_details} />
                    <InfoRow label="Cuánta agua bebes al día?" value={data.water_intake} />
                    <InfoRow label="Otras bebidas?" value={data.other_drinks} />
                    <InfoRow label="Meriendas entre comidas?" value={data.snacks} />
                    <InfoRow label="Porciones de frutas y verduras?" value={data.fruit_veg_portions} />
                    <InfoRow label="Hora con menos energía:" value={data.low_energy_time} />
                    <InfoRow label="Frecuencia de ejercicio:" value={data.exercise_frequency} />
                    <InfoRow label="Tu mayor reto con la comida?" value={data.food_challenge} />
                    <InfoRow label="Bebidas alcohólicas/semana?" value={data.alcohol_per_week} />
                    <InfoRow label="Gasto diario en comida?" value={data.daily_food_spending} />
                 </div>
            </Section>

             <Section title="Come Gratis">
                 <p className="font-bold mb-2 text-gray-700">¿Te gustaría tener tu desayuno ó almuerzo gratis?</p>
                  <div className="flex gap-x-8">
                      <div className="flex items-center">
                          <span className="inline-block w-4 h-4 border border-gray-400 rounded-sm mr-2 flex-shrink-0 text-center">{data.free_meal_interest === 'SI' && '✓'}</span> SI
                      </div>
                      <div className="flex items-center">
                           <span className="inline-block w-4 h-4 border border-gray-400 rounded-sm mr-2 flex-shrink-0 text-center">{data.free_meal_interest === 'MÁS INFO' && '✓'}</span> MÁS INFO
                      </div>
                      <div className="flex items-center">
                           <span className="inline-block w-4 h-4 border border-gray-400 rounded-sm mr-2 flex-shrink-0 text-center">{data.free_meal_interest === 'NO' && '✓'}</span> NO
                      </div>
                  </div>
            </Section>
        </div>
    );
};

export default WellnessProfilePDF;