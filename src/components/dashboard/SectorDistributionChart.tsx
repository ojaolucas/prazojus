import React, { useState } from 'react';
import { JudicialRequest } from '../../types/request';

interface SectorDistributionChartProps {
  requests: JudicialRequest[];
  onSelectSector: (sector: string) => void;
}

export const SectorDistributionChart: React.FC<SectorDistributionChartProps> = ({
  requests,
  onSelectSector,
}) => {
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

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
    else if (
      r.status === 'Iniciado' ||
      r.status === 'Em andamento' ||
      r.status === 'Aguardando informações'
    )
      sectorData[s].iniciados += 1;
    else sectorData[s].naoIniciados += 1;
  });

  const sortedSectors = Object.entries(sectorData)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  const maxTotal = Math.max(...sortedSectors.map(([, d]) => d.total), 1);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs h-full flex flex-col">
      {/* Cabeçalho Minimalista */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
            Carga e Demanda por Setor Pericial
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Distribuição por estágio operacional dos setores da Polícia Científica
          </p>
        </div>

        {/* Legenda de Cores Minimalista */}
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Concluídos
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600" /> Em Andamento
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Não Iniciados
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Vencidos
          </span>
        </div>
      </div>

      {/* Lista de Barras Distribuída de Forma Uniforme */}
      <div className="flex-1 flex flex-col justify-between pt-4 pb-1 space-y-3 sm:space-y-4">
        {sortedSectors.map(([sector, data]) => {
          const isHovered = hoveredSector === sector;
          const barWidthPercent = (data.total / maxTotal) * 100;

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
              className={`p-2.5 rounded-lg transition-all cursor-pointer border ${
                isHovered
                  ? 'bg-slate-50/80 border-slate-300 shadow-2xs'
                  : 'border-transparent hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                <span className="font-semibold text-slate-800 truncate max-w-[280px] sm:max-w-[360px]" title={sector}>
                  {sector}
                </span>
                <span className="text-xs sm:text-sm font-mono font-bold text-slate-700">
                  {data.total} {data.total === 1 ? 'requisição' : 'requisições'}
                </span>
              </div>

              {/* Barra Empilhada Fina e Elegante */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full flex rounded-full overflow-hidden transition-all duration-300"
                  style={{ width: `${Math.max(barWidthPercent, 10)}%` }}
                >
                  {data.concluidos > 0 && (
                    <div
                      style={{ width: `${pctConcl}%` }}
                      className="h-full bg-emerald-500"
                      title={`Concluídos: ${data.concluidos}`}
                    />
                  )}
                  {data.iniciados > 0 && (
                    <div
                      style={{ width: `${pctInic}%` }}
                      className="h-full bg-sky-600"
                      title={`Em Andamento: ${data.iniciados}`}
                    />
                  )}
                  {data.naoIniciados > 0 && (
                    <div
                      style={{ width: `${pctNaoInic}%` }}
                      className="h-full bg-slate-400"
                      title={`Não Iniciados: ${data.naoIniciados}`}
                    />
                  )}
                  {data.vencidos > 0 && (
                    <div
                      style={{ width: `${pctVenc}%` }}
                      className="h-full bg-rose-500"
                      title={`Vencidos: ${data.vencidos}`}
                    />
                  )}
                </div>
              </div>

              {/* Tooltip inline sutil */}
              {isHovered && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                  <span>Concluídos: <strong className="text-emerald-700">{data.concluidos}</strong></span>
                  <span>Em Andamento: <strong className="text-sky-700">{data.iniciados}</strong></span>
                  <span>Não Iniciados: <strong className="text-slate-600">{data.naoIniciados}</strong></span>
                  {data.vencidos > 0 && (
                    <span>Vencidos: <strong className="text-rose-700">{data.vencidos}</strong></span>
                  )}
                  <span className="ml-auto text-[10px] text-blue-600">Filtrar setor &rarr;</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
