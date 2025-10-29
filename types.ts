export interface BmiData {
    id?: number;
    created_at?: string;
    nombre: string;
    telefono: string;
    edad: number;
    peso: number;
    altura: number;
    imc: number;
    categoria: string;
    estado?: string;
    notas?: string;
}

export interface WellnessProfileData {
    id?: number;
    user_id: number;
    created_at?: string;
    
    // Metas
    goals?: string[];
    other_goals?: string;

    // Referidos
    referrals?: { name: string; phone: string }[];

    // Análisis de Nutrición y Salud
    wake_up_time?: string;
    sleep_time?: string;
    eats_breakfast?: 'SI' | 'NO' | null;
    breakfast_time?: string;
    breakfast_details?: string;
    water_intake?: string;
    other_drinks?: string;
    snacks?: string;
    fruit_veg_portions?: string;
    low_energy_time?: string;
    exercise_frequency?: string;
    eats_more_at_night?: boolean;
    food_challenge?: string;
    alcohol_per_week?: string;
    daily_food_spending?: string;

    // Come Gratis
    free_meal_interest?: 'SI' | 'MÁS INFO' | 'NO' | null;
}

export interface WellnessQuestionnaireData {
    id?: number;
    user_id: number;
    created_at?: string;

    // Objetivo - Conectar
    clothing_size?: string;
    body_parts_to_improve?: string;
    previous_attempts?: string;
    wardrobe_goal?: string;
    benefit_of_achieving_goals?: string;
    plan_3_to_6_months?: string;
    motivation_today?: string;
    readiness_scale?: number;

    // Cuestionario de nutrición
    daily_food_spending?: string;
    daily_coffee_spending?: string;
    weekly_alcohol_spending?: string;
    weekly_takeout_spending?: string;

    // Referidos
    consultation_referrals?: { name: string; phone: string }[];

    // Notas del Coach
    coach_notes?: string;
    mentor_feedback?: string;
}