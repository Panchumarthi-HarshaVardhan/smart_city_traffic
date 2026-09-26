import React from 'react';

export default function SectionHeading({ number, title, subtitle, align = 'left' }) {
  return (
    <div className={`mb-10 ${align === 'center' ? 'text-center max-w-2xl mx-auto' : 'max-w-2xl'}`}>
      {number && (
        <div className="font-mono text-xs text-accent font-semibold tracking-wider mb-2">
          {number}
        </div>
      )}
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white mb-3">
        {title}
      </h2>
      {subtitle && (
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
