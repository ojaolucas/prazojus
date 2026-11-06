import React, { useState, useRef } from 'react';
import { RequestAttachment, AttachmentType } from '../../types/request';
import {
  FileCheck,
  CheckCircle2,
  Upload,
  Eye,
  Trash2,
  FileText,
  AlertTriangle,
  Send,
  File,
  Paperclip,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export type ProofDocType = 'laudo' | 'comprovante_envio' | 'outro';

export const PROOF_TYPE_CONFIG: Record<
  ProofDocType,
  {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
    border: string;
    badgeStyle: string;
  }
> = {
  laudo: {
    label: 'Laudo Pericial',
    description: 'Laudo pericial finalizado e assinado',
    icon: FileCheck,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    badgeStyle: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  comprovante_envio: {
    label: 'Comprovante de Envio',
    description: 'Ofício de entrega, protocolo ou e-mail de envio',
    icon: Send,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    badgeStyle: 'bg-blue-100 text-blue-900 border-blue-300',
  },
  outro: {
    label: 'Outro',
    description: 'Certidão de cumprimento ou peça complementar',
    icon: File,
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    badgeStyle: 'bg-slate-100 text-slate-800 border-slate-300',
  },
};

interface ProofAttachmentUploadProps {
  attachment?: RequestAttachment | null;
  attachments?: RequestAttachment[];
  onChange?: (attachment: RequestAttachment | null) => void;
  onAttachmentsChange?: (attachments: RequestAttachment[]) => void;
  onPreview: (attachment: RequestAttachment) => void;
  error?: string;
  readOnly?: boolean;
}

export const ProofAttachmentUpload: React.FC<ProofAttachmentUploadProps> = ({
  attachment,
  attachments,
  onChange,
  onAttachmentsChange,
  onPreview,
  error,
  readOnly = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, warning, info } = useToast();
  const [selectedType, setSelectedType] = useState<ProofDocType>('laudo');
  const [isDragging, setIsDragging] = useState(false);

  // Lista normalizada de anexos de comprovação
  const currentList: RequestAttachment[] =
    attachments && attachments.length > 0
      ? attachments
      : attachment
      ? [attachment]
      : [];

  const notifyChange = (newList: RequestAttachment[]) => {
    if (onAttachmentsChange) {
      onAttachmentsChange(newList);
    }
    if (onChange) {
      onChange(newList.length > 0 ? newList[0] : null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || readOnly) return;

    const newAttachments: RequestAttachment[] = [...currentList];
    let addedCount = 0;

    Array.from(fileList).forEach((file) => {
      const isPdf =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      if (!isPdf) {
        warning(
          'Arquivo Inválido',
          `O arquivo "${file.name}" não é um documento PDF. O anexo de comprovação deve ser um arquivo .pdf.`
        );
        return;
      }

      const reader = new FileReader();
      const attId = `att-proof-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const proof: RequestAttachment = {
          id: attId,
          nome: file.name,
          tipo: selectedType as AttachmentType,
          tamanho: file.size,
          dataUpload: new Date().toISOString(),
          url: dataUrl,
          isComprovacao: true,
        };
        newAttachments.push(proof);
        notifyChange([...newAttachments]);
        success(
          'Documento Anexado',
          `"${file.name}" anexado como ${PROOF_TYPE_CONFIG[selectedType].label}.`
        );
      };

      if (file.size <= 4 * 1024 * 1024) {
        reader.readAsDataURL(file);
      } else {
        const proof: RequestAttachment = {
          id: attId,
          nome: file.name,
          tipo: selectedType as AttachmentType,
          tamanho: file.size,
          dataUpload: new Date().toISOString(),
          isComprovacao: true,
        };
        newAttachments.push(proof);
        notifyChange([...newAttachments]);
        success(
          'Documento Registrado',
          `"${file.name}" registrado como ${PROOF_TYPE_CONFIG[selectedType].label}.`
        );
      }

      addedCount++;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (id: string, nome: string) => {
    if (readOnly) return;
    const next = currentList.filter((item) => item.id !== id);
    notifyChange(next);
    info('Documento Removido', `O documento "${nome}" foi removido da comprovação.`);
  };

  const handleTypeChange = (id: string, newType: ProofDocType) => {
    if (readOnly) return;
    const next = currentList.map((item) =>
      item.id === id ? { ...item, tipo: newType as AttachmentType } : item
    );
    notifyChange(next);
    success(
      'Classificação Atualizada',
      `Documento reclassificado como "${PROOF_TYPE_CONFIG[newType].label}".`
    );
  };

  const getDocConfig = (type: AttachmentType | undefined) => {
    if (type === 'laudo') return PROOF_TYPE_CONFIG.laudo;
    if (type === 'comprovante_envio' || type === 'comprovacao') return PROOF_TYPE_CONFIG.comprovante_envio;
    return PROOF_TYPE_CONFIG.outro;
  };

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all ${
        error
          ? 'bg-red-50/30 border-red-300 ring-2 ring-red-400/20'
          : 'bg-white border-slate-200/90 shadow-2xs'
      }`}
    >
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <CheckCircle2 className="w-4 h-4 text-[#274578]" />
          <span>Documentos de Comprovação da Conclusão</span>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            {readOnly ? 'COMPROVAÇÃO' : 'OBRIGATÓRIO'}
          </span>
          <span className="text-[11px] font-normal text-slate-500 ml-1">
            ({currentList.length} {currentList.length === 1 ? 'documento anexado' : 'documentos anexados'})
          </span>
        </div>
      </div>
      <p className="text-[11px] text-slate-500 mb-3 font-normal">
        {readOnly
          ? 'Laudo pericial finalizado e comprovantes de entrega registrados nos autos'
          : 'Anexe o laudo pericial finalizado e/ou comprovante de envio em formato PDF'}
      </p>

      {/* Seletor de Categoria Ativa antes do Upload */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[11px] font-semibold text-slate-600">Tipo de Documento:</span>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'laudo', label: 'Laudo Pericial' },
                { id: 'comprovante_envio', label: 'Comprovante de Envio' },
                { id: 'outro', label: 'Outro Documento' },
              ] as const
            ).map((t) => {
              const cfg = PROOF_TYPE_CONFIG[t.id];
              const Icon = cfg.icon;
              const isSelected = selectedType === t.id;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                    isSelected
                      ? 'bg-[#122443] text-white border border-[#122443] font-bold shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 font-medium'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#C5B641]' : 'text-slate-400'}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Área de Upload (Drag and Drop / Clique) */}
      {!readOnly && (
        <div className="mb-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
              error && currentList.length === 0
                ? 'border-red-400 bg-red-50/40 hover:bg-red-50/70'
                : isDragging
                ? 'border-[#274578] bg-blue-50/60 scale-[0.99]'
                : 'border-slate-300 hover:border-[#274578] bg-slate-50/50 hover:bg-blue-50/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
              }}
            />
            <div className="flex flex-col items-center justify-center gap-1.5">
              <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#274578] shadow-2xs">
                <Upload className="w-4 h-4 text-[#274578]" />
              </div>
              <div className="text-xs font-semibold text-slate-800">
                <span className="text-[#274578] font-bold hover:underline">
                  {currentList.length > 0
                    ? `Clique para adicionar mais arquivos como ${PROOF_TYPE_CONFIG[selectedType].label}`
                    : `Clique para selecionar o PDF de comprovação (${PROOF_TYPE_CONFIG[selectedType].label})`}
                </span>{' '}
                ou arraste e solte aqui
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Classificação: <strong className="text-slate-700">{PROOF_TYPE_CONFIG[selectedType].label}</strong> • Formato PDF (Máx. 50MB)
              </p>
            </div>
          </div>

          {error && currentList.length === 0 && (
            <div className="flex items-center gap-1.5 text-xs text-red-700 font-medium mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Lista de Documentos Comprobatórios Anexados */}
      {currentList.length > 0 && (
        <div className="space-y-1.5">
          {currentList.map((doc) => {
            const cfg = getDocConfig(doc.tipo);
            const Icon = cfg.icon;

            return (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-700 border border-red-200/80 flex flex-col items-center justify-center shrink-0 shadow-2xs"
                  >
                    <span className="text-[8px] font-black tracking-tight leading-none text-red-700">PDF</span>
                    <Icon className="w-3.5 h-3.5 mt-0.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-800 truncate" title={doc.nome}>
                        {doc.nome}
                      </span>

                      {/* Tag do Tipo com Seletor Rápido se não for readOnly */}
                      {!readOnly ? (
                        <select
                          value={doc.tipo === 'comprovacao' ? 'comprovante_envio' : doc.tipo}
                          onChange={(e) =>
                            handleTypeChange(doc.id, e.target.value as ProofDocType)
                          }
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border cursor-pointer ${cfg.badgeStyle}`}
                          title="Clique para alterar a classificação do documento"
                        >
                          <option value="laudo">Laudo Pericial</option>
                          <option value="comprovante_envio">Comprovante de Envio</option>
                          <option value="outro">Outro Documento</option>
                        </select>
                      ) : (
                        <span
                          className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border ${cfg.badgeStyle}`}
                        >
                          {cfg.label}
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="font-medium">{formatFileSize(doc.tamanho)}</span>
                      <span>•</span>
                      <span>
                        Juntado em {new Date(doc.dataUpload).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPreview(doc)}
                    className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                    title="Visualizar documento comprobatório"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visualizar</span>
                  </button>

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemove(doc.id, doc.nome)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Remover este documento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {readOnly && currentList.length === 0 && (
        <div className="text-xs text-slate-500 italic p-2 bg-white rounded border border-slate-200">
          Nenhum anexo de comprovação cadastrado.
        </div>
      )}
    </div>
  );
};
