import React, { useState, useRef } from 'react';
import { RequestAttachment, AttachmentType } from '../../types/request';
import {
  FileText,
  Upload,
  Paperclip,
  Trash2,
  Eye,
  Plus,
  Scale,
  Mail,
  FileCheck2,
  File,
  AlertCircle,
  Download,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const ATTACHMENT_TYPE_CONFIG: Record<
  AttachmentType,
  {
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
    border: string;
    badgeStyle: string;
  }
> = {
  oficio: {
    label: 'Ofício de Requisição',
    shortLabel: 'Ofício',
    icon: FileText,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badgeStyle: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  decisao: {
    label: 'Decisão Judicial',
    shortLabel: 'Decisão Judicial',
    icon: Scale,
    color: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badgeStyle: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  email: {
    label: 'E-mail / Comunicação',
    shortLabel: 'E-mail',
    icon: Mail,
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    badgeStyle: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  laudo: {
    label: 'Laudo Pericial',
    shortLabel: 'Laudo',
    icon: FileCheck2,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  outro: {
    label: 'Outro Documento',
    shortLabel: 'Outro',
    icon: File,
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    badgeStyle: 'bg-slate-100 text-slate-800 border-slate-200',
  },
};

interface AttachmentSectionProps {
  attachments: RequestAttachment[];
  onChange?: (attachments: RequestAttachment[]) => void;
  readOnly?: boolean;
  processNumber?: string;
  onPreviewAttachment?: (attachment: RequestAttachment) => void;
}

export const AttachmentSection: React.FC<AttachmentSectionProps> = ({
  attachments,
  onChange,
  readOnly = false,
  processNumber = '0000000-00.2026.8.02.0001',
  onPreviewAttachment,
}) => {
  const { success, warning, info } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<AttachmentType>('oficio');
  const [isDragging, setIsDragging] = useState(false);

  // Formatação de tamanho legível
  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Processar arquivos PDF enviados
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !onChange) return;

    const newAttachments: RequestAttachment[] = [...attachments];
    let addedCount = 0;

    Array.from(fileList).forEach((file) => {
      const isPdf =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      if (!isPdf) {
        warning(
          'Formato Inválido',
          `O arquivo "${file.name}" não é um PDF. Selecione apenas documentos em formato .pdf.`
        );
        return;
      }

      // Detecção inteligente do tipo pelo nome se o usuário não escolheu explicitamente
      let tipoDetectado: AttachmentType = selectedType;
      const lower = file.name.toLowerCase();
      if (lower.includes('oficio') || lower.includes('ofício')) tipoDetectado = 'oficio';
      else if (lower.includes('decis') || lower.includes('mandado') || lower.includes('despacho'))
        tipoDetectado = 'decisao';
      else if (lower.includes('email') || lower.includes('e-mail') || lower.includes('mensagem'))
        tipoDetectado = 'email';
      else if (lower.includes('laudo') || lower.includes('relatorio') || lower.includes('relatório'))
        tipoDetectado = 'laudo';

      // Criação do objeto de anexo
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const attachment: RequestAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          nome: file.name,
          tipo: tipoDetectado,
          tamanho: file.size,
          dataUpload: new Date().toISOString(),
          url: dataUrl,
        };

        newAttachments.push(attachment);
        onChange([...newAttachments]);
        success('PDF Anexado', `Documento "${file.name}" adicionado como ${ATTACHMENT_TYPE_CONFIG[tipoDetectado].shortLabel}.`);
      };

      // Limitar leitura direta a 4MB para preservar localStorage
      if (file.size <= 4 * 1024 * 1024) {
        reader.readAsDataURL(file);
      } else {
        // Arquivo muito grande para localStorage: armazena metadados
        const attachment: RequestAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          nome: file.name,
          tipo: tipoDetectado,
          tamanho: file.size,
          dataUpload: new Date().toISOString(),
        };
        newAttachments.push(attachment);
        onChange([...newAttachments]);
        success('PDF Registrado', `Documento "${file.name}" registrado com sucesso.`);
      }

      addedCount++;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remover anexo
  const handleRemove = (id: string, nome: string) => {
    if (!onChange) return;
    onChange(attachments.filter((a) => a.id !== id));
    info('Anexo Removido', `O documento "${nome}" foi removido.`);
  };

  // Adicionar exemplo simulado para demonstração imediata
  const handleAddSample = (tipo: AttachmentType) => {
    if (!onChange) return;
    const now = new Date();
    const config = ATTACHMENT_TYPE_CONFIG[tipo];
    let sampleName = '';
    let sampleSize = 250000;

    switch (tipo) {
      case 'oficio':
        sampleName = `Oficio-Requisicao-${Math.floor(100 + Math.random() * 900)}-2026.pdf`;
        sampleSize = 340 * 1024;
        break;
      case 'decisao':
        sampleName = `Decisao-Judicial-Determinacao-Prazo.pdf`;
        sampleSize = 520 * 1024;
        break;
      case 'email':
        sampleName = `Comunicacao-Urgente-Vara-Criminal.pdf`;
        sampleSize = 180 * 1024;
        break;
      case 'laudo':
        sampleName = `Laudo-Tecnico-Preliminar-PCAL.pdf`;
        sampleSize = 1250 * 1024;
        break;
      default:
        sampleName = `Documento-Complementar-Autos.pdf`;
        sampleSize = 410 * 1024;
    }

    const sampleAttachment: RequestAttachment = {
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      nome: sampleName,
      tipo,
      tamanho: sampleSize,
      dataUpload: now.toISOString(),
    };

    onChange([...attachments, sampleAttachment]);
    success('Exemplo Adicionado', `Modelo de "${config.label}" anexado aos autos.`);
  };

  return (
    <div className="space-y-3">
      {/* Cabeçalho da Seção de Anexos */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Paperclip className="w-4 h-4 text-blue-600" />
          <span>Anexos e Peças Processuais em PDF (Opcional)</span>
          <span className="text-[11px] font-normal text-slate-500">
            ({attachments.length} {attachments.length === 1 ? 'anexo' : 'anexos'})
          </span>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 hidden sm:inline">Exemplos rápidos:</span>
            <button
              type="button"
              onClick={() => handleAddSample('oficio')}
              className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
              title="Adicionar exemplo de Ofício"
            >
              + Ofício
            </button>
            <button
              type="button"
              onClick={() => handleAddSample('decisao')}
              className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
              title="Adicionar exemplo de Decisão Judicial"
            >
              + Decisão
            </button>
            <button
              type="button"
              onClick={() => handleAddSample('email')}
              className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
              title="Adicionar exemplo de E-mail"
            >
              + E-mail
            </button>
            <button
              type="button"
              onClick={() => handleAddSample('laudo')}
              className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              title="Adicionar exemplo de Laudo"
            >
              + Laudo
            </button>
          </div>
        )}
      </div>

      {!readOnly && (
        <>
          {/* Seletor de Tipo e Área de Upload */}
          <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-slate-600">Tipo de Documento:</span>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'oficio', label: 'Ofício' },
                    { id: 'decisao', label: 'Decisão Judicial' },
                    { id: 'email', label: 'E-mail' },
                    { id: 'laudo', label: 'Laudo' },
                    { id: 'outro', label: 'Outro' },
                  ] as const
                ).map((t) => {
                  const isSelected = selectedType === t.id;
                  const cfg = ATTACHMENT_TYPE_CONFIG[t.id];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedType(t.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                        isSelected
                          ? `${cfg.bg} ${cfg.color} ${cfg.border} ring-2 ring-blue-400/40 font-semibold shadow-2xs`
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drag & Drop Box */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/80 bg-slate-50/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="flex flex-col items-center justify-center gap-1">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shadow-2xs">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-xs font-medium text-slate-700">
                  <span className="text-blue-600 hover:underline">Clique para selecionar o PDF</span> ou arraste e solte aqui
                </div>
                <p className="text-[10px] text-slate-500">
                  Documentos aceitos: <strong>Ofício, Decisão Judicial, E-mail, Laudos</strong> (.pdf)
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Lista de Documentos Anexados */}
      {attachments.length > 0 ? (
        <div className="space-y-1.5">
          {attachments.map((att) => {
            const cfg = ATTACHMENT_TYPE_CONFIG[att.tipo] || ATTACHMENT_TYPE_CONFIG.outro;
            const Icon = cfg.icon;

            return (
              <div
                key={att.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Ícone PDF */}
                  <div className="w-8 h-8 rounded bg-red-100 text-red-700 border border-red-200 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                    <span className="text-[8px] font-black tracking-tight leading-none text-red-800">
                      PDF
                    </span>
                    <Icon className="w-3.5 h-3.5 mt-0.5 text-red-700" />
                  </div>

                  {/* Informações do Arquivo */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800 truncate" title={att.nome}>
                        {att.nome}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-medium border shrink-0 ${cfg.badgeStyle}`}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{formatFileSize(att.tamanho)}</span>
                      <span>•</span>
                      <span>
                        Anexado em {new Date(att.dataUpload).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 shrink-0">
                  {onPreviewAttachment && (
                    <button
                      type="button"
                      onClick={() => onPreviewAttachment(att)}
                      className="p-1.5 rounded-md text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                      title="Visualizar documento PDF"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}

                  {!readOnly && onChange && (
                    <button
                      type="button"
                      onClick={() => handleRemove(att.id, att.nome)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Remover anexo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : readOnly ? (
        <div className="text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs text-slate-500">
          Nenhum documento PDF anexado a esta requisição.
        </div>
      ) : null}
    </div>
  );
};
