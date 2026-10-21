import React from 'react';
import { useRequests } from '../../context/RequestContext';

interface MetricCardsProps {
  onFilterByStatus?: (status: string) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ onFilterByStatus }) => {
  const { requests } = useRequests();

  const total = requests.length;
  const naoIniciados = requests.filter(
    (r) => r.status === 'Não iniciado' || r.status === 'Pendente'
  ).length;
  const iniciados = requests.filter(
    (r) =>
      r.status === 'Iniciado' ||
      r.status === 'Em andamento' ||
      r.status === 'Aguardando informações'
  ).length;
  const vencidas = requests.filter((r) => r.status === 'Vencido').length;
  const concluidas = requests.filter((r) => r.status === 'Concluído').length;

  const now = new Date();
  const seteDias = new Date();
  seteDias.setDate(seteDias.getDate() + 7);

  const vencimentosProximos = requests.filter((r) => {
    if (r.status === 'Concluído' || r.status === 'Cancelado' || r.status === 'Vencido') {
      return false;
    }
    const prazo = new Date(r.prazoJudicial);
    return prazo >= now && prazo <= seteDias;
  }).length;

  const cards = [
    {
      id: 'total',
      title: 'Total de Requisições',
      value: total,
      desc: 'Autos cadastrados',
      statusFilter: '',
      accent: 'border-slate-200',
      valueColor: 'text-slate-900',
    },
    {
      id: 'vencidas',
      title: 'Prazos Vencidos',
      value: vencidas,
      desc: vencidas > 0 ? 'Exigem providência' : 'Nenhum em atraso',
      statusFilter: 'Vencido',
      accent: vencidas > 0 ? 'border-rose-400 bg-rose-50/40' : 'border-slate-200',
      valueColor: vencidas > 0 ? 'text-rose-700' : 'text-slate-900',
      badge: vencidas > 0 ? 'Atenção' : undefined,
    },
    {
      id: 'proximos',
      title: 'Vencem em 7 Dias',
      value: vencimentosProximos,
      desc: 'Próximos prazos',
      statusFilter: 'proximos',
      accent: vencimentosProximos > 0 ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200',
      valueColor: vencimentosProximos > 0 ? 'text-amber-800' : 'text-slate-900',
    },
    {
      id: 'iniciados',
      title: 'Em Andamento',
      value: iniciados,
      desc: 'Exames em execução',
      statusFilter: 'Iniciado',
      accent: 'border-slate-200',
      valueColor: 'text-[#274578]',
    },
    {
      id: 'nao_iniciados',
      title: 'Não Iniciados',
      value: naoIniciados,
      desc: 'Aguardando perícia',
      statusFilter: 'Não iniciado',
      accent: 'border-slate-200',
      valueColor: 'text-slate-600',
    },
    {
      id: 'concluidas',
      title: 'Concluídas',
      value: concluidas,
      desc: 'Laudos entregues',
      statusFilter: 'Concluído',
      accent: 'border-slate-200',
      valueColor: 'text-emerald-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => (
        <div
          key={c.id}
          onClick={() => onFilterByStatus && onFilterByStatus(c.statusFilter)}
          className={`p-3.5 rounded-xl border bg-white ${c.accent} hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between shadow-2xs group`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              {c.title}
            </span>
            {c.badge && (
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                {c.badge}
              </span>
            )}
          </div>

          <div>
            <div className={`text-2xl font-black font-mono tracking-tight ${c.valueColor}`}>
              {c.value}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              {c.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
