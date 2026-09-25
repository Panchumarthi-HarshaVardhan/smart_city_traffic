import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function PortalCard({
  title,
  subtitle,
  description,
  features = [],
  ctaText,
  ctaLink,
  badge,
  icon: Icon,
  variant = 'default',
}) {
  const isAccent = variant === 'accent';

  return (
    <div
      className={`relative rounded-2xl p-7 sm:p-8 flex flex-col justify-between border transition-all ${
        isAccent
          ? 'bg-gradient-to-b from-surface-elevated via-surface to-surface border-accent/30 shadow-lg shadow-accent/5'
          : 'bg-surface/80 border-surface-border hover:border-surface-border/80'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  isAccent
                    ? 'bg-accent/15 border-accent/30 text-accent'
                    : 'bg-surface-elevated border-surface-border text-slate-300'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold text-white tracking-tight">{title}</h3>
              <p className="text-xs font-mono text-slate-400">{subtitle}</p>
            </div>
          </div>
          {badge && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-slate-300 border border-surface-border">
              {badge}
            </span>
          )}
        </div>

        <p className="text-slate-300 text-sm leading-relaxed mb-6">
          {description}
        </p>

        <div className="space-y-2.5 mb-8">
          {features.map((feature, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isAccent ? 'text-accent' : 'text-slate-400'}`} />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Link
          to={ctaLink}
          className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 group ${
            isAccent
              ? 'bg-accent hover:bg-accent-hover text-white shadow-sm shadow-accent/20'
              : 'bg-surface-elevated hover:bg-surface-border text-white border border-surface-border'
          }`}
        >
          <span>{ctaText}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
