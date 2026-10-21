import React, { useState } from 'react';
import { JudicialRequest } from '../../types/request';

interface DeadlineTypeDonutChartProps {
  requests: JudicialRequest[];
  onSelectType: (type: 'judicial' | 'interno') => void;
}

export const DeadlineTypeDonutChart: React.FC<DeadlineTypeDonutChartProps> = ({
  requests,
  onSelectType,
}) => {
  const [hoveredType, setHoveredType] = useState<'judicial' | 'interno' | null>(null);

  const total = requests.length || 1;
  const judiciais = requests.filter(
    (r) => r.tipoPrazo !== 'interno' && r.temPrazoJudicial !== false
  ).length;
  const internos = requests.filter(
    (r) => r.tipoPrazo === 'interno' || r.temPrazoJudicial === false
  ).length;

  const pctJudicial = Math.round((judiciais / total) * 100);
  const pctInterno = Math.round((internos / total) * 100);

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffsetJudicial = 0;
  const strokeDasharrayJudicial = `${(pctJudicial / 100) * circumference} ${circumference}`;

  const strokeDashoffsetInterno = -((pctJudicial / 100) * circumference);
  const strokeDasharrayInterno = `${(pctInterno / 100) * circumference} ${circumference}`;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
      {/* Cabeçalho Minimalista */}
      <div className="pb-3 border-b border-slate-100">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Modalidade de Prazo
        </h3>
        <p className="text-[11px] text-slate-400">
          Prazo judicial fixado vs. Metas internas do setor
        </p>
      </div>

      {/* Área Central com o Donut SVG */}
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-auto py-2">
        <div className="relative w-36 h-36 shrink-0">
          <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth="14"
            />

            {judiciais > 0 && (
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="#274578"
                strokeWidth={hoveredType === 'judicial' ? '18' : '14'}
                strokeDasharray={strokeDasharrayJudicial}
                strokeDashoffset={strokeDashoffsetJudicial}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredType('judicial')}
                onMouseLeave={() => setHoveredType(null)}
                onClick={() => onSelectType('judicial')}
              />
            )}

            {internos > 0 && (
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="#4338ca"
                strokeWidth={hoveredType === 'interno' ? '18' : '14'}
                strokeDasharray={strokeDasharrayInterno}
                strokeDashoffset={strokeDashoffsetInterno}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredType('interno')}
                onMouseLeave={() => setHoveredType(null)}
                onClick={() => onSelectType('interno')}
              />
            )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[10px] font-semibold uppercase text-slate-400">Total</span>
            <span className="text-2xl font-black text-slate-900 font-mono leading-none">
              {requests.length}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">Autos</span>
          </div>
        </div>

        {/* Detalhamento Minimalista */}
        <div className="space-y-2.5 w-full sm:w-auto flex-1">
          {/* Item Prazo Judicial */}
          <div
            onClick={() => onSelectType('judicial')}
            onMouseEnter={() => setHoveredType('judicial')}
            onMouseLeave={() => setHoveredType(null)}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              hoveredType === 'judicial'
                ? 'bg-slate-50 border-slate-300'
                : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#274578]" />
                Prazo Judicial
              </span>
              <span className="text-xs font-bold text-[#274578] font-mono">
                {pctJudicial}%
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pl-4.5">
              <span>{judiciais} requisições</span>
              <span className="text-blue-600">Filtrar &rarr;</span>
            </div>
          </div>

          {/* Item Meta Interna */}
          <div
            onClick={() => onSelectType('interno')}
            onMouseEnter={() => setHoveredType('interno')}
            onMouseLeave={() => setHoveredType(null)}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              hoveredType === 'interno'
                ? 'bg-slate-50 border-slate-300'
                : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4338ca]" />
                Sem Prazo (Meta Interna)
              </span>
              <span className="text-xs font-bold text-indigo-700 font-mono">
                {pctInterno}%
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pl-4.5">
              <span>{internos} metas de setor</span>
              <span className="text-indigo-600">Filtrar &rarr;</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
