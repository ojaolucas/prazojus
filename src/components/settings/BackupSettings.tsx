import React, { useState, useRef } from 'react';
import { useRequests } from '../../context/RequestContext';
import { useAuth } from '../../context/AuthContext';
import { StorageService, BackupPayload } from '../../services/storageService';
import { ConfirmDialog } from '../layout/ConfirmDialog';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  FileText,
  ShieldAlert,
  HardDrive,
  Info,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const BackupSettings: React.FC = () => {
  const { exportBackup, importBackup, resetDemoData, requests } = useRequests();
  const { can, currentRole } = useAuth();
  const { error } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [pendingBackup, setPendingBackup] = useState<BackupPayload | null>(null);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Calcula tamanho aproximado do LocalStorage
  const getStorageSizeEstimate = () => {
    let total = 0;
    for (let x in localStorage) {
      if (localStorage.hasOwnProperty(x)) {
        total += (localStorage[x].length + x.length) * 2;
      }
    }
    return (total / 1024).toFixed(1); // em KB
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidationError(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = StorageService.validateBackupFile(content);

      if (!validation.valid || !validation.data) {
        setValidationError(validation.error || 'Arquivo de backup inválido.');
        error('Arquivo Inválido', validation.error);
        return;
      }

      setPendingBackup(validation.data);
      setIsImportConfirmOpen(true);
    };

    reader.onerror = () => {
      setValidationError('Falha ao ler o arquivo selecionado.');
    };

    reader.readAsText(file);
    // Limpa input para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!pendingBackup) return;
    importBackup(pendingBackup, importMode);
    setPendingBackup(null);
    setIsImportConfirmOpen(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-700" />
            Armazenamento Local e Cópia de Segurança
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerenciamento de persistência no navegador, exportação JSON e recuperação de desastres
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <HardDrive className="w-4 h-4 text-slate-500" />
          <span>Uso Local: <strong>~{getStorageSizeEstimate()} KB</strong></span>
        </div>
      </div>

      {/* Grid de Operações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Box 1: Exportar Backup */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Exportar Backup Completo</h3>
                <span className="text-xs text-slate-500">Formato aberto JSON</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              Gera um arquivo <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">.json</code> contendo todas as {requests.length} requisições periciais, históricos de alteração e preferências de usuário.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={exportBackup}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors"
            >
              <Download className="w-4 h-4" />
              Baixar Arquivo de Backup JSON
            </button>
          </div>
        </div>

        {/* Box 2: Importar Backup */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Restaurar / Importar Backup</h3>
                <span className="text-xs text-slate-500">Validação e merge</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              Carregue um arquivo JSON gerado previamente pelo sistema. A integridade estrutural e os campos obrigatórios serão validados antes de qualquer gravação.
            </p>

            {!can('canImportBackup') && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-lg mt-2">
                * Importação restrita ao perfil <strong>Administrador</strong>.
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              disabled={!can('canImportBackup')}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold rounded-lg shadow-2xs transition-colors ${
                can('canImportBackup')
                  ? 'text-white bg-blue-700 hover:bg-blue-800'
                  : 'text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <Upload className="w-4 h-4" />
              Selecionar Arquivo JSON para Restaurar
            </button>
          </div>
        </div>
      </div>

      {/* Box 3: Restaurar Dados Padrão de Demonstração */}
      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Restaurar Dados Padrão de Demonstração
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                Restaura a base local para os exemplos fictícios iniciais (casos em andamento, vencidos, urgentes e concluídos). Todas as requisições criadas nesta sessão serão substituídas pelos dados de teste.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={!can('canResetDemoData')}
            onClick={() => setIsResetConfirmOpen(true)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors shrink-0 ${
              can('canResetDemoData')
                ? 'text-rose-700 bg-white border-rose-300 hover:bg-rose-50 shadow-2xs'
                : 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed opacity-60'
            }`}
          >
            Restaurar Base Demo
          </button>
        </div>
      </div>

      {/* Confirmação de Restauração de Demonstração */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={resetDemoData}
        title="Restaurar Base de Demonstração"
        message="Atenção: Esta ação substituirá os registros atuais no LocalStorage pelos dados fictícios de demonstração padrão. Deseja prosseguir?"
        confirmLabel="Sim, Restaurar Demonstração"
        isDestructive
      />

      {/* Modal de Confirmação de Importação de Backup */}
      {isImportConfirmOpen && pendingBackup && (
        <ConfirmDialog
          isOpen={isImportConfirmOpen}
          onClose={() => {
            setIsImportConfirmOpen(false);
            setPendingBackup(null);
          }}
          onConfirm={handleConfirmImport}
          title="Confirmar Importação de Backup"
          message={`O arquivo validado contém ${pendingBackup.requests.length} requisições exportadas em ${new Date(pendingBackup.exportedAt).toLocaleDateString('pt-BR')}. Escolha no botão abaixo se deseja substituir todos os registros ou mesclar com os existentes.`}
          confirmLabel={`Confirmar (${importMode === 'replace' ? 'Substituição Total' : 'Mesclagem'})`}
        />
      )}
    </div>
  );
};
