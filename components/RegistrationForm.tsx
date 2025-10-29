import React, { useState } from 'react';
import { BmiData } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { UserIcon, PhoneIcon, CalendarIcon, SendIcon } from './icons/FormIcons';
import supabase from '../supabaseClient';
import { useToast } from '../App';

interface RegistrationFormProps {
    onSuccess: (data: BmiData) => void;
}

// Función local para calcular la categoría del IMC, reemplazando la llamada a la API.
const getBmiCategory = (imc: number): string => {
    if (imc < 18.5) return 'Bajo peso';
    if (imc >= 18.5 && imc < 25) return 'Peso normal';
    if (imc >= 25 && imc < 30) return 'Sobrepeso';
    if (imc >= 30 && imc < 35) return 'Obesidad clase I';
    if (imc >= 35 && imc < 40) return 'Obesidad clase II';
    if (imc >= 40) return 'Obesidad clase III';
    return 'Categoría no determinada';
};


const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        edad: '',
        peso: '',
        altura: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const { nombre, telefono } = formData;
        const edad = parseInt(formData.edad);
        const peso = parseFloat(formData.peso);
        const altura = parseFloat(formData.altura);

        if (isNaN(edad) || isNaN(peso) || isNaN(altura) || altura <= 0 || peso <= 0 || edad <= 0) {
            addToast('Por favor, introduce valores numéricos positivos y válidos para edad, peso y altura.', 'error');
            setIsLoading(false);
            return;
        }

        const alturaM = altura / 100;
        const imc = parseFloat((peso / (alturaM * alturaM)).toFixed(2));

        const categoria = getBmiCategory(imc);

        // Fetch the inserted record to get its ID
        const { data: insertedData, error: supabaseError } = await supabase
            .from('registros_imc')
            .insert([{
                nombre,
                telefono,
                edad,
                peso,
                altura,
                imc,
                categoria,
                estado: 'Nuevo',
            }])
            .select()
            .single();

        if (supabaseError || !insertedData) {
            console.error('Supabase error:', supabaseError);
            addToast('Hubo un error al guardar tu registro. Por favor, inténtalo de nuevo.', 'error');
            setIsLoading(false);
            return;
        }

        onSuccess(insertedData);
        setFormData({
            nombre: '',
            telefono: '',
            edad: '',
            peso: '',
            altura: '',
        });
        setIsLoading(false);
    };
    
    return (
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <UserIcon />
                    </span>
                    <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Nombre completo"
                        required
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <PhoneIcon />
                    </span>
                    <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="Teléfono"
                        required
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <CalendarIcon />
                    </span>
                    <input
                        type="number"
                        name="edad"
                        value={formData.edad}
                        onChange={handleChange}
                        placeholder="Edad"
                        required
                        min="1"
                        inputMode="numeric"
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <input
                            type="number"
                            name="peso"
                            value={formData.peso}
                            onChange={handleChange}
                            placeholder="Peso (kg)"
                            required
                            step="0.1"
                            min="1"
                            inputMode="decimal"
                            className="w-full pl-4 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div className="relative">
                         <input
                            type="number"
                            name="altura"
                            value={formData.altura}
                            onChange={handleChange}
                            placeholder="Altura (cm)"
                            required
                            min="1"
                            inputMode="decimal"
                            className="w-full pl-4 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300 flex items-center justify-center disabled:bg-gray-400"
                >
                    {isLoading ? <LoadingSpinner /> : (
                        <>
                            <span className="mr-2">¡Empezar mi transformación!</span>
                            <SendIcon />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default RegistrationForm;