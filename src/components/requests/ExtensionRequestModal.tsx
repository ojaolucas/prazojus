import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../layout/Modal';
import { JudicialRequest, PedidoDilacao } from '../../types/request';
import { useRequests } from '../../context/RequestContext';
import {
  ClockAlert,
  Upload,
  FileText,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Save,
  FileCheck2,
} from 'lucide-react';

interface ExtensionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: JudicialRequest;
  editingPedido?: PedidoDilacao | null;
}

export const ExtensionRequestModal: React.FC<ExtensionRequestModalProps> = ({
  isOpen,
  onClose,
  request,
  editingPedido,
}) => {
  const { addExtensionRequest, updateExtensionRequest } = useRequests();

  // Não autopreencher dias solicitados na criação
  const [diasSolicitados, setDiasSolicitados] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<{
    nome: string;
    tamanho: number;
    conteudoBase64: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = Boolean(editingPedido);

  // Sincroniza estado ao abrir ou alternar entre criação e edição
  useEffect(() => {
    if (isOpen) {
      if (editingPedido) {
        setDiasSolicitados(editingPedido.diasSolicitados ? editingPedido.diasSolicitados.toString() : '');
        setSelectedFile(null);
      } else {
        setDiasSolicitados('');
        setSelectedFile(null);
      }
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen, editingPedido]);

  const initialDias = editingPedido?.diasSolicitados ? editingPedido.diasSolicitados.toString() : '';
  const hasUnsavedChanges = Boolean(
    isEditing
      ? diasSolicitados !== initialDias || selectedFile
      : diasSolicitados || selectedFile
  );

  const handleClose = () => {
    setDiasSolicitados('');
    setSelectedFile(null);
    setErrorMsg(null);
    setIsSubmitting(false);
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

    let diasNum: number | null = null;
    if (diasSolicitados && diasSolicitados.trim() !== '') {
      const parsed = parseInt(diasSolicitados, 10);
      if (isNaN(parsed) || parsed <= 0) {
        setErrorMsg('Se informada, a quantidade de dias adicionais deve ser um número inteiro maior que zero.');
        return;
      }
      diasNum = parsed;
    }

    if (!isEditing && !selectedFile) {
      setErrorMsg('É obrigatório anexar o documento comprobatório em PDF da solicitação de dilação.');
      return;
    }

    setIsSubmitting(true);
    try {
      let ok = false;
      if (isEditing && editingPedido) {
        ok = await updateExtensionRequest(
          request.id,
          editingPedido.id,
          diasNum,
          selectedFile || undefined
        );
      } else if (selectedFile) {
        ok = await addExtensionRequest(request.id, diasNum, selectedFile);
      }

      if (ok) {
        handleClose();
      } else {
        setIsSubmitting(false);
      }
    } catch {
      setErrorMsg('Erro inesperado ao salvar o pedido de dilação. Tente novamente.');
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Pedido de Dilação de Prazo' : 'Registrar Pedido de Dilação de Prazo'}
      subtitle={`Processo: ${request.numeroProcesso} — ${request.setorSolicitante}`}
      maxWidth="md"
      hasUnsavedChanges={hasUnsavedChanges}
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-1">
        {/* Informativo Forense */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3 text-slate-700 text-xs shadow-2xs font-sans">
          <div className="w-5 h-5 rounded-md bg-[#122443] text-[#C5B641] flex items-center justify-center shrink-0 font-black text-xs shadow-2xs font-mono">
            D
          </div>
          <div className="space-y-1">
            <p className="font-bold text-slate-900">
              Informação Complementar Forense
            </p>
            <p className="text-slate-600 leading-relaxed text-[11.5px]">
              O registro da dilação documenta formalmente o pedido nos autos, mas <strong className="text-slate-800">não altera a data de vencimento processual original</strong> para fins de controle legal e calendário oficial.
            </p>
          </div>
        </div>

        {/* Mensagem de Erro de Validação */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-sans">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Campo 1: Quantidade de dias solicitados (opcional: Se houver) */}
        <div className="font-sans">
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
            Quantidade de Dias Solicitados <span className="text-slate-400 font-semibold normal-case">(se houver)</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              step="1"
              value={diasSolicitados}
              onChange={(e) => setDiasSolicitados(e.target.value)}
              placeholder="Ex: 15, 30, 45 (opcional)"
              className="w-full px-3.5 pr-14 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#274578] focus:border-[#274578] text-sm text-slate-800 font-semibold font-sans placeholder:font-normal [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 font-sans pointer-events-none select-none">
              dias
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-sans">
            Informe a quantidade de dias adicionais requeridos, caso especificado nos autos (deixe em branco se a dilação for a critério do juízo).
          </p>
        </div>

        {/* Campo 2: Documento comprobatório em PDF */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
            Documento Comprobatório (PDF) {!isEditing && <span className="text-red-500">*</span>}
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Se em edição e nenhum novo arquivo foi selecionado, mostra o documento já existente com opção de substituir */}
          {isEditing && !selectedFile && editingPedido && (
            <div className="mb-2 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileCheck2 className="w-4 h-4 text-blue-700 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {editingPedido.documentoNome}
                  </p>
                  <p className="text-[10px] text-slate-500">Documento anexado atualmente</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-medium text-blue-700 hover:text-blue-800 hover:underline shrink-0 ml-2 cursor-pointer"
              >
                Substituir PDF
              </button>
            </div>
          )}

          {!selectedFile ? (
            (!isEditing || selectedFile) && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-[#274578] rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-slate-100/60 group"
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
            )
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
                    {formatFileSize(selectedFile.tamanho)} • Novo documento selecionado
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

        {/* Rodapé de Ações do Modal */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (!selectedFile && !isEditing)}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#122443] hover:bg-[#274578] rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : isEditing ? (
              <>
                <Save className="w-4 h-4 text-[#C5B641]" />
                <span>Salvar Alterações</span>
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
  );
};
