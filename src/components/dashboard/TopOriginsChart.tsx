import React, { useState } from 'react';
import { JudicialRequest } from '../../types/request';
import { Landmark, Filter, ExternalLink } from 'lucide-react';

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
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Landmark className="w-4 h-4 text-[#274578]" />
            Principais Varas e Órgãos Requisitantes
          </h3>
          <p className="text-[11px] text-slate-400">
            Origens com maior volume de requisições encaminhadas à PCAL
          </p>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">Top 5 origens</span>
      </div>

      {/* Lista de Barras Horizontais com Ranking */}
      <div className="space-y-3 pt-1">
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
              className={`p-2.5 rounded-xl border transition-all cursor-pointer group ${
                isHovered
                  ? 'bg-blue-50/50 border-blue-200 shadow-xs ring-1 ring-blue-300/40'
                  : 'border-transparent hover:bg-slate-50/70'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                      index === 0
                        ? 'bg-[#C5B641] text-[#0F0D02]'
                        : index === 1
                        ? 'bg-slate-200 text-slate-700'
                        : index === 2
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {index + 1}º
                  </span>
                  <span
                    className="font-semibold text-slate-800 group-hover:text-blue-700 truncate"
                    title={origin}
                  >
                    {origin}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-slate-900 font-mono text-xs">
                    {count} ({percent}%)
                  </span>
                  <Filter className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div
                  style={{ width: `${relativeWidth}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    index === 0
                      ? 'bg-gradient-to-r from-[#274578] to-[#122443]'
                      : index === 1
                      ? 'bg-[#274578]'
                      : 'bg-[#3b82f6]'
                  } group-hover:brightness-110`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
