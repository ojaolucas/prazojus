import React, { useState } from 'react';
import { JudicialRequest } from '../../types/request';
import { getRequestRiskCategory } from '../../services/deadlineService';

interface DeadlineRiskGaugeProps {
  requests: JudicialRequest[];
  onFilterStatus: (status: string) => void;
}

export const DeadlineRiskGauge: React.FC<DeadlineRiskGaugeProps> = ({
  requests,
  onFilterStatus,
}) => {
  const [hoveredLevel, setHoveredLevel] = useState<string | null>(null);

  const now = new Date();
  const total = requests.length || 1;

  let vencidos = 0;
  let urgente = 0; // <= 5 dias
  let alta = 0; // 6 a 15 dias
  let media = 0; // 16 a 30 dias
  let baixa = 0; // > 30 dias
  let concluidos = 0;

  requests.forEach((r) => {
    const cat = getRequestRiskCategory(r, now);
    if (cat === 'concluidos') concluidos++;
    else if (cat === 'vencidos') vencidos++;
    else if (cat === 'urgente') urgente++;
    else if (cat === 'alta') alta++;
    else if (cat === 'media') media++;
    else if (cat === 'baixa') baixa++;
  });

  const pctVencidos = Math.round((vencidos / total) * 100);
  const pctUrgente = Math.round((urgente / total) * 100);
  const pctAlta = Math.round((alta / total) * 100);
  const pctMedia = Math.round((media / total) * 100);
  const pctBaixa = Math.round((baixa / total) * 100);
  const pctConcluidos = Math.round((concluidos / total) * 100);

  const taxaConformidade = Math.round(((baixa + media + alta + concluidos) / total) * 100);

  const levels = [
    {
      id: 'concluidos',
      label: 'Concluído',
      count: concluidos,
      pct: pctConcluidos,
      color: 'bg-emerald-400/80',
      textColor: 'text-slate-600',
      filter: 'Concluído',
    },
    {
      id: 'baixa',
      label: 'Baixa (+30 dias)',
      count: baixa,
      pct: pctBaixa,
      color: 'bg-slate-400',
      textColor: 'text-slate-700',
      filter: 'baixa',
    },
    {
      id: 'media',
      label: 'Média (16-30 dias)',
      count: media,
      pct: pctMedia,
      color: 'bg-blue-600',
      textColor: 'text-blue-900',
      filter: 'media',
    },
    {
      id: 'alta',
      label: 'Alta (6-15 dias)',
      count: alta,
      pct: pctAlta,
      color: 'bg-amber-500',
      textColor: 'text-amber-900',
      filter: 'alta',
    },
    {
      id: 'urgente',
      label: 'Urgente (Até 5 dias)',
      count: urgente,
      pct: pctUrgente,
      color: 'bg-red-500',
      textColor: 'text-red-700',
      filter: 'urgente',
    },
    {
      id: 'vencidos',
      label: 'Vencidos',
      count: vencidos,
      pct: pctVencidos,
      color: 'bg-rose-700',
      textColor: 'text-rose-950',
      filter: 'Vencido',
    },
  ];

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
      {/* Cabeçalho Minimalista */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Controle dos Prazos Processuais
          </h3>
          <p className="text-[11px] text-slate-400">
            Distribuição proporcional de proximidade de vencimento • Clique para filtrar
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span>Conformidade Geral:</span>
          <span
            className={`font-black font-mono ${
              taxaConformidade >= 75
                ? 'text-emerald-700'
                : taxaConformidade >= 50
                ? 'text-amber-700'
                : 'text-rose-700'
            }`}
          >
            {taxaConformidade}%
          </span>
        </div>
      </div>

      {/* Barra de Progresso Segmentada Minimalista */}
      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
        {levels.map((lvl) => {
          if (lvl.count === 0) return null;
          const isHovered = hoveredLevel === lvl.id;
          return (
            <div
              key={lvl.id}
              style={{ width: `${lvl.pct}%` }}
              className={`h-full ${lvl.color} transition-all cursor-pointer ${
                isHovered ? 'brightness-125 scale-y-125' : 'hover:brightness-110'
              }`}
              onMouseEnter={() => setHoveredLevel(lvl.id)}
              onMouseLeave={() => setHoveredLevel(null)}
              onClick={() => onFilterStatus(lvl.filter)}
              title={`${lvl.label}: ${lvl.count} (${lvl.pct}%) - Clique para ver filtrado`}
            />
          );
        })}
      </div>

      {/* Legenda Horizontal Minimalista e Interativa */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
        {levels.map((lvl) => {
          const isHovered = hoveredLevel === lvl.id;
          return (
            <div
              key={lvl.id}
              onClick={() => onFilterStatus(lvl.filter)}
              onMouseEnter={() => setHoveredLevel(lvl.id)}
              onMouseLeave={() => setHoveredLevel(null)}
              className={`flex items-center gap-2 py-1.5 px-2.5 rounded-lg transition-all cursor-pointer select-none border border-transparent ${
                isHovered
                  ? 'bg-slate-100/90 border-slate-200 shadow-2xs scale-[1.03]'
                  : 'hover:bg-slate-50 hover:border-slate-100'
              }`}
              title={`Clique para filtrar por ${lvl.label}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${lvl.color} shadow-2xs`} />
              <span className="text-[11px] text-slate-700 font-medium">{lvl.label}</span>
              <span className={`text-xs font-mono font-bold ${lvl.textColor}`}>
                {lvl.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
