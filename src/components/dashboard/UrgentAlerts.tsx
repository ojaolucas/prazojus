import React from 'react';
import { JudicialRequest } from '../../types/request';
import { AlertCircle, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

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

  const now = new Date();
  const hoje = requests.filter((r) => {
    if (r.status === 'Concluído' || r.status === 'Cancelado' || r.status === 'Vencido') {
      return false;
    }
    const d = new Date(r.prazoJudicial);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  });

  if (vencidas.length === 0 && hoje.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-emerald-900 text-xs">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-emerald-950">Regularidade Processual Mantida</p>
          <p className="text-emerald-800 mt-0.5">
            Não existem laudos periciais com prazo vencido ou com vencimento para as próximas horas hoje.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Alerta de Prazos Vencidos */}
      {vencidas.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 text-xs shadow-2xs animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900 text-sm">
                Atenção: {vencidas.length}{' '}
                {vencidas.length === 1 ? 'requisição com prazo judicial expirado' : 'requisições com prazos judiciais expirados'}
              </p>
              <p className="text-rose-700 mt-0.5">
                Prazos vencidos exigem juntada urgente de laudo pericial ou pedido de dilação fundamentado.
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {vencidas.slice(0, 3).map((r) => (
                  <span
                    key={r.id}
                    onClick={() => onSelectEvent(r)}
                    className="font-mono text-[11px] bg-white border border-rose-300 text-rose-900 px-2 py-0.5 rounded cursor-pointer hover:bg-rose-100 font-semibold"
                  >
                    {r.numeroProcesso}
                  </span>
                ))}
                {vencidas.length > 3 && (
                  <span className="text-[11px] text-rose-600 font-semibold">
                    +{vencidas.length - 3} outros
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onFilterVencidos}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors shrink-0 self-start sm:self-auto"
          >
            Filtrar Vencidos
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Alerta de Prazos Vencendo Hoje */}
      {hoje.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-xs shadow-2xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 text-sm">
                {hoje.length} {hoje.length === 1 ? 'prazo judicial vence hoje' : 'prazos judiciais vencem hoje'}
              </p>
              <p className="text-amber-800 mt-0.5">
                Providencie o protocolo eletrônico das peças antes do término do expediente forense.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {hoje.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelectEvent(r)}
                className="font-mono text-xs bg-white border border-amber-300 text-amber-900 px-2.5 py-1 rounded-lg font-semibold hover:bg-amber-100 transition-colors"
              >
                Proc. {r.numeroProcesso.split('.')[0]}...
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
