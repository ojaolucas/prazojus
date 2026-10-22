import React from 'react';
import { useRequests } from '../../context/RequestContext';
import { useAuth } from '../../context/AuthContext';
import { MetricCards } from './MetricCards';
import { UpcomingDeadlines } from './UpcomingDeadlines';
import { UrgentAlerts } from './UrgentAlerts';
import { SectorDistributionChart } from './SectorDistributionChart';
import { DeadlineRiskGauge } from './DeadlineRiskGauge';
import { ThroughputTrendChart } from './ThroughputTrendChart';
import { TopOriginsChart } from './TopOriginsChart';
import { JudicialRequest } from '../../types/request';

interface DashboardViewProps {
  onNavigate: (view: 'dashboard' | 'calendar' | 'requests' | 'notifications' | 'users' | 'settings') => void;
  onSelectEvent: (req: JudicialRequest) => void;
  onOpenCreate: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectEvent,
  onOpenCreate,
}) => {
  const { requests, setFilters } = useRequests();
  const { currentUser } = useAuth();

  const handleFilterStatus = (status: string) => {
    setFilters({
      busca: '',
      setor: '',
      tipoExame: '',
      origem: '',
      status,
      prioridade: '',
      tipoPrazo: '',
    });
    onNavigate('requests');
  };

  const handleSelectSector = (sector: string) => {
    setFilters({
      busca: '',
      setor: sector,
      tipoExame: '',
      origem: '',
      status: '',
      prioridade: '',
      tipoPrazo: '',
    });
    onNavigate('requests');
  };

  const handleSelectOrigin = (origin: string) => {
    setFilters({
      busca: '',
      setor: '',
      tipoExame: '',
      origem: origin,
      status: '',
      prioridade: '',
      tipoPrazo: '',
    });
    onNavigate('requests');
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho Minimalista e Executivo */}
      <div className="bg-[#122443] text-white p-5 sm:p-6 rounded-xl border border-slate-800/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-slate-300 uppercase">
            Polícia Científica de Alagoas • Painel Geral
          </span>
          <h2 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
            Olá, {currentUser.nome}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            Monitoramento em tempo real do fluxo pericial, riscos de vencimento e capacidade de entrega de laudos periciais por ordem judicial.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigate('calendar')}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg transition-all"
          >
            Abrir Agenda
          </button>
          <button
            type="button"
            onClick={onOpenCreate}
            className="px-3.5 py-2 text-xs font-semibold text-[#0F0D02] bg-[#C5B641] hover:bg-[#EFDD51] rounded-lg transition-all shadow-xs"
          >
            Nova Requisição
          </button>
        </div>
      </div>

      {/* Cartões de Indicadores Principais (KPIs) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Indicadores do Sistema
          </h3>
          <span className="text-[11px] text-slate-400">
            Atualizado dinamicamente
          </span>
        </div>
        <MetricCards onFilterByStatus={handleFilterStatus} />
      </div>

      {/* Alerta de Prazos Vencidos */}
      <UrgentAlerts
        requests={requests}
        onSelectEvent={onSelectEvent}
        onFilterVencidos={() => handleFilterStatus('Vencido')}
      />

      {/* Termômetro Geral de Risco e Saúde Processual */}
      <DeadlineRiskGauge
        requests={requests}
        onFilterStatus={handleFilterStatus}
      />

      {/* Grade de Gráficos Padronizada (Ordem e Dimensões Uniformes) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <UpcomingDeadlines
          requests={requests}
          onSelectEvent={onSelectEvent}
          onOpenCalendar={() => onNavigate('calendar')}
        />
        <SectorDistributionChart
          requests={requests}
          onSelectSector={handleSelectSector}
        />
        <TopOriginsChart
          requests={requests}
          onSelectOrigin={handleSelectOrigin}
        />
        <ThroughputTrendChart requests={requests} />
      </div>
    </div>
  );
};


