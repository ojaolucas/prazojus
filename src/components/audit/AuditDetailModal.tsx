import React from 'react';
import { AuditLogEntry } from '../../types/audit';
import { Modal } from '../layout/Modal';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Layers,
  FileText,
  Lock,
  ArrowRight,
  Hash,
  Shield,
  ImageOff,
} from 'lucide-react';
import { FIELD_LABELS } from '../../services/auditService';

interface AuditDetailModalProps {
  log: AuditLogEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({
  log,
  isOpen,
  onClose,
}) => {
  if (!log) return null;

  const isSuccess = log.status === 'sucesso';

  const getModuleLabel = (mod: string) => {
    switch (mod) {
      case 'requisicoes':
        return 'Requisições & Autos';
      case 'usuarios':
        return 'Gestão de Usuários';
      case 'documentos':
        return 'Documentos & Anexos';
      case 'autenticacao':
        return 'Acesso & Autenticação';
      case 'backup':
        return 'Backup & Dados';
      case 'sistema':
        return 'Sistema & Parâmetros';
      default:
        return mod;
    }
  };

  const getActionBadge = (acao: string) => {
    switch (acao) {
      case 'criacao':
        return { label: 'Criação / Cadastro', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'edicao':
        return { label: 'Modificação / Edição', color: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'exclusao':
        return { label: 'Exclusão de Registro', color: 'bg-red-50 text-red-800 border-red-200' };
      case 'status':
        return { label: 'Mudança de Status', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'documento':
        return { label: 'Documento / Anexo', color: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'acesso':
        return { label: 'Autenticação / Sessão', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'backup':
        return { label: 'Cópia de Segurança', color: 'bg-teal-50 text-teal-800 border-teal-200' };
      default:
        return { label: acao, color: 'bg-slate-50 text-slate-800 border-slate-200' };
    }
  };

  const actionMeta = getActionBadge(log.acao);

  const isImageField = (campo: string, val: any) => {
    if (campo === 'avatarUrl') return true;
    if (
      typeof val === 'string' &&
      (val.startsWith('data:image/') ||
        val.startsWith('blob:') ||
        val.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i))
    ) {
      return true;
    }
    return false;
  };

  const isUnsetValue = (val: any) => {
    if (val === null || val === undefined || val === '') return true;
    const s = String(val).trim().toLowerCase();
    return (
      s === '-' ||
      s === '(não definido)' ||
      s === '(nenhum setor)' ||
      s === '(nenhum documento)' ||
      s === '(nenhum setor atribuído)'
    );
  };

  const getFriendlyFieldLabel = (campo: string, originalRotulo?: string) => {
    if (campo === 'avatarUrl') return 'Foto de Perfil';
    if (FIELD_LABELS[campo]) return FIELD_LABELS[campo];
    if (originalRotulo && originalRotulo !== campo) return originalRotulo;
    return campo;
  };

  const renderDiffValue = (
    campo: string,
    val: any,
    type: 'anterior' | 'novo'
  ) => {
    const isImg = isImageField(campo, val);
    const unset = isUnsetValue(val);

    // Tratamento elegante para Foto de Perfil / Avatar (evita despejo de texto base64 puro)
    if (isImg) {
      if (unset) {
        if (type === 'anterior') {
          return (
            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                  Sem foto cadastrada
                </span>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  Nenhum avatar prévio
                </span>
              </div>
            </div>
          );
        }
        return (
          <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-rose-50/80 border border-rose-200 text-rose-700">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 shrink-0">
              <ImageOff className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-rose-800 whitespace-nowrap">
                Foto removida
              </span>
              <span className="text-[10px] text-rose-600 whitespace-nowrap">
                Sem foto de perfil
              </span>
            </div>
          </div>
        );
      }

      // Imagem presente: exibe miniatura visual de avatar
      if (type === 'anterior') {
        return (
          <div className="inline-flex items-center gap-2.5 p-1.5 pr-3 rounded-lg bg-rose-50/70 border border-rose-200 text-rose-900">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-rose-300 ring-2 ring-rose-100 shadow-2xs shrink-0 bg-white">
              <img
                src={String(val)}
                alt="Foto anterior"
                className="w-full h-full object-cover opacity-75"
              />
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-[11px] font-bold text-rose-800 line-through truncate">
                Foto anterior
              </span>
              <span className="text-[10px] text-rose-600 font-medium whitespace-nowrap">
                Substituída ou removida
              </span>
            </div>
          </div>
        );
      }

      return (
        <div className="inline-flex items-center gap-2.5 p-1.5 pr-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-900">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-emerald-400 ring-2 ring-emerald-100 shadow-2xs shrink-0 bg-white">
            <img
              src={String(val)}
              alt="Nova foto"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0 text-left">
            <span className="text-[11px] font-bold text-emerald-800 truncate">
              Nova foto de perfil
            </span>
            <span className="text-[10px] text-emerald-600 font-medium whitespace-nowrap">
              Foto anexada com sucesso
            </span>
          </div>
        </div>
      );
    }

    // Tratamento para valores não definidos / vazios em outros campos (impede compactação vertical)
    if (unset) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-medium whitespace-nowrap select-none">
          (não definido)
        </span>
      );
    }

    // Tratamento para Setores Responsáveis (exibir como tags individuais)
    if (campo === 'setores') {
      const sectorList = String(val)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (sectorList.length > 0) {
        return (
          <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
            {sectorList.map((sec, i) => (
              <span
                key={i}
                className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${
                  type === 'anterior'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200 line-through'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium'
                }`}
              >
                {sec}
              </span>
            ))}
          </div>
        );
      }
    }

    // Tratamento padrão para outros campos
    return (
      <span
        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-mono break-words ${
          type === 'anterior'
            ? 'bg-rose-50 text-rose-800 border border-rose-200 line-through'
            : 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
        }`}
      >
        {String(val)}
      </span>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registro de Auditoria"
      subtitle={`Código: #${log.id} • Gravado em ${log.dataHoraFormatada}`}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Barra Superior de Status e Metadados */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status da Operação */}
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${
                isSuccess
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
              )}
              <span>{isSuccess ? 'Operação Concluída com Sucesso' : 'Falha / Ação Interceptada'}</span>
            </span>

            {/* Ação */}
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${actionMeta.color}`}
            >
              {actionMeta.label}
            </span>

            {/* Módulo */}
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              Módulo: {getModuleLabel(log.modulo)}
            </span>
          </div>

          <div className="text-xs text-slate-500 font-mono flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{log.dataHoraFormatada}</span>
          </div>
        </div>

        {/* Informações do Responsável e Objeto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Card Usuário */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Usuário Responsável</span>
            </span>
            <p className="text-sm font-bold text-slate-900 leading-tight">
              {log.usuarioNome}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap pt-0.5">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-[11px]">
                {log.usuarioRole}
              </span>
              {log.usuarioMatricula && log.usuarioMatricula !== 'POLCAL-SYS' && (
                <span className="font-mono text-slate-500 text-[11px]">
                  Matrícula: {log.usuarioMatricula}
                </span>
              )}
            </div>
          </div>

          {/* Card Contexto da Ação */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Objeto Afetado / Referência</span>
            </span>
            <p className="text-sm font-bold text-slate-900 font-mono leading-tight">
              {log.entidadeReferencia || log.entidadeId || 'Sistema'}
            </p>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span>Módulo: <strong>{getModuleLabel(log.modulo)}</strong></span>
            </div>
          </div>
        </div>

        {/* Descrição Completa da Operação */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Descrição Detalhada da Operação
          </span>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
            {log.descricao}
          </p>
        </div>

        {/* Alerta de Falha/Bloqueio se houver */}
        {!isSuccess && log.motivoFalha && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Motivo do Bloqueio / Falha Operacional:</span>
            </div>
            <p className="text-slate-700 leading-relaxed pl-5 font-medium">{log.motivoFalha}</p>
          </div>
        )}

        {/* Tabela de Detalhamento das Alterações (Diff Antes vs Depois) */}
        {log.detalhes && log.detalhes.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Detalhamento dos Dados Alterados (Antes vs. Depois)</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {log.detalhes.length} campo(s) modificado(s)
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-left border-collapse text-xs">
                  <colgroup>
                    <col className="w-[24%] min-w-[120px]" />
                    <col className="w-[36%] min-w-[160px]" />
                    <col className="w-[6%] min-w-[32px]" />
                    <col className="w-[34%] min-w-[160px]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <th className="py-2.5 px-3.5">Campo</th>
                      <th className="py-2.5 px-3.5">Valor Anterior</th>
                      <th className="py-2.5 px-1 text-center"></th>
                      <th className="py-2.5 px-3.5">Novo Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {log.detalhes.map((item, idx) => {
                      const fieldLabel = getFriendlyFieldLabel(item.campo, item.rotulo);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3.5 font-semibold text-slate-800 align-top">
                            <div className="text-xs text-slate-900 font-medium leading-tight">
                              {fieldLabel}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono font-normal block mt-0.5">
                              {item.campo}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 align-top">
                            {renderDiffValue(item.campo, item.valorAnterior, 'anterior')}
                          </td>
                          <td className="py-2.5 px-1 text-center align-middle text-slate-400">
                            <ArrowRight className="w-3.5 h-3.5 mx-auto" />
                          </td>
                          <td className="py-2.5 px-3.5 align-top">
                            {renderDiffValue(item.campo, item.valorNovo, 'novo')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Metadados Técnicos Adicionais se existirem */}
        {log.metadados && Object.keys(log.metadados).length > 0 && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Metadados Adicionais
            </span>
            <div className="flex flex-col gap-2 text-slate-600">
              {Object.entries(log.metadados).map(([k, v]) => {
                let formattedValue = '-';
                if (v !== null && v !== undefined) {
                  if (typeof v === 'object') {
                    const entries = Object.entries(v).filter(
                      ([_, val]) => val !== '' && val !== null && val !== undefined
                    );
                    formattedValue =
                      entries.length > 0
                        ? entries.map(([subK, subV]) => `${subK}: ${subV}`).join(' • ')
                        : 'Todos os registros (Sem restrições)';
                  } else {
                    formattedValue = String(v);
                  }
                }

                const labelKey =
                  k === 'totalRegistros'
                    ? 'Total de Registros'
                    : k === 'formato'
                    ? 'Formato'
                    : k === 'filtrosAtivos'
                    ? 'Filtros Ativos'
                    : k === 'origem'
                    ? 'Origem da Ação'
                    : k === 'ip'
                    ? 'Endereço IP'
                    : k;

                return (
                  <div key={k} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 text-xs">
                    <span className="font-semibold text-slate-700 sm:w-36 shrink-0">{labelKey}:</span>
                    <span className="font-mono text-slate-800 bg-white px-2 py-1 rounded-md border border-slate-200 break-words leading-relaxed flex-1">
                      {formattedValue}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Garantia de Integridade e Somente Leitura */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-[11px]">
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            <strong>Registro Somente para Leitura:</strong> Este evento foi gravado de forma
            automática em segundo plano com garantia de integridade, assegurando a rastreabilidade
            e a conformidade do sistema PrazoJus.
          </span>
        </div>

        {/* Botão de Fechamento */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition-colors"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </Modal>
  );
};
