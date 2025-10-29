import React, { useState } from 'react';
import supabase from '../supabaseClient';
import { BmiData } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { useToast } from '../App';

interface AddUserFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

const getBmiCategory = (imc: number): string => {
    if (imc < 18.5) return 'Bajo peso';
    if (imc >= 18.5 && imc < 25) return 'Peso normal';
    if (imc >= 25 && imc < 30) return 'Sobrepeso';
    if (imc >= 30 && imc < 35) return 'Obesidad clase I';
    if (imc >= 35 && imc < 40) return 'Obesidad clase II';
    if (imc >= 40) return 'Obesidad clase III';
    return 'Categoría no determinada';
};

const AddUserForm: React.FC<AddUserFormProps> = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        edad: '',
        peso: '',
        altura: '',
        imc: '',
        categoria: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();
    const [calculationDone, setCalculationDone] = useState(false);
    const [showRegistrationFields, setShowRegistrationFields] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (['peso', 'altura', 'edad'].includes(name)) {
            setCalculationDone(false);
            setShowRegistrationFields(false);
            setFormData(prev => ({ ...prev, [name]: value, imc: '', categoria: '' }));
        }
    };
    
    const handleCalculate = () => {
        const peso = parseFloat(formData.peso);
        const altura = parseFloat(formData.altura);
        const edad = parseInt(formData.edad);

        if (isNaN(edad) || isNaN(peso) || isNaN(altura) || altura <= 0 || peso <= 0 || edad <= 0) {
            addToast('Por favor, introduce valores numéricos positivos para edad, peso y altura.', 'error');
            return;
        }

        const alturaM = altura / 100;
        const calculatedImc = parseFloat((peso / (alturaM * alturaM)).toFixed(2));
        const calculatedCategory = getBmiCategory(calculatedImc);
        
        setFormData(prev => ({
            ...prev,
            imc: calculatedImc.toString(),
            categoria: calculatedCategory,
        }));
        setCalculationDone(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const { nombre, telefono, categoria } = formData;
        const edad = parseInt(formData.edad);
        const peso = parseFloat(formData.peso);
        const altura = parseFloat(formData.altura);
        const imc = parseFloat(formData.imc);

        if (!nombre || !telefono || isNaN(edad) || isNaN(peso) || isNaN(altura) || isNaN(imc)) {
            addToast('Por favor, completa todos los campos para guardar el registro.', 'error');
            setIsLoading(false);
            return;
        }

        const resultData: Omit<BmiData, 'id' | 'created_at'> = {
            nombre,
            telefono,
            edad,
            peso,
            altura,
            imc,
            categoria,
            estado: 'Nuevo',
        };
        
        try {
            const { error: supabaseError } = await supabase
                .from('registros_imc')
                .insert([resultData]);

            if (supabaseError) {
                console.error('Supabase error:', supabaseError);
                throw new Error(supabaseError.message);
            }

            onSuccess();

        } catch (err: any) {
            console.error(err);
            addToast(`Hubo un error al guardar: ${err.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const isCalculationReady = formData.peso && formData.altura && formData.edad;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300" onClick={onClose}>
            <div 
                className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-lg p-6 overflow-y-auto animate-slide-in-right"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Calculadora y Registro</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700">1. Datos para Cálculo</h3>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
                        <input type="number" name="edad" value={formData.edad} onChange={handleChange} placeholder="Ej: 30" min="1" inputMode="numeric" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                            <input type="number" name="peso" value={formData.peso} onChange={handleChange} placeholder="Ej: 70.5" step="0.1" min="1" inputMode="decimal" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Altura (cm)</label>
                            <input type="number" name="altura" value={formData.altura} onChange={handleChange} placeholder="Ej: 165" min="1" inputMode="decimal" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                    </div>
                    
                    {!calculationDone && (
                         <button
                            type="button"
                            onClick={handleCalculate}
                            disabled={!isCalculationReady}
                            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Calcular IMC
                        </button>
                    )}

                    {calculationDone && (
                        <div className="space-y-4">
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <h3 className="text-md font-semibold text-gray-800 mb-2">Resultado</h3>
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-green-600">{formData.imc}</p>
                                    <p className="text-md font-semibold text-gray-700">{formData.categoria}</p>
                                </div>
                            </div>
                            
                            {!showRegistrationFields ? (
                                <button
                                    type="button"
                                    onClick={() => setShowRegistrationFields(true)}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300"
                                >
                                    Registrar Participante
                                </button>
                            ) : (
                                <div className="space-y-4 pt-4 border-t mt-6">
                                    <h3 className="text-lg font-semibold text-gray-700">2. Registrar Datos</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                                        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej: Juan Pérez" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                        <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Ej: 51987654321" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                                    </div>
                                     <button
                                        type="submit"
                                        disabled={isLoading || !formData.nombre || !formData.telefono}
                                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300 flex items-center justify-center disabled:bg-gray-400"
                                    >
                                        {isLoading ? <LoadingSpinner /> : 'Guardar Registro'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </form>
            </div>
            <style>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default AddUserForm;