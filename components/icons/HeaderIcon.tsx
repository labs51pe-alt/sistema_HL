import React from 'react';

const HeaderIcon: React.FC = () => (
    <div className="w-16 h-16 bg-gradient-to-br from-[#94c120] to-[#006D44] rounded-full flex items-center justify-center shadow-inner">
        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            {/* Stylized X for Fuxion */}
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
    </div>
);

export default HeaderIcon;