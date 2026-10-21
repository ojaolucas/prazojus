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
import {
  Plus,
  Calendar,
  FileSpreadsheet,
  Download,
  Building2,
  PieChart,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

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
      {/* Mensagem de Boas-Vindas e Atalhos Principais */}
      <div className="bg-gradient-to-r from-[#122443] via-[#1F3760] to-[#274578] border border-[#C5B641]/30 text-white p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#EFDD51] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C5B641]" />
            Polícia Científica de Alagoas • Painel Geral
          </span>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            Olá, {currentUser.nome}
          </h2>
          <p className="text-xs sm:text-sm text-[#C9D7EE] mt-1 max-w-xl leading-relaxed">
            Acompanhe em tempo real o fluxo pericial, os indicadores de risco de vencimento,
            a distribuição entre prazos judiciais e metas internas e a capacidade de entrega dos laudos.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-[#0F0D02] bg-[#C5B641] hover:bg-[#EFDD51] rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nova Requisição
          </button>

          <button
            type="button"
            onClick={() => onNavigate('calendar')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-white bg-[#122443]/70 hover:bg-[#122443] border border-[#C9D7EE]/30 rounded-xl transition-all"
          >
            <Calendar className="w-4 h-4 text-[#EFDD51]" />
            Abrir Agenda
          </button>
        </div>
      </div>

      {/* Cartões de Indicadores Principais (KPIs) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Indicadores Gerais do Sistema
          </h3>
          <span className="text-[11px] text-slate-400">
            Calculados dinamicamente em tempo real
          </span>
        </div>
        <MetricCards onFilterByStatus={handleFilterStatus} />
      </div>

      {/* Alertas Críticos de Vencimento e Urgência */}
      <UrgentAlerts
        requests={requests}
        onSelectEvent={onSelectEvent}
        onFilterVencidos={() => handleFilterStatus('Vencido')}
      />

      {/* Bloco 1: Termômetro Geral de Risco e Saúde Processual */}
      <DeadlineRiskGauge
        requests={requests}
        onFilterStatus={handleFilterStatus}
      />

      {/* Bloco 2: Carga Setorial e Proporção de Modalidade de Prazo */}
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

      {/* Bloco 3: Vazão Operacional (Entradas x Laudos) & Top Origens Requisitantes */}
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

      {/* Bloco 4: Próximos Vencimentos na Linha do Tempo e Atalhos de Gestão */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Próximos Prazos */}
        <div className="lg:col-span-2">
          <UpcomingDeadlines
            requests={requests}
            onSelectEvent={onSelectEvent}
            onOpenCalendar={() => onNavigate('calendar')}
          />
        </div>

        {/* Coluna 3: Ações Rápidas e Acesso aos Dados */}
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2.5">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
              Atalhos Operacionais
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onNavigate('requests')}
                className="p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-400 text-left transition-all shadow-2xs group"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-slate-800 block">Lista de Autos</span>
                <span className="text-[10px] text-slate-400">Ver tabela completa</span>
              </button>

              <button
                type="button"
                onClick={exportBackup}
                className="p-3 bg-white border border-slate-200 rounded-lg hover:border-emerald-400 text-left transition-all shadow-2xs group"
              >
                <Download className="w-4 h-4 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-slate-800 block">Exportar Backup</span>
                <span className="text-[10px] text-slate-400">Salvar cópia JSON</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-slate-50 text-xs space-y-2">
            <span className="font-bold text-[#274578] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Gestão Integrada de Laudos
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Todos os indicadores do painel são recalculados automaticamente com base na data de recebimento
              dos autos e na quantidade de dias determinada judicialmente ou por meta interna.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
