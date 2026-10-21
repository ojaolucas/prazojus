import React, { useState } from 'react';
import { JudicialRequest } from '../../types/request';
import { PieChart, Scale, Building2, Filter } from 'lucide-react';

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

  // Cálculo dos arcos SVG do Donut
  // Raio = 50, Circunferência = 2 * PI * 50 ≈ 314.159
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffsetJudicial = 0;
  const strokeDasharrayJudicial = `${(pctJudicial / 100) * circumference} ${circumference}`;

  const strokeDashoffsetInterno = -((pctJudicial / 100) * circumference);
  const strokeDasharrayInterno = `${(pctInterno / 100) * circumference} ${circumference}`;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#274578]" />
            Modalidade de Prazo
          </h3>
          <p className="text-[11px] text-slate-400">
            Prazos fixados pela Justiça vs. Metas internas do setor
          </p>
        </div>
      </div>

      {/* Área Central com o Donut SVG */}
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-auto py-2">
        {/* SVG Donut */}
        <div className="relative w-40 h-40 shrink-0">
          <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
            {/* Background ring */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth="18"
            />

            {/* Segmento Prazo Judicial */}
            {judiciais > 0 && (
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="#274578"
                strokeWidth={hoveredType === 'judicial' ? '22' : '18'}
                strokeDasharray={strokeDasharrayJudicial}
                strokeDashoffset={strokeDashoffsetJudicial}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer hover:brightness-110"
                onMouseEnter={() => setHoveredType('judicial')}
                onMouseLeave={() => setHoveredType(null)}
                onClick={() => onSelectType('judicial')}
              />
            )}

            {/* Segmento Meta Interna */}
            {internos > 0 && (
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="#4338ca"
                strokeWidth={hoveredType === 'interno' ? '22' : '18'}
                strokeDasharray={strokeDasharrayInterno}
                strokeDashoffset={strokeDashoffsetInterno}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer hover:brightness-110"
                onMouseEnter={() => setHoveredType('interno')}
                onMouseLeave={() => setHoveredType(null)}
                onClick={() => onSelectType('interno')}
              />
            )}
          </svg>

          {/* Conteúdo Central do Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total</span>
            <span className="text-2xl font-black text-slate-900 font-mono leading-none">
              {requests.length}
            </span>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5">Autos</span>
          </div>
        </div>

        {/* Detalhamento das Modalidades (Cards Clicáveis) */}
        <div className="space-y-3 w-full sm:w-auto flex-1">
          {/* Card Prazo Judicial */}
          <div
            onClick={() => onSelectType('judicial')}
            onMouseEnter={() => setHoveredType('judicial')}
            onMouseLeave={() => setHoveredType(null)}
            className={`p-3 rounded-xl border transition-all cursor-pointer group ${
              hoveredType === 'judicial'
                ? 'bg-blue-50/70 border-blue-300 shadow-xs ring-1 ring-blue-300'
                : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[#274578]" />
                Prazo Judicial
              </span>
              <span className="text-xs font-bold text-[#274578] font-mono">
                {pctJudicial}%
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{judiciais} requisições judiciais</span>
              <span className="text-blue-600 font-medium group-hover:underline flex items-center gap-0.5">
                Filtrar <Filter className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>

          {/* Card Meta Interna */}
          <div
            onClick={() => onSelectType('interno')}
            onMouseEnter={() => setHoveredType('interno')}
            onMouseLeave={() => setHoveredType(null)}
            className={`p-3 rounded-xl border transition-all cursor-pointer group ${
              hoveredType === 'interno'
                ? 'bg-indigo-50/70 border-indigo-300 shadow-xs ring-1 ring-indigo-300'
                : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-700" />
                Sem Prazo (Meta Interna)
              </span>
              <span className="text-xs font-bold text-indigo-700 font-mono">
                {pctInterno}%
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{internos} metas de setor</span>
              <span className="text-indigo-600 font-medium group-hover:underline flex items-center gap-0.5">
                Filtrar <Filter className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
