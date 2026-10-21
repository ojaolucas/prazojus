import React, { useRef } from 'react';
import { RequestAttachment } from '../../types/request';
import {
  FileCheck,
  CheckCircle2,
  Upload,
  Eye,
  Trash2,
  FileText,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface ProofAttachmentUploadProps {
  attachment: RequestAttachment | null | undefined;
  onChange: (attachment: RequestAttachment | null) => void;
  onPreview: (attachment: RequestAttachment) => void;
  error?: string;
  readOnly?: boolean;
}

export const ProofAttachmentUpload: React.FC<ProofAttachmentUploadProps> = ({
  attachment,
  onChange,
  onPreview,
  error,
  readOnly = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, warning, info } = useToast();

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFile = (file: File) => {
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
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const proof: RequestAttachment = {
        id: `att-proof-${Date.now()}`,
        nome: file.name,
        tipo: 'comprovacao',
        tamanho: file.size,
        dataUpload: new Date().toISOString(),
        url: dataUrl,
        isComprovacao: true,
      };
      onChange(proof);
      success(
        'Comprovante Anexado',
        `Documento "${file.name}" anexado como comprovação de conclusão.`
      );
    };

    if (file.size <= 4 * 1024 * 1024) {
      reader.readAsDataURL(file);
    } else {
      const proof: RequestAttachment = {
        id: `att-proof-${Date.now()}`,
        nome: file.name,
        tipo: 'comprovacao',
        tamanho: file.size,
        dataUpload: new Date().toISOString(),
        isComprovacao: true,
      };
      onChange(proof);
      success(
        'Comprovante Registrado',
        `Documento "${file.name}" registrado como comprovação de conclusão.`
      );
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddSample = () => {
    const proof: RequestAttachment = {
      id: `att-proof-${Date.now()}`,
      nome: 'Laudo-Pericial-Conclusivo-Assinado-PCAL.pdf',
      tipo: 'comprovacao',
      tamanho: 1450 * 1024,
      dataUpload: new Date().toISOString(),
      isComprovacao: true,
    };
    onChange(proof);
    success(
      'Exemplo Adicionado',
      'Modelo de "Laudo Conclusivo Assinado" anexado como comprovação.'
    );
  };

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all ${
        error
          ? 'bg-red-50/50 border-red-300 ring-2 ring-red-400/20'
          : attachment
          ? 'bg-emerald-50/40 border-emerald-300/80 shadow-2xs'
          : 'bg-emerald-50/20 border-emerald-200'
      }`}
    >
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>Anexo de Comprovação da Conclusão</span>
              <span className="text-red-500 font-black text-sm">*</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                Obrigatório
              </span>
            </label>
            <p className="text-[11px] text-slate-500">
              Anexe o laudo pericial finalizado, ofício de entrega ou certidão de cumprimento em PDF.
            </p>
          </div>
        </div>

        {!readOnly && !attachment && (
          <button
            type="button"
            onClick={handleAddSample}
            className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200 transition-colors flex items-center gap-1 shadow-2xs"
            title="Inserir exemplo de Laudo Conclusivo"
          >
            <Plus className="w-3 h-3" />
            <span>+ Exemplo de Laudo Conclusivo</span>
          </button>
        )}
      </div>

      {/* Arquivo Anexado ou Área de Upload */}
      {attachment ? (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-emerald-300 bg-white shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 flex flex-col items-center justify-center shrink-0">
              <span className="text-[8px] font-black leading-none text-emerald-900">PDF</span>
              <FileCheck className="w-4 h-4 mt-0.5 text-emerald-800" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 truncate" title={attachment.nome}>
                  {attachment.nome}
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Comprovação Válida
                </span>
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                <span>{formatFileSize(attachment.tamanho)}</span>
                <span>•</span>
                <span>Juntado em {new Date(attachment.dataUpload).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onPreview(attachment)}
              className="px-2.5 py-1 rounded-md text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1"
              title="Visualizar documento comprobatório"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Visualizar</span>
            </button>

            {!readOnly && (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  info('Comprovante Removido', 'Você precisará anexar outro PDF para concluir.');
                }}
                className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Remover anexo de comprovação"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : !readOnly ? (
        <div>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
            }}
            className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
              error
                ? 'border-red-400 bg-red-50/40 hover:bg-red-50/70'
                : 'border-emerald-300 hover:border-emerald-400 bg-white hover:bg-emerald-50/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
              }}
            />
            <div className="flex flex-col items-center justify-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-2xs ${
                  error ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                <Upload className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-slate-800">
                <span className="text-emerald-700 hover:underline">Clique para selecionar o PDF de comprovação</span> ou arraste aqui
              </div>
              <p className="text-[10px] text-slate-500">
                Formato obrigatório: <strong>Documento em PDF (.pdf)</strong>
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-700 font-medium mt-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-slate-500 italic p-2 bg-white rounded border border-slate-200">
          Nenhum anexo de comprovação cadastrado.
        </div>
      )}
    </div>
  );
};
