import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { JudicialRequest } from '../../types/request';
import { formatDatePtBR } from '../../services/deadlineService';
import {
  generateGoogleCalendarUrl,
  downloadIcsFile,
} from '../../services/calendarExportService';
import { AuditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  CalendarPlus,
  Download,
  ExternalLink,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  FileText,
} from 'lucide-react';

interface AddToCalendarModalProps {
  request: JudicialRequest | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToCalendarModal: React.FC<AddToCalendarModalProps> = ({
  request,
  isOpen,
  onClose,
}) => {
  const { currentUser } = useAuth();
  const [exportedMethod, setExportedMethod] = useState<'google' | 'ics' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setExportedMethod(null);
    }
  }, [isOpen]);

  if (!isOpen || !request) return null;

  const eventTitle = `Prazo judicial — Processo ${request.numeroProcesso}`;
  const formattedDate = formatDatePtBR(request.prazoJudicial);

  const handleExportGoogle = () => {
    const url = generateGoogleCalendarUrl(request);
    window.open(url, '_blank', 'noopener,noreferrer');
    setExportedMethod('google');

    // Registro de Auditoria
    AuditService.log({
      modulo: 'requisicoes',
      acao: 'documento',
      descricao: `Geração de link de calendário para Google Agenda do processo "${request.numeroProcesso}".`,
      entidadeReferencia: request.numeroProcesso,
      usuario: currentUser,
      status: 'sucesso',
      metadados: {
        metodo: 'Google Calendar (Web)',
        prazoJudicial: request.prazoJudicial,
      },
    });
  };

  const handleExportIcs = () => {
    downloadIcsFile(request);
    setExportedMethod('ics');

    // Registro de Auditoria
    AuditService.log({
      modulo: 'requisicoes',
      acao: 'documento',
      descricao: `Download de arquivo iCalendar (.ics) do processo "${request.numeroProcesso}".`,
      entidadeReferencia: request.numeroProcesso,
      usuario: currentUser,
      status: 'sucesso',
      metadados: {
        metodo: 'Arquivo .ics (Universal)',
        prazoJudicial: request.prazoJudicial,
      },
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] z-10" onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho do Modal */}
        <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-2xs">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Adicionar à Minha Agenda
              </h3>
              <p className="text-xs text-slate-500">
                Sincronize este prazo judicial com seu calendário pessoal ou corporativo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo do Modal */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Card Resumo do Evento */}
          <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10.5px] font-bold text-blue-800 uppercase tracking-wider">
                Evento de Dia Inteiro
              </span>
              <span className="text-xs font-mono font-bold text-slate-800 bg-white border border-blue-200 px-2 py-0.5 rounded-md shadow-2xs">
                {formattedDate}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-500 block">Título do evento:</span>
              <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug break-all">
                {eventTitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-blue-100/80 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-800">{request.tipoExame}</span>
              <span>•</span>
              <span>{request.setorSolicitante}</span>
              {request.origem && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[200px]">{request.origem}</span>
                </>
              )}
            </div>
          </div>

          {/* Opções de Calendário */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Escolha onde deseja salvar:
            </label>

            {/* Opção 1: Google Calendar */}
            <button
              type="button"
              onClick={handleExportGoogle}
              className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/30 transition-all flex items-center justify-between gap-3 text-left group shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform shrink-0 border border-blue-200/60">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/>
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      Google Agenda
                    </span>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded-full border border-blue-200">
                      Web & Celular
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Abre em nova aba com o evento pré-preenchido pronto para salvar
                  </p>
                </div>
              </div>

              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* Opção 2: Apple Calendar / Outlook (.ics) */}
            <button
              type="button"
              onClick={handleExportIcs}
              className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 transition-all flex items-center justify-between gap-3 text-left group shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 group-hover:scale-105 transition-transform shrink-0 border border-slate-200">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
                      Apple Calendar / Outlook (.ics)
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded-full border border-slate-200">
                      iPhone & Desktop
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Baixa o arquivo universal (.ics) reconhecido pelo iPhone, iPad, Mac e Windows
                  </p>
                </div>
              </div>

              <Download className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-y-0.5 transition-all shrink-0" />
            </button>
          </div>

          {/* Feedback de Confirmação quando o usuário clica */}
          {exportedMethod && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900">
                <span className="font-bold block">
                  {exportedMethod === 'google'
                    ? 'Tela do Google Agenda aberta!'
                    : 'Arquivo do evento baixado com sucesso!'}
                </span>
                <p className="mt-0.5 text-emerald-800 leading-relaxed">
                  {exportedMethod === 'google'
                    ? 'Confira os dados na aba aberta e clique no botão "Salvar" do Google Agenda para confirmar a inclusão na sua conta.'
                    : 'Clique no arquivo .ics baixado (ou abra pelo seu aplicativo de calendário) para confirmar e salvar o evento no seu dispositivo.'}
                </p>
              </div>
            </div>
          )}

          {/* Orientações sobre Sincronização */}
          <div className="pt-1 text-xs text-slate-500">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex items-start gap-2 text-slate-600">
              <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed text-[11px]">
                <strong>Aviso de Sincronização:</strong> Esta exportação cria um evento estático. Caso o prazo judicial seja prorrogado ou alterado no PrazoJus, o evento em sua agenda externa não se atualizará sozinho; será necessário exportar novamente.
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
