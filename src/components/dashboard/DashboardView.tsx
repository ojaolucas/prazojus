import React from 'react';
import { useRequests } from '../../context/RequestContext';
import { useAuth } from '../../context/AuthContext';
import { MetricCards } from './MetricCards';
import { UpcomingDeadlines } from './UpcomingDeadlines';
import { SectorDistributionChart } from './SectorDistributionChart';
import { ThroughputTrendChart } from './ThroughputTrendChart';
import { TopOriginsChart } from './TopOriginsChart';
import { JudicialRequest } from '../../types/request';
import { Zap, ArrowRight } from 'lucide-react';

import { NavTab } from '../layout/Sidebar';

interface DashboardViewProps {
  onNavigate: (view: NavTab) => void;
  onSelectEvent: (req: JudicialRequest) => void;
  onOpenCreate: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectEvent,
  onOpenCreate,
}) => {
  const { requests, setFilters } = useRequests();
  const { currentUser, can } = useAuth();

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

  const handleFilterAguardando = () => {
    setFilters({
      busca: '',
      setor: '',
      tipoExame: '',
      origem: '',
      status: '',
      statusOperacional: 'Aguardando recebimento',
      prioridade: '',
      tipoPrazo: '',
    });
    onNavigate('requests');
  };

  const aguardandoCount = requests.filter(
    (r) => r.statusOperacional === 'Aguardando recebimento'
  ).length;

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
          {can('canCreateRequest') && (
            <button
              type="button"
              onClick={onOpenCreate}
              className="px-3.5 py-2 text-xs font-semibold text-[#0F0D02] bg-[#C5B641] hover:bg-[#EFDD51] rounded-lg transition-all shadow-xs"
            >
              Nova Requisição
            </button>
          )}
        </div>
      </div>

      {/* Alerta de Fila de Entrada / Aguardando Recebimento */}
      {aguardandoCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 p-4 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-2">
                <span>Fila de Entrada: {aguardandoCount} requisição(ões) aguardando recebimento</span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              </h4>
              <p className="text-xs text-amber-800/80 mt-0.5">
                Demandas cadastradas pela triagem da Direção aguardando atribuição explícita por perito do setor responsável.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFilterAguardando}
            className="px-3.5 py-1.5 text-xs font-bold text-amber-950 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0"
          >
            <span>Ver Fila do Setor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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


