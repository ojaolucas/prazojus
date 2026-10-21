import React from 'react';
import { useRequests } from '../../context/RequestContext';
import { useAuth } from '../../context/AuthContext';
import { MetricCards } from './MetricCards';
import { UpcomingDeadlines } from './UpcomingDeadlines';
import { UrgentAlerts } from './UrgentAlerts';
import { SectorDistributionChart } from './SectorDistributionChart';
import { DeadlineTypeDonutChart } from './DeadlineTypeDonutChart';
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
  const { requests, setFilters, exportBackup } = useRequests();
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

  const handleSelectDeadlineType = (type: 'judicial' | 'interno') => {
    setFilters({
      busca: '',
      setor: '',
      tipoExame: '',
      origem: '',
      status: '',
      prioridade: '',
      tipoPrazo: type,
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
            Monitoramento em tempo real do fluxo pericial, riscos de vencimento e capacidade de entrega de laudos.
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

      {/* Seção 1 de Gráficos: Distribuição Setorial & Modalidade de Prazo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectorDistributionChart
            requests={requests}
            onSelectSector={handleSelectSector}
          />
        </div>
        <div className="lg:col-span-1">
          <DeadlineTypeDonutChart
            requests={requests}
            onSelectType={handleSelectDeadlineType}
          />
        </div>
      </div>

      {/* Seção 2 de Gráficos: Vazão Operacional & Órgãos Requisitantes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ThroughputTrendChart requests={requests} />
        </div>
        <div className="lg:col-span-1">
          <TopOriginsChart
            requests={requests}
            onSelectOrigin={handleSelectOrigin}
          />
        </div>
      </div>

      {/* Seção 3: Próximos Vencimentos & Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UpcomingDeadlines
            requests={requests}
            onSelectEvent={onSelectEvent}
            onOpenCalendar={() => onNavigate('calendar')}
          />
        </div>

        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
            <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider block">
              Atalhos Operacionais
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('requests')}
                className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-lg text-left transition-all"
              >
                <span className="text-xs font-medium text-slate-800 block">Lista de Processos</span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Tabela detalhada</span>
              </button>

              <button
                type="button"
                onClick={exportBackup}
                className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-lg text-left transition-all"
              >
                <span className="text-xs font-medium text-slate-800 block">Exportar Backup</span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Download JSON</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/70 text-xs space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
              Gestão Integrada de Prazos
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Os indicadores são recalculados automaticamente com base na data de recebimento
              dos autos e na quantidade de dias determinada judicialmente ou por meta interna.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

