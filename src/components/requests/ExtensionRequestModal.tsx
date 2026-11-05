import React, { useState, useRef } from 'react';
import { Modal } from '../layout/Modal';
import { ConfirmDialog } from '../layout/ConfirmDialog';
import { JudicialRequest } from '../../types/request';
import { useRequests } from '../../context/RequestContext';
import {
  ClockAlert,
  Upload,
  FileText,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface ExtensionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: JudicialRequest;
}

export const ExtensionRequestModal: React.FC<ExtensionRequestModalProps> = ({
  isOpen,
  onClose,
  request,
}) => {
  const { addExtensionRequest } = useRequests();

  const [diasSolicitados, setDiasSolicitados] = useState<string>('15');
  const [selectedFile, setSelectedFile] = useState<{
    nome: string;
    tamanho: number;
    conteudoBase64: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasUnsavedChanges = Boolean(
    (diasSolicitados && diasSolicitados !== '15') || selectedFile
  );

  const handleCloseAttempt = () => {
    if (hasUnsavedChanges && !isSubmitting) {
      setIsConfirmDiscardOpen(true);
    } else {
      handleForceClose();
    }
  };

  const handleForceClose = () => {
    setDiasSolicitados('15');
    setSelectedFile(null);
    setErrorMsg(null);
    setIsSubmitting(false);
    setIsConfirmDiscardOpen(false);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMsg('O documento comprobatório deve ser exclusivamente em formato PDF.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('O arquivo PDF excede o limite máximo permitido de 25MB.');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        nome: file.name,
        tamanho: file.size,
        conteudoBase64: reader.result as string,
      });
    };
    reader.onerror = () => {
      setErrorMsg('Falha ao processar o arquivo PDF selecionado.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const diasNum = parseInt(diasSolicitados, 10);
    if (isNaN(diasNum) || diasNum <= 0) {
      setErrorMsg('A quantidade de dias solicitados deve ser um número inteiro maior que zero.');
      return;
    }

    if (!selectedFile) {
      setErrorMsg('É obrigatório anexar o documento comprobatório em PDF da solicitação de dilação.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await addExtensionRequest(request.id, diasNum, selectedFile);
      if (ok) {
        handleForceClose();
      } else {
        setIsSubmitting(false);
      }
    } catch {
      setErrorMsg('Erro inesperado ao registrar o pedido de dilação. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleCloseAttempt}
        title="Registrar Pedido de Dilação de Prazo"
        subtitle={`Processo: ${request.numeroProcesso} — ${request.setorSolicitante}`}
        maxWidth="md"
        hasUnsavedChanges={hasUnsavedChanges}
      >
        <form onSubmit={handleSubmit} className="space-y-5 p-1">
          {/* Mensagem explicativa */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-amber-900 text-xs">
            <ClockAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-950">
                Informação Complementar Forense
              </p>
              <p className="text-amber-800 leading-relaxed">
                O registro da dilação documenta formalmente o pedido nos autos, mas <strong>não altera a data de vencimento processual original</strong> para fins de controle legal e calendário oficial.
              </p>
            </div>
          </div>

          {/* Erro de validação */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Campo 1: Quantidade de dias solicitados */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              Quantidade de Dias Solicitados <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                required
                value={diasSolicitados}
                onChange={(e) => setDiasSolicitados(e.target.value)}
                placeholder="Ex: 15, 30, 45"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#274578] focus:border-[#274578] text-sm text-slate-800 font-semibold"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                dias
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Informe a quantidade de dias adicionais requeridos (deve ser superior a zero).
            </p>
          </div>

          {/* Campo 2: Documento comprobatório em PDF */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              Documento Comprobatório (PDF) <span className="text-red-500">*</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-[#274578] rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-slate-100/60 group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#274578] flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  Clique ou arraste o comprovante em PDF aqui
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Apenas arquivos PDF (máximo 25MB)
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {selectedFile.nome}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {formatFileSize(selectedFile.tamanho)} • Documento PDF Válido
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors shrink-0 ml-2 cursor-pointer"
                  title="Remover arquivo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleCloseAttempt}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#122443] hover:bg-[#274578] rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registrando pedido...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#C5B641]" />
                  <span>Registrar Pedido de Dilação</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Diálogo de confirmação de descarte */}
      <ConfirmDialog
        isOpen={isConfirmDiscardOpen}
        title="Descartar alterações?"
        message="Você preencheu dados da dilação. Se fechar agora, as informações e o arquivo selecionado não serão gravados."
        confirmLabel="Sim, descartar"
        cancelLabel="Continuar editando"
        isDestructive={true}
        onConfirm={handleForceClose}
        onClose={() => setIsConfirmDiscardOpen(false)}
      />
    </>
  );
};
