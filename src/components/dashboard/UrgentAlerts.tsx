import React from 'react';
import { JudicialRequest } from '../../types/request';

interface UrgentAlertsProps {
  requests: JudicialRequest[];
  onSelectEvent: (req: JudicialRequest) => void;
  onFilterVencidos: () => void;
}

export const UrgentAlerts: React.FC<UrgentAlertsProps> = ({
  requests,
  onSelectEvent,
  onFilterVencidos,
}) => {
  const vencidas = requests.filter((r) => r.status === 'Vencido');

  if (vencidas.length === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-950">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
          <p className="font-bold text-rose-900 text-xs">
            {vencidas.length}{' '}
            {vencidas.length === 1
              ? 'requisição judicial com prazo expirado'
              : 'requisições judiciais com prazos expirados'}
          </p>
        </div>
        <p className="text-rose-700 text-[11px] pl-4">
          Necessitam de juntada de laudo pericial conclusivo ou comunicação processual.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap pl-4 sm:pl-0">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {vencidas.slice(0, 3).map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelectEvent(r)}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-rose-200 text-rose-800 hover:bg-rose-100/60 transition-colors"
            >
              {r.numeroProcesso.split('.')[0]}...
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onFilterVencidos}
          className="text-xs font-semibold px-3 py-1 rounded-lg bg-rose-700 text-white hover:bg-rose-800 transition-colors shrink-0"
        >
          Filtrar Vencidos &rarr;
        </button>
      </div>
    </div>
  );
};
