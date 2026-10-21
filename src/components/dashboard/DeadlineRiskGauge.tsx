import React, { useState } from 'react';
import { JudicialRequest } from '../../types/request';

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
  let criticos = 0; // <= 2 dias
  let atencao = 0; // 3 a 5 dias
  let noPrazo = 0; // > 5 dias
  let concluidos = 0;

  requests.forEach((r) => {
    if (r.status === 'Concluído') {
      concluidos++;
      return;
    }
    if (r.status === 'Cancelado') {
      return;
    }

    const prazo = new Date(r.prazoJudicial);
    const diffMs = prazo.getTime() - now.getTime();
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias < 0 || r.status === 'Vencido') {
      vencidos++;
    } else if (diffDias <= 2) {
      criticos++;
    } else if (diffDias <= 5) {
      atencao++;
    } else {
      noPrazo++;
    }
  });

  const pctVencidos = Math.round((vencidos / total) * 100);
  const pctCriticos = Math.round((criticos / total) * 100);
  const pctAtencao = Math.round((atencao / total) * 100);
  const pctNoPrazo = Math.round((noPrazo / total) * 100);
  const pctConcluidos = Math.round((concluidos / total) * 100);

  const taxaConformidade = Math.round(((noPrazo + concluidos) / total) * 100);

  const levels = [
    {
      id: 'concluidos',
      label: 'Concluídos',
      count: concluidos,
      pct: pctConcluidos,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      filter: 'Concluído',
    },
    {
      id: 'noPrazo',
      label: 'No Prazo (> 5d)',
      count: noPrazo,
      pct: pctNoPrazo,
      color: 'bg-[#274578]',
      textColor: 'text-[#274578]',
      filter: 'Iniciado',
    },
    {
      id: 'atencao',
      label: 'Atenção (3-5d)',
      count: atencao,
      pct: pctAtencao,
      color: 'bg-amber-500',
      textColor: 'text-amber-800',
      filter: '',
    },
    {
      id: 'criticos',
      label: 'Crítico (≤ 48h)',
      count: criticos,
      pct: pctCriticos,
      color: 'bg-orange-500',
      textColor: 'text-orange-800',
      filter: '',
    },
    {
      id: 'vencidos',
      label: 'Vencidos',
      count: vencidos,
      pct: pctVencidos,
      color: 'bg-rose-500',
      textColor: 'text-rose-700',
      filter: 'Vencido',
    },
  ];

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
      {/* Cabeçalho Minimalista */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Saúde dos Prazos Processuais
          </h3>
          <p className="text-[11px] text-slate-400">
            Distribuição proporcional de proximidade de vencimento
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
                isHovered ? 'brightness-125' : ''
              }`}
              onMouseEnter={() => setHoveredLevel(lvl.id)}
              onMouseLeave={() => setHoveredLevel(null)}
              onClick={() => lvl.filter && onFilterStatus(lvl.filter)}
              title={`${lvl.label}: ${lvl.count} (${lvl.pct}%)`}
            />
          );
        })}
      </div>

      {/* Legenda Horizontal Minimalista */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
        {levels.map((lvl) => {
          const isHovered = hoveredLevel === lvl.id;
          return (
            <div
              key={lvl.id}
              onClick={() => lvl.filter && onFilterStatus(lvl.filter)}
              onMouseEnter={() => setHoveredLevel(lvl.id)}
              onMouseLeave={() => setHoveredLevel(null)}
              className={`flex items-center gap-2 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                isHovered ? 'bg-slate-50' : ''
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${lvl.color}`} />
              <span className="text-[11px] text-slate-600 font-medium">{lvl.label}</span>
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
