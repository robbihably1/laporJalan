import React from 'react';

export default function Logo({ size = 'md', isAdmin = false, className = '' }) {
  const iconBoxSizes = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl'
  };

  const svgSizes = {
    sm: 'w-4 h-4',
    md: 'w-5.5 h-5.5',
    lg: 'w-7 h-7'
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl'
  };

  return (
    <div className={`flex items-center gap-3 cursor-pointer group select-none ${className}`}>
      {/* Icon Badge Container */}
      <div className={`${iconBoxSizes[size]} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200 ${
        isAdmin 
          ? 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 shadow-indigo-500/25 border border-indigo-400/30' 
          : 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 shadow-emerald-500/25 border border-emerald-400/30'
      }`}>
        {/* Custom Vector Logo Mark: Road Location Pin */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={`${svgSizes[size]} text-white drop-shadow-md`}
        >
          {/* Map Pin Path */}
          <path d="M12 21.5S5 15.5 5 9.5a7 7 0 1 1 14 0c0 6-7 12-7 12z" fill="currentColor" fillOpacity="0.15" />
          {/* Center Road Core Dot */}
          <circle cx="12" cy="9.5" r="2.5" fill="currentColor" />
          {/* Inner Road Curve Dashes */}
          <path d="M12 17v2.5" stroke="currentColor" strokeWidth="2" strokeDasharray="1 1" />
        </svg>
      </div>

      {/* Brand Text */}
      <div>
        <div className="flex items-center gap-2">
          <span className={`${titleSizes[size]} font-black tracking-tight brand-logo-title`}>
            Lapor<span className="brand-logo-emerald">Jalan</span>
          </span>
          {isAdmin && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              ADMIN
            </span>
          )}
        </div>
        <span className="block text-[10px] font-medium tracking-wide uppercase brand-sub-text">
          {isAdmin ? 'Sistem Informasi Bina Marga' : 'Portal Pelaporan Warga'}
        </span>
      </div>
    </div>
  );
}
