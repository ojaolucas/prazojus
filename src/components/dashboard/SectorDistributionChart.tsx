import React, { useState } from 'react';
import { JudicialRequest } from '../../types/request';
import { BarChart3, Filter } from 'lucide-react';

interface SectorDistributionChartProps {
  requests: JudicialRequest[];
  onSelectSector: (sector: string) => void;
}

export const SectorDistributionChart: React.FC<SectorDistributionChartProps> = ({
  requests,
  onSelectSector,
}) => {
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  // Agrupar dados por setor e status
  const sectorData: Record<
    string,
    {
      total: number;
      concluidos: number;
      iniciados: number;
      naoIniciados: number;
      vencidos: number;
    }
  > = {};

  requests.forEach((r) => {
    const s = r.setorSolicitante || 'Não especificado';
    if (!sectorData[s]) {
      sectorData[s] = { total: 0, concluidos: 0, iniciados: 0, naoIniciados: 0, vencidos: 0 };
    }
    sectorData[s].total += 1;
    if (r.status === 'Concluído') sectorData[s].concluidos += 1;
    else if (r.status === 'Vencido') sectorData[s].vencidos += 1;
    else if (r.status === 'Iniciado' || r.status === 'Em andamento' || r.status === 'Aguardando informações')
      sectorData[s].iniciados += 1;
    else sectorData[s].naoIniciados += 1;
  });

  const sortedSectors = Object.entries(sectorData)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 6);

  const maxTotal = Math.max(...sortedSectors.map(([, d]) => d.total), 1);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#274578]" />
            Carga e Demanda por Setor Pericial
          </h3>
          <p className="text-[11px] text-slate-400">
            Distribuição por estágio operacional dos setores da Polícia Científica
          </p>
        </div>

        {/* Legenda de Cores */}
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#10b981]" /> Concluídos
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#0284c7]" /> Em Andamento
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#94a3b8]" /> Não Iniciados
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#ef4444]" /> Vencidos
          </span>
        </div>
      </div>

      {/* Gráfico de Barras Empilhadas em SVG / HTML Interativo */}
      <div className="space-y-3 pt-1">
        {sortedSectors.map(([sector, data]) => {
          const isHovered = hoveredSector === sector;
          const barWidthPercent = (data.total / maxTotal) * 100;

          // Proporções relativas ao total do setor
          const pctConcl = (data.concluidos / data.total) * 100;
          const pctInic = (data.iniciados / data.total) * 100;
          const pctNaoInic = (data.naoIniciados / data.total) * 100;
          const pctVenc = (data.vencidos / data.total) * 100;

          return (
            <div
              key={sector}
              onMouseEnter={() => setHoveredSector(sector)}
              onMouseLeave={() => setHoveredSector(null)}
              onClick={() => onSelectSector(sector)}
              className={`p-2 rounded-xl transition-all cursor-pointer group border ${
                isHovered
                  ? 'bg-slate-50 border-blue-200 shadow-xs'
                  : 'border-transparent hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors flex items-center gap-1.5">
                  <span className="truncate max-w-[280px] sm:max-w-[360px]" title={sector}>
                    {sector}
                  </span>
                  <Filter className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
                <span className="text-xs font-bold text-slate-700 font-mono">
                  {data.total} {data.total === 1 ? 'requisição' : 'requisições'}
                </span>
              </div>

              {/* Barra Empilhada com Largura Proporcional ao Máximo */}
              <div className="w-full h-4 bg-slate-100 rounded-lg overflow-hidden flex shadow-inner">
                <div
                  className="h-full flex rounded-lg overflow-hidden transition-all duration-500"
                  style={{ width: `${Math.max(barWidthPercent, 8)}%` }}
                >
                  {data.concluidos > 0 && (
                    <div
                      style={{ width: `${pctConcl}%` }}
                      className="h-full bg-[#10b981] hover:brightness-110 transition-all"
                      title={`Concluídos: ${data.concluidos}`}
                    />
                  )}
                  {data.iniciados > 0 && (
                    <div
                      style={{ width: `${pctInic}%` }}
                      className="h-full bg-[#0284c7] hover:brightness-110 transition-all"
                      title={`Em Andamento: ${data.iniciados}`}
                    />
                  )}
                  {data.naoIniciados > 0 && (
                    <div
                      style={{ width: `${pctNaoInic}%` }}
                      className="h-full bg-[#94a3b8] hover:brightness-110 transition-all"
                      title={`Não Iniciados: ${data.naoIniciados}`}
                    />
                  )}
                  {data.vencidos > 0 && (
                    <div
                      style={{ width: `${pctVenc}%` }}
                      className="h-full bg-[#ef4444] hover:brightness-110 transition-all"
                      title={`Vencidos: ${data.vencidos}`}
                    />
                  )}
                </div>
              </div>

              {/* Tooltip detalhado ao passar o mouse */}
              {isHovered && (
                <div className="mt-2 pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-3 text-[11px] text-slate-600 animate-fadeIn">
                  <span className="text-emerald-700 font-medium">✓ {data.concluidos} concluídos</span>
                  <span className="text-sky-700 font-medium">⏳ {data.iniciados} em andamento</span>
                  <span className="text-slate-600 font-medium">⚪ {data.naoIniciados} não iniciados</span>
                  {data.vencidos > 0 && (
                    <span className="text-red-700 font-bold">⚠️ {data.vencidos} vencidos</span>
                  )}
                  <span className="ml-auto text-[10px] text-blue-600 font-medium group-hover:underline">
                    Clique para filtrar no painel &rarr;
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
