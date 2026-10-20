import React from 'react';
import { useRequests } from '../../context/RequestContext';
import {
  FileText,
  Clock,
  PlayCircle,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
} from 'lucide-react';

interface MetricCardsProps {
  onFilterByStatus?: (status: string) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ onFilterByStatus }) => {
  const { requests } = useRequests();

  // Cálculo dinâmico baseado estritamente nos dados locais
  const total = requests.length;
  const naoIniciados = requests.filter((r) => r.status === 'Não iniciado' || r.status === 'Pendente').length;
  const iniciados = requests.filter(
    (r) => r.status === 'Iniciado' || r.status === 'Em andamento' || r.status === 'Aguardando informações'
  ).length;
  const vencidas = requests.filter((r) => r.status === 'Vencido').length;
  const concluidas = requests.filter((r) => r.status === 'Concluído').length;

  // Vencimentos próximos: prazo futuro dentro dos próximos 7 dias e não concluído/cancelado
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
      desc: 'Processos periciais cadastrados',
      icon: <FileText className="w-5 h-5 text-[#274578]" />,
      bg: 'bg-white',
      border: 'border-slate-200',
      text: 'text-[#122443]',
      statusFilter: '',
    },
    {
      id: 'vencidas',
      title: 'Prazos Vencidos',
      value: vencidas,
      desc: vencidas > 0 ? 'Exigem regularização urgente' : 'Nenhum prazo em atraso',
      icon: <AlertTriangle className="w-5 h-5 text-[#D12429]" />,
      bg: vencidas > 0 ? 'bg-[#FCD5D1]/30' : 'bg-white',
      border: vencidas > 0 ? 'border-[#FA9C93]' : 'border-slate-200',
      text: vencidas > 0 ? 'text-[#97171B]' : 'text-slate-900',
      statusFilter: 'Vencido',
      isAlert: vencidas > 0,
    },
    {
      id: 'proximos',
      title: 'Vencimentos Próximos',
      value: vencimentosProximos,
      desc: 'Vencem nos próximos 7 dias',
      icon: <CalendarDays className="w-5 h-5 text-[#9D9032]" />,
      bg: vencimentosProximos > 0 ? 'bg-[#EFDD51]/15' : 'bg-white',
      border: vencimentosProximos > 0 ? 'border-[#C5B641]/60' : 'border-slate-200',
      text: 'text-[#554E17]',
      statusFilter: 'proximos',
    },
    {
      id: 'iniciados',
      title: 'Iniciados',
      value: iniciados,
      desc: 'Exames em execução pericial',
      icon: <PlayCircle className="w-5 h-5 text-[#274578]" />,
      bg: 'bg-white',
      border: 'border-slate-200',
      text: 'text-[#274578]',
      statusFilter: 'Iniciado',
    },
    {
      id: 'nao_iniciados',
      title: 'Não Iniciados',
      value: naoIniciados,
      desc: 'Aguardando início dos trabalhos',
      icon: <Clock className="w-5 h-5 text-slate-600" />,
      bg: 'bg-white',
      border: 'border-slate-200',
      text: 'text-slate-700',
      statusFilter: 'Não iniciado',
    },
    {
      id: 'concluidas',
      title: 'Concluídas',
      value: concluidas,
      desc: 'Laudos entregues ao juízo',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-white',
      border: 'border-slate-200',
      text: 'text-emerald-700',
      statusFilter: 'Concluído',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => (
        <div
          key={c.id}
          onClick={() => onFilterByStatus && onFilterByStatus(c.statusFilter)}
          className={`p-4 rounded-xl border ${c.border} ${c.bg} shadow-2xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 line-clamp-1">{c.title}</span>
            <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
              {c.icon}
            </div>
          </div>

          <div>
            <div className={`text-2xl font-bold tracking-tight ${c.text}`}>
              {c.value}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-tight">
              {c.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
