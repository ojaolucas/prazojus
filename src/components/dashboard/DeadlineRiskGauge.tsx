import React, { useState } from 'react';
import { JudicialRequest } from '../../types/request';
import { ShieldAlert, AlertTriangle, Clock, CheckCircle2, ShieldCheck, Filter } from 'lucide-react';

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

  // Classificação dos prazos não concluídos por proximidade de vencimento
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

  // Nível geral de conformidade (concluídos + no prazo sobre o total)
  const taxaConformidade = Math.round(((noPrazo + concluidos) / total) * 100);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#274578]" />
            Termômetro de Risco e Proximidade do Vencimento
          </h3>
          <p className="text-[11px] text-slate-400">
            Monitoramento preventivo de saúde processual das requisições
          </p>
        </div>

        {/* Badge de Conformidade Geral */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs">
          <span className="text-slate-500 font-medium">Conformidade Geral:</span>
          <span
            className={`font-black font-mono ${
              taxaConformidade >= 75
                ? 'text-emerald-700'
                : taxaConformidade >= 50
                ? 'text-amber-700'
                : 'text-red-700'
            }`}
          >
            {taxaConformidade}%
          </span>
        </div>
      </div>

      {/* Barra do Termômetro Segmentada */}
      <div className="space-y-2">
        <div className="h-4.5 w-full bg-slate-100 rounded-xl overflow-hidden flex p-0.5 gap-0.5 shadow-inner">
          {concluidos > 0 && (
            <div
              style={{ width: `${pctConcluidos}%` }}
              className={`h-full rounded-lg bg-[#10b981] hover:brightness-110 transition-all cursor-pointer ${
                hoveredLevel === 'concluidos' ? 'ring-2 ring-emerald-400' : ''
              }`}
              title={`Concluídos: ${concluidos} (${pctConcluidos}%)`}
              onMouseEnter={() => setHoveredLevel('concluidos')}
              onMouseLeave={() => setHoveredLevel(null)}
              onClick={() => onFilterStatus('Concluído')}
            />
          )}

          {noPrazo > 0 && (
            <div
              style={{ width: `${pctNoPrazo}%` }}
              className={`h-full rounded-lg bg-[#274578] hover:brightness-110 transition-all cursor-pointer ${
                hoveredLevel === 'noPrazo' ? 'ring-2 ring-blue-400' : ''
              }`}
              title={`No Prazo (> 5 dias): ${noPrazo} (${pctNoPrazo}%)`}
              onMouseEnter={() => setHoveredLevel('noPrazo')}
              onMouseLeave={() => setHoveredLevel(null)}
              onClick={() => onFilterStatus('Iniciado')}
            />
          )}

          {atencao > 0 && (
            <div
              style={{ width: `${pctAtencao}%` }}
              className={`h-full rounded-lg bg-[#f59e0b] hover:brightness-110 transition-all cursor-pointer ${
                hoveredLevel === 'atencao' ? 'ring-2 ring-amber-400' : ''
              }`}
              title={`Atenção (3 a 5 dias): ${atencao} (${pctAtencao}%)`}
              onMouseEnter={() => setHoveredLevel('atencao')}
              onMouseLeave={() => setHoveredLevel(null)}
            />
          )}

          {criticos > 0 && (
            <div
              style={{ width: `${pctCriticos}%` }}
              className={`h-full rounded-lg bg-[#f97316] hover:brightness-110 transition-all cursor-pointer ${
                hoveredLevel === 'criticos' ? 'ring-2 ring-orange-400' : ''
              }`}
              title={`Urgência Crítica (≤ 48h): ${criticos} (${pctCriticos}%)`}
              onMouseEnter={() => setHoveredLevel('criticos')}
              onMouseLeave={() => setHoveredLevel(null)}
            />
          )}

          {vencidos > 0 && (
            <div
              style={{ width: `${pctVencidos}%` }}
              className={`h-full rounded-lg bg-[#ef4444] hover:brightness-110 transition-all cursor-pointer ${
                hoveredLevel === 'vencidos' ? 'ring-2 ring-red-400' : ''
              }`}
              title={`Vencidos: ${vencidos} (${pctVencidos}%)`}
              onMouseEnter={() => setHoveredLevel('vencidos')}
              onMouseLeave={() => setHoveredLevel(null)}
              onClick={() => onFilterStatus('Vencido')}
            />
          )}
        </div>
      </div>

      {/* Cards com os Níveis de Alerta Clicáveis */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
        {/* Concluídos */}
        <div
          onClick={() => onFilterStatus('Concluído')}
          onMouseEnter={() => setHoveredLevel('concluidos')}
          onMouseLeave={() => setHoveredLevel(null)}
          className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-[11px] font-bold">Concluídos</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-black text-emerald-950 font-mono leading-none">
            {concluidos}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1 flex items-center justify-between">
            <span>{pctConcluidos}% do total</span>
            <Filter className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
          </div>
        </div>

        {/* No Prazo */}
        <div
          onClick={() => onFilterStatus('Iniciado')}
          onMouseEnter={() => setHoveredLevel('noPrazo')}
          onMouseLeave={() => setHoveredLevel(null)}
          className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#274578] mb-1">
            <span className="text-[11px] font-bold">No Prazo (&gt; 5d)</span>
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-black text-slate-900 font-mono leading-none">
            {noPrazo}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{pctNoPrazo}% do total</span>
            <Filter className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-blue-600" />
          </div>
        </div>

        {/* Atenção */}
        <div
          onMouseEnter={() => setHoveredLevel('atencao')}
          onMouseLeave={() => setHoveredLevel(null)}
          className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-[11px] font-bold">Atenção (3-5d)</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-black text-amber-950 font-mono leading-none">
            {atencao}
          </div>
          <div className="text-[10px] text-amber-700 mt-1">
            {pctAtencao}% do total
          </div>
        </div>

        {/* Críticos */}
        <div
          onMouseEnter={() => setHoveredLevel('criticos')}
          onMouseLeave={() => setHoveredLevel(null)}
          className="p-2.5 rounded-xl border border-orange-200 bg-orange-50/40 hover:bg-orange-50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-orange-800 mb-1">
            <span className="text-[11px] font-bold">Crítico (≤ 48h)</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-black text-orange-950 font-mono leading-none">
            {criticos}
          </div>
          <div className="text-[10px] text-orange-700 mt-1">
            {pctCriticos}% do total
          </div>
        </div>

        {/* Vencidos */}
        <div
          onClick={() => onFilterStatus('Vencido')}
          onMouseEnter={() => setHoveredLevel('vencidos')}
          onMouseLeave={() => setHoveredLevel(null)}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer group ${
            vencidos > 0
              ? 'border-red-300 bg-red-50/70 hover:bg-red-100 ring-1 ring-red-400/40'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-red-800 mb-1">
            <span className="text-[11px] font-bold">Vencidos</span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          </div>
          <div className="text-lg font-black text-red-950 font-mono leading-none">
            {vencidos}
          </div>
          <div className="text-[10px] text-red-700 mt-1 flex items-center justify-between">
            <span>{pctVencidos}% em atraso</span>
            <Filter className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-red-600" />
          </div>
        </div>
      </div>
    </div>
  );
};
