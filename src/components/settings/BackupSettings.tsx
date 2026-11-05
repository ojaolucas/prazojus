import React, { useState, useRef, useEffect } from 'react';
import { useRequests } from '../../context/RequestContext';
import { useAuth } from '../../context/AuthContext';
import { StorageService, BackupPayload } from '../../services/storageService';
import { ReportService } from '../../services/reportService';
import { AuditService } from '../../services/auditService';
import { ApiService } from '../../services/apiService';
import { ConfirmDialog } from '../layout/ConfirmDialog';
import {
  Database,
  FileSpreadsheet,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Users,
  FileText,
  Clock,
  Server,
  RefreshCw,
  HardDrive,
  Lock,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const BackupSettings: React.FC = () => {
  const { requests, importBackup } = useRequests();
  const { users, currentUser } = useAuth();
  const { success, error, info } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDbOnline, setIsDbOnline] = useState<boolean>(true);
  const [totalAuditoria, setTotalAuditoria] = useState<number>(0);
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);

  const [pendingBackup, setPendingBackup] = useState<BackupPayload | null>(null);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');

  // Checagem de integridade e contadores do PostgreSQL
  const checkDatabaseStatus = async () => {
    setIsCheckingHealth(true);
    try {
      const ok = await ApiService.checkHealth();
      setIsDbOnline(ok);

      const logs = await ApiService.getAuditLogs();
      if (logs && Array.isArray(logs)) {
        setTotalAuditoria(logs.length);
      } else {
        setTotalAuditoria(StorageService.getAuditLogs().length);
      }
    } catch {
      setIsDbOnline(false);
      setTotalAuditoria(StorageService.getAuditLogs().length);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  // 1. Exportação para Planilha Excel / CSV
  const handleExportSpreadsheet = () => {
    try {
      ReportService.exportToCSV(requests, {
        filters: {
          busca: '',
          setor: 'todos',
          tipoExame: 'todos',
          origem: 'todas',
          status: 'todos',
          prioridade: 'todas',
        },
        totalFiltered: requests.length,
        totalAll: requests.length,
        currentUser,
      });

      AuditService.log({
        usuario: currentUser,
        modulo: 'requisicoes',
        acao: 'backup',
        descricao: `Exportação de planilha geral com ${requests.length} requisições periciais realizada pelo Administrador.`,
        status: 'sucesso',
      });

      success(
        'Planilha Exportada com Sucesso',
        `Arquivo CSV gerado com ${requests.length} requisições. Pronto para abrir no Microsoft Excel ou Google Planilhas.`
      );
    } catch {
      error('Erro na Exportação', 'Não foi possível gerar a planilha no momento.');
    }
  };

  // 2. Exportação de Cópia de Segurança Estrutural (JSON)
  const handleExportJsonBackup = () => {
    try {
      const auditData = StorageService.getAuditLogs();
      const backupData: BackupPayload = {
        version: '5.0',
        exportedAt: new Date().toISOString(),
        source: 'PrazoJus — Polícia Científica de Alagoas (POLCAL)',
        requests,
        users: users.map((u) => ({ ...u, senha: '' })), // não exporta senhas
        auditLogs: auditData,
      };

      const jsonBlob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(jsonBlob);
      const link = document.createElement('a');
      const nowStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.href = url;
      link.download = `prazojus_backup_polcal_${nowStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      AuditService.log({
        usuario: currentUser,
        modulo: 'sistema',
        acao: 'backup',
        descricao: `Cópia de segurança oficial estrutural (JSON) gerada com sucesso pelo Administrador.`,
        status: 'sucesso',
      });

      success(
        'Backup Oficial Salvo',
        'Arquivo JSON de cópia estrutural baixado com sucesso. Guarde-o em local seguro.'
      );
    } catch {
      error('Erro ao Gerar Backup', 'Falha ao empacotar os dados do sistema.');
    }
  };

  // 3. Upload e Validação de Cópia de Segurança
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = StorageService.validateBackupFile(content);

      if (!validation.valid || !validation.data) {
        error('Arquivo Inválido', validation.error || 'Estrutura de arquivo JSON não reconhecida.');
        return;
      }

      setPendingBackup(validation.data);
      setIsImportConfirmOpen(true);
    };

    reader.onerror = () => {
      error('Falha de Leitura', 'Não foi possível carregar o arquivo selecionado.');
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!pendingBackup) return;

    importBackup(pendingBackup, importMode);

    AuditService.log({
      usuario: currentUser,
      modulo: 'sistema',
      acao: 'backup',
      descricao: `Restauração de cópia de segurança realizada pelo Administrador (${pendingBackup.requests.length} requisições).`,
      status: 'sucesso',
    });

    setPendingBackup(null);
    setIsImportConfirmOpen(false);
    success('Restauração Concluída', 'Os dados da cópia de segurança foram aplicados com sucesso.');
  };

  // Trava de segurança: apenas Administradores têm permissão
  if (currentUser.role !== 'Administrador') {
    return (
      <div className="p-8 text-center max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <Lock className="w-10 h-10 text-rose-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Acesso Restrito ao Administrador</h2>
        <p className="text-xs text-slate-500">
          O módulo de infraestrutura, banco de dados e cópias de segurança é exclusivo para administradores da POLCAL.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Cabeçalho Oficial */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#122443] text-[#C5B641] flex items-center justify-center shrink-0 shadow-xs">
            <Database className="w-6 h-6 text-[#C5B641]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Banco de Dados e Cópia de Segurança
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitoramento da base de dados, exportação para planilhas e cópias de segurança estruturais
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={checkDatabaseStatus}
          disabled={isCheckingHealth}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          title="Verificar integridade e conexão"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isCheckingHealth ? 'animate-spin' : ''}`} />
          <span>Verificar Conexão</span>
        </button>
      </div>

      {/* Painel de Status e Métricas do Banco de Dados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status da Conexão */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Conexão com Banco
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  isDbOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-sm font-extrabold text-slate-800">
                {isDbOnline ? 'PostgreSQL Ativo' : 'Armazenamento Local'}
              </span>
            </div>
          </div>
          <Server className="w-7 h-7 text-slate-300 shrink-0" />
        </div>

        {/* Total de Processos */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Processos Cadastrados
            </span>
            <span className="text-xl font-extrabold text-[#122443] mt-1 block">
              {requests.length}
            </span>
          </div>
          <FileText className="w-7 h-7 text-blue-200 shrink-0" />
        </div>

        {/* Usuários Cadastrados */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Usuários Cadastrados
            </span>
            <span className="text-xl font-extrabold text-[#122443] mt-1 block">
              {users.length}
            </span>
          </div>
          <Users className="w-7 h-7 text-emerald-200 shrink-0" />
        </div>

        {/* Auditoria & Logs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Registros de Auditoria
            </span>
            <span className="text-xl font-extrabold text-[#122443] mt-1 block">
              {totalAuditoria}
            </span>
          </div>
          <ShieldCheck className="w-7 h-7 text-amber-200 shrink-0" />
        </div>
      </div>

      {/* Grid de Opções de Exportação e Restauração */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Opção 1: Planilha de Trabalho (Excel / CSV) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Planilha de Dados (Excel / CSV)
                </h3>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                  Fácil Acesso • Pronto para Abrir e Editar
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Exporta todas as <strong>{requests.length} requisições periciais</strong> em formato{' '}
              <code className="text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded font-mono font-bold">.csv</code>{' '}
              configurado com delimitador ponto e vírgula e codificação brasileira (UTF-8 BOM).
              Abre diretamente com dois cliques no <strong>Microsoft Excel</strong>, <strong>Google Planilhas</strong> ou LibreOffice.
            </p>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block">Colunas incluídas:</span>
              <p className="leading-relaxed">
                Nº Processo, Protocolo, REP, Setor, Exame, Origem, Partes, Prazo Limite, Status Operacional, Perito Responsável e Dilações.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleExportSpreadsheet}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Baixar Planilha Excel (CSV)</span>
            </button>
          </div>
        </div>

        {/* Opção 2: Cópia de Segurança Estrutural (JSON) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Cópia de Segurança Estrutural (JSON)
                </h3>
                <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                  Backup Completo • Interoperabilidade
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Gera um snapshot estruturado contendo a integridade total do banco: todas as requisições,
              histórico de dilações, cadastro de usuários, lotações de setores e logs de auditoria.
              Ideal para salvaguarda técnica, migração entre ambientes e consumo por APIs.
            </p>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block">Finalidade:</span>
              <p className="leading-relaxed">
                Salvaguarda institucional periódica e restauração completa em caso de recuperação de desastres.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleExportJsonBackup}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-[#122443] hover:bg-[#274578] rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#C5B641]" />
              <span>Baixar Backup Completo (JSON)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Opção 3: Restauração de Cópia de Segurança pelo Painel */}
      <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-slate-700 border border-slate-300 flex items-center justify-center shrink-0 shadow-2xs">
              <Upload className="w-5 h-5 text-slate-700" />
            </div>
            <div className="space-y-1 max-w-xl">
              <h3 className="text-sm font-bold text-slate-900">
                Restaurar Cópia de Segurança Oficial
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Carregue um arquivo <code className="font-mono text-slate-800 bg-white px-1 py-0.5 rounded border border-slate-200">.json</code> gerado previamente pelo PrazoJus para restaurar os registros.
                O sistema valida as assinaturas de integridade e a consistência dos dados antes de qualquer aplicação.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              <span>Selecionar Arquivo para Restaurar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação Segura de Importação */}
      {isImportConfirmOpen && pendingBackup && (
        <ConfirmDialog
          isOpen={isImportConfirmOpen}
          onClose={() => {
            setIsImportConfirmOpen(false);
            setPendingBackup(null);
          }}
          onConfirm={handleConfirmImport}
          title="Confirmar Restauração de Dados"
          message={`O arquivo validado contém ${pendingBackup.requests.length} requisições periciais geradas em ${new Date(pendingBackup.exportedAt).toLocaleDateString('pt-BR')}. Deseja prosseguir com a restauração desses dados no sistema?`}
          confirmLabel="Sim, Restaurar Dados"
        />
      )}
    </div>
  );
};
export default BackupSettings;
