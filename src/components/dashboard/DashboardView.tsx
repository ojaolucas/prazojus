import React from 'react';
import { useRequests } from '../../context/RequestContext';
import { useAuth } from '../../context/AuthContext';
import { MetricCards } from './MetricCards';
import { UpcomingDeadlines } from './UpcomingDeadlines';
import { UrgentAlerts } from './UrgentAlerts';
import { JudicialRequest } from '../../types/request';
import {
  Plus,
  Calendar,
  FileSpreadsheet,
  Download,
  Building2,
  PieChart,
  ArrowRight,
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
    setFilters((prev) => ({ ...prev, status }));
    onNavigate('requests');
  };

  // Distribuição por Setor
  const sectorCounts: Record<string, number> = {};
  requests.forEach((r) => {
    sectorCounts[r.setorSolicitante] = (sectorCounts[r.setorSolicitante] || 0) + 1;
  });

  const sortedSectors = Object.entries(sectorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Mensagem de Boas-Vindas e Atalhos Principais */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">
            Painel Geral de Controle
          </span>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            Olá, {currentUser.nome}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            Acompanhe o fluxo de prazos judiciais, distribuição por setores periciais e
            vencimentos prioritários calculados a partir dos autos locais.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nova Requisição
          </button>

          <button
            type="button"
            onClick={() => onNavigate('calendar')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all"
          >
            <Calendar className="w-4 h-4" />
            Abrir Agenda
          </button>
        </div>
      </div>

      {/* Cartões de Indicadores (KPIs) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Indicadores do Sistema de Prazos
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

      {/* Grade Principal: Próximos Prazos + Distribuição Setorial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Próximos Prazos */}
        <div className="lg:col-span-2">
          <UpcomingDeadlines
            requests={requests}
            onSelectEvent={onSelectEvent}
            onOpenCalendar={() => onNavigate('calendar')}
          />
        </div>

        {/* Coluna 3: Distribuição por Setor & Ações Rápidas */}
        <div className="space-y-6">
          {/* Card Distribuição por Setor */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-blue-700" />
                Demandas por Setor
              </h3>
              <span className="text-[11px] text-slate-400">Top 5 setores</span>
            </div>

            <div className="space-y-3">
              {sortedSectors.map(([sector, count]) => {
                const percent = Math.round((count / (requests.length || 1)) * 100);

                return (
                  <div
                    key={sector}
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, setor: sector }));
                      onNavigate('requests');
                    }}
                    className="cursor-pointer group"
                  >
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700 group-hover:text-blue-700 truncate max-w-[200px]">
                        {sector}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all group-hover:bg-blue-700"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('requests')}
              className="w-full text-center text-xs font-medium text-blue-700 hover:text-blue-900 pt-1 block"
            >
              Consultar todos os setores no painel &rarr;
            </button>
          </div>

          {/* Atalhos Rápidos */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
              Atalhos Operacionais
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onNavigate('requests')}
                className="p-2.5 bg-white border border-slate-200 rounded-lg hover:border-blue-400 text-left transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-600 mb-1" />
                <span className="font-semibold text-slate-800 block">Lista de Autos</span>
                <span className="text-[10px] text-slate-400">Ver tabela completa</span>
              </button>

              <button
                type="button"
                onClick={exportBackup}
                className="p-2.5 bg-white border border-slate-200 rounded-lg hover:border-emerald-400 text-left transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="font-semibold text-slate-800 block">Exportar Backup</span>
                <span className="text-[10px] text-slate-400">Salvar cópia JSON</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
