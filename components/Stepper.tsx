import React from 'react';

interface StepperProps {
    currentStep: number;
    steps: string[];
}

const Stepper: React.FC<StepperProps> = ({ currentStep, steps }) => {
    return (
        <div className="w-full py-2 px-1 sm:px-4 mb-4">
            <div className="flex items-center justify-between relative">
                {/* Background Line */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
                
                {/* Active Line Progress */}
                <div 
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-[#94c120] -z-10 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                ></div>

                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isActive = stepNumber === currentStep;
                    const isCompleted = stepNumber < currentStep;

                    return (
                        <div key={index} className="flex flex-col items-center relative group cursor-default">
                            <div 
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 border-2 z-10
                                ${isActive 
                                    ? 'bg-[#94c120] border-[#94c120] text-white scale-110 shadow-lg ring-2 ring-[#94c120]/30' 
                                    : isCompleted 
                                        ? 'bg-[#006D44] border-[#006D44] text-white' 
                                        : 'bg-white border-gray-300 text-gray-400'
                                }`}
                            >
                                {isCompleted ? (
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                ) : (
                                    stepNumber
                                )}
                            </div>
                            {/* Label for Desktop */}
                            <span 
                                className={`absolute top-10 sm:top-12 text-[10px] sm:text-xs font-semibold transition-colors duration-300 w-32 text-center hidden sm:block
                                ${isActive ? 'text-[#006D44]' : isCompleted ? 'text-gray-600' : 'text-gray-400'}`}
                                style={{ left: '50%', transform: 'translateX(-50%)' }}
                            >
                                {step}
                            </span>
                        </div>
                    );
                })}
            </div>
            {/* Label for Mobile */}
            <div className="sm:hidden text-center mt-3">
                <p className="text-sm font-bold text-[#006D44]">
                    {steps[currentStep - 1]}
                </p>
                <p className="text-xs text-gray-500">Paso {currentStep} de {steps.length}</p>
            </div>
            {/* Spacer to prevent layout shift on desktop */}
            <div className="hidden sm:block h-8"></div>
        </div>
    );
};

export default Stepper;