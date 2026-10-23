import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRequests } from '../../context/RequestContext';
import { NavTab } from '../layout/Sidebar';
import {
  AlertTriangle,
  Clock,
  Sparkles,
  X,
  ChevronRight,
  Shield,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface VirtualAssistantProps {
  onNavigate: (tab: NavTab) => void;
  currentTab?: NavTab;
}

export const VirtualAssistant: React.FC<VirtualAssistantProps> = ({
  onNavigate,
  currentTab = 'dashboard',
}) => {
  // 1. Visível EXCLUSIVAMENTE na dashboard
  if (currentTab !== 'dashboard') {
    return null;
  }

  const { currentUser } = useAuth();
  const { requests, setFilters, resetFilters } = useRequests();

  // Controla se a Dayse está aberta em modo normal (mascote + balão completo)
  // ou fechada no modo flutuante compacto (caixa/balão flutuante moderno).
  // Inicia minimizado por padrão conforme solicitado.
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // À medida que o usuário scrolla a página na dashboard, o balão vai desaparecendo suavemente
  const [scrollOpacity, setScrollOpacity] = useState<number>(1);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      // Começa a esmaecer suavemente após 20px e desaparece completamente por volta de 180px
      const fadeStart = 20;
      const fadeEnd = 180;

      if (scrollY <= fadeStart) {
        setScrollOpacity(1);
      } else if (scrollY >= fadeEnd) {
        setScrollOpacity(0);
      } else {
        const factor = 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart);
        setScrollOpacity(Math.max(0, Math.min(1, factor)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Etapa atual da mensagem quando aberta: 'welcome' | 'pendencias'
  const [activeMessage, setActiveMessage] = useState<'welcome' | 'pendencias'>('welcome');

  // Nome do usuário formatado
  const userName = currentUser?.nome || 'Usuário';

  // Saudação dinâmica conforme o horário atual: Bom dia, Boa tarde ou Boa noite
  const greetingTime = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  // 1. Requisições ativas (concluídas ou canceladas são estritamente excluídas)
  const activeRequests = useMemo(() => {
    return requests.filter(
      (r) => r.status !== 'Concluído' && r.status !== 'Cancelado'
    );
  }, [requests]);

  // 2. Prazos vencidos contabilizados separadamente a partir do localStorage
  const vencidosList = useMemo(() => {
    const now = new Date();
    return activeRequests.filter(
      (r) =>
        r.status === 'Vencido' ||
        new Date(r.prazoJudicial).getTime() < now.getTime()
    );
  }, [activeRequests]);

  // 3. Requisições pendentes (ativas dentro do prazo, sem duplicar com vencidos)
  const pendentesList = useMemo(() => {
    const now = new Date();
    return activeRequests.filter(
      (r) =>
        r.status !== 'Vencido' &&
        new Date(r.prazoJudicial).getTime() >= now.getTime()
    );
  }, [activeRequests]);

  const X_count = pendentesList.length;
  const Y_count = vencidosList.length;
  const totalPendencias = X_count + Y_count;

  // Direcionamento com aplicação dos filtros correspondentes
  const handleNavigateWithFilter = (targetStatus: 'Vencido' | 'pendentes' | '') => {
    setFilters({
      busca: '',
      setor: '',
      tipoExame: '',
      origem: '',
      status: targetStatus,
      prioridade: '',
      tipoPrazo: '',
      dataInicio: '',
      dataFim: '',
    });
    onNavigate('requests');
  };

  // Clique no balão de pendências direciona para a lista filtrada
  const handlePendenciasClick = () => {
    if (Y_count > 0) {
      handleNavigateWithFilter('Vencido');
    } else if (X_count > 0) {
      handleNavigateWithFilter('pendentes');
    } else {
      handleNavigateWithFilter('');
    }
  };

  return (
    <div
      className="fixed bottom-0 right-3 sm:right-6 z-40 flex flex-col items-end pointer-events-none select-none"
      style={{
        opacity: isOpen ? 1 : scrollOpacity,
        transform: isOpen
          ? 'translateY(0)'
          : `translateY(${(1 - scrollOpacity) * 16}px) scale(${0.92 + scrollOpacity * 0.08})`,
        pointerEvents: !isOpen && scrollOpacity < 0.1 ? 'none' : undefined,
        transition: 'opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      aria-label="Assistente Virtual Dayse - PrazoJus"
    >
      {/* ======================================================== */}
      {/* 1. MODO ABERTO: Dayse aparece normal com o balão completo */}
      {/* ======================================================== */}
      {isOpen ? (
        <div className="flex flex-col items-end animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* Balão de Mensagens Pop-up (Completo) */}
          <div className="relative mb-1 pointer-events-auto w-[calc(100vw-28px)] sm:w-[330px]">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl p-4 text-slate-800 transition-all relative z-20">
              {/* Cabeçalho do Balão */}
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                    <Shield className="w-3 h-3 text-[#274578]" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold text-slate-800 leading-tight">
                      Dayse
                    </span>
                    <span className="text-[9.5px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200/60 leading-none">
                      Assistente Virtual
                    </span>
                  </div>
                </div>

                {/* Botão de Fechar: quando clica, Dayse volta a ficar em modo balão flutuante compacto */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Fechar (voltar para balão flutuante)"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Alternador Rápido de Abas */}
              <div className="flex items-center gap-1 mb-3 bg-slate-100/90 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveMessage('welcome')}
                  className={`flex-1 py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeMessage === 'welcome'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  <span>Boas-vindas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMessage('pendencias')}
                  className={`flex-1 py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeMessage === 'pendencias'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span>Pendências</span>
                  {totalPendencias > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        Y_count > 0
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {totalPendencias}
                    </span>
                  )}
                </button>
              </div>

              {/* Conteúdo Dinâmico das Mensagens */}
              {activeMessage === 'welcome' ? (
                /* 1. MENSAGEM DE BOAS-VINDAS */
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100/80">
                    <p className="text-xs text-slate-700 leading-relaxed">
                      <span className="font-bold text-[#1b345d] text-[13px] block mb-1">
                        Olá, {userName}! {greetingTime}!
                      </span>
                      Sou a <strong>Dayse</strong>. Vou ajudar você a acompanhar seus prazos judiciais.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveMessage('pendencias')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-white bg-[#274578] hover:bg-[#1b345d] rounded-xl shadow-xs transition-colors cursor-pointer group"
                  >
                    <span>Ver resumo de pendências</span>
                    <div className="flex items-center gap-1.5">
                      {totalPendencias > 0 && (
                        <span className="bg-amber-400 text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                          {totalPendencias}
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                </div>
              ) : (
                /* 2. MENSAGEM DE PENDÊNCIAS */
                <div className="space-y-2.5">
                  <div
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 transition-all text-left"
                  >
                    <p className="text-xs text-slate-700 leading-relaxed">
                      <span className="font-bold text-amber-700 text-[12.5px] block mb-1">
                        Atenção, {userName}!
                      </span>
                      Você tem <strong className="text-slate-900 font-bold">{X_count}</strong>{' '}
                      {X_count === 1 ? 'requisição pendente' : 'requisições pendentes'} e{' '}
                      <strong className="text-rose-700 font-bold">{Y_count}</strong>{' '}
                      {Y_count === 1 ? 'prazo vencido' : 'prazos vencidos'}.{' '}
                      <span className="text-slate-600 block mt-1 font-medium">
                        Confira suas pendências nos botões abaixo:
                      </span>
                    </p>
                  </div>

                  {/* Botões de Acesso Rápido com Filtros Adequados */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleNavigateWithFilter('Vencido')}
                      className={`flex-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        Y_count > 0
                          ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                      <span>{Y_count} Vencidos</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigateWithFilter('pendentes')}
                      className="flex-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-blue-600" />
                      <span>{X_count} Pendentes</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-1.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveMessage('welcome')}
                      className="flex items-center gap-1 hover:text-slate-700 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Saudação</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavigateWithFilter('')}
                      className="font-medium text-blue-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Ver todas</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Rodapé com botão de recolher para o modo balão flutuante */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>Atualizado dinamicamente</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="hover:underline text-slate-600 font-medium cursor-pointer"
                >
                  Recolher para balão
                </button>
              </div>
            </div>

            {/* Ponta do balão apontando perfeitamente para a Dayse */}
            <div className="absolute -bottom-1.5 right-12 sm:right-16 w-3.5 h-3.5 bg-white border-r border-b border-slate-200/90 rotate-45 z-10" />
          </div>

          {/* Mascote Dayse em tamanho normal, ancorada ao rodapé (bottom-0) */}
          <div className="pointer-events-auto relative group flex items-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="focus:outline-none transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer block"
              title="Recolher Dayse para balão flutuante"
              aria-label="Recolher Dayse"
            >
              <img
                src="/dayse.png"
                alt="Dayse - Assistente Virtual da Polícia Científica"
                className="h-36 sm:h-44 md:h-48 w-auto object-contain drop-shadow-2xl select-none"
              />
            </button>
          </div>
        </div>
      ) : (
        /* ====================================================================== */
        /* 2. MODO FECHADO: Caixa/Balão Flutuante                                  */
        /* ====================================================================== */
        <div className="pointer-events-auto mb-4 sm:mb-5 mr-1 sm:mr-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="relative group">
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setActiveMessage('welcome');
              }}
              className="flex items-center gap-2.5 bg-white/95 hover:bg-white backdrop-blur-md text-slate-800 border border-slate-200/90 hover:border-blue-300 shadow-lg hover:shadow-xl rounded-2xl px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Clique para abrir a Assistente Dayse"
              aria-label="Abrir Assistente Dayse"
            >
              {/* Foto Avatar Redonda da Dayse com indicador de status */}
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-300/80 shrink-0 shadow-2xs">
                <img
                  src="/dayse.png"
                  alt="Dayse"
                  className="w-full h-full object-cover object-top scale-125"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-white rounded-full" />
              </div>

              {/* Conteúdo textual da caixa de balão */}
              <div className="flex flex-col pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold text-slate-800 group-hover:text-blue-900 transition-colors">
                    Dayse
                  </span>
                  <span className="text-[9.5px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded-full border border-blue-200/60 leading-none">
                    Assistente
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                  {totalPendencias > 0 ? (
                    <>
                      <span className="text-rose-600 font-bold">{totalPendencias} pendências</span>
                      <span className="text-slate-400">• ver</span>
                    </>
                  ) : (
                    <>
                      <span>Acompanhar prazos</span>
                      <span>👋</span>
                    </>
                  )}
                </span>
              </div>

              {/* Badge de Alerta com a contagem das pendências */}
              {totalPendencias > 0 && (
                <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none shadow-xs animate-pulse">
                  {totalPendencias}
                </span>
              )}
            </button>

            {/* Pontinha de balão de fala */}
            <div className="absolute -bottom-1 right-7 w-2.5 h-2.5 bg-white border-r border-b border-slate-200/90 rotate-45 pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
};
