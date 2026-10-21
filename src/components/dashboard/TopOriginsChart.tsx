import React, { useState } from 'react';
import { JudicialRequest } from '../../types/request';

interface TopOriginsChartProps {
  requests: JudicialRequest[];
  onSelectOrigin: (origin: string) => void;
}

export const TopOriginsChart: React.FC<TopOriginsChartProps> = ({
  requests,
  onSelectOrigin,
}) => {
  const [hoveredOrigin, setHoveredOrigin] = useState<string | null>(null);

  // Agrupar por origem/vara solicitante
  const originCounts: Record<string, number> = {};
  requests.forEach((r) => {
    const o = r.origem || 'Não especificada';
    originCounts[o] = (originCounts[o] || 0) + 1;
  });

  const sortedOrigins = Object.entries(originCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const total = requests.length || 1;
  const maxCount = Math.max(...sortedOrigins.map(([, c]) => c), 1);

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
      {/* Cabeçalho Minimalista */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-1 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
            Principais Varas e Órgãos Requisitantes
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Origens com maior volume de requisições encaminhadas
          </p>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">Top 5</span>
      </div>

      {/* Lista com Ranking Tipográfico Compacto */}
      <div className="space-y-2.5 pt-1">
        {sortedOrigins.map(([origin, count], index) => {
          const percent = Math.round((count / total) * 100);
          const relativeWidth = Math.max((count / maxCount) * 100, 10);
          const isHovered = hoveredOrigin === origin;

          return (
            <div
              key={origin}
              onMouseEnter={() => setHoveredOrigin(origin)}
              onMouseLeave={() => setHoveredOrigin(null)}
              onClick={() => onSelectOrigin(origin)}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer group ${
                isHovered
                  ? 'bg-slate-50/90 border-slate-300 shadow-2xs'
                  : 'border-transparent hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-md font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                      index === 0
                        ? 'bg-[#274578] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <span
                    className="font-semibold text-slate-800 group-hover:text-blue-700 truncate"
                    title={origin}
                  >
                    {origin}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  <span className="font-bold text-slate-900 font-mono text-xs sm:text-sm">
                    {count}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ({percent}%)
                  </span>
                </div>
              </div>

              {/* Barra de Progresso Encorpada e Elegante */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${relativeWidth}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    index === 0
                      ? 'bg-gradient-to-r from-[#274578] to-[#122443]'
                      : index === 1
                      ? 'bg-[#274578]'
                      : 'bg-slate-500'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

