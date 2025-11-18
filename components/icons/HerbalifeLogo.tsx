import React from 'react';

const HerbalifeLogo: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg
            className={className}
            width="200" 
            height="60"
            viewBox="0 0 300 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Logo Fuxion Wellness"
            style={{ maxWidth: '100%', height: 'auto' }}
        >
            <defs>
                <linearGradient id="fuxionGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#94c120" />
                    <stop offset="100%" stopColor="#006D44" />
                </linearGradient>
            </defs>
            <g>
                 {/* Icono Estilizado X */}
                <path d="M50 15 L80 65 L65 65 L42 28 L20 65 L5 65 L35 15 Z" fill="url(#fuxionGrad)" />
                
                {/* Texto FUXION */}
                <text x="90" y="52" fontFamily="Arial, sans-serif" fontSize="42" fontWeight="900" fill="#006D44" letterSpacing="-1">FUXION</text>
                
                {/* Subtexto Wellness Coach */}
                <text x="92" y="72" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#94c120" letterSpacing="2">WELLNESS COACH</text>
            </g>
        </svg>
    );
};

export default HerbalifeLogo;