import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  JudicialRequest,
  RequestStatus,
  RequestFilters,
  PriorityLevel,
} from '../types/request';
import { AppNotification } from '../types/notification';
import { StorageService, BackupPayload } from '../services/storageService';
import { syncRequestStatus, calculatePriority } from '../services/deadlineService';
import { generateNotificationsFromRequests } from '../services/notificationService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface RequestContextType {
  requests: JudicialRequest[];
  filters: RequestFilters;
  setFilters: React.Dispatch<React.SetStateAction<RequestFilters>>;
  resetFilters: () => void;
  filteredRequests: JudicialRequest[];
  selectedRequest: JudicialRequest | null;
  setSelectedRequest: (req: JudicialRequest | null) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  editingRequest: JudicialRequest | null;
  setEditingRequest: (req: JudicialRequest | null) => void;
  addRequest: (data: {
    numeroProcesso: string;
    descricao: string;
    setorSolicitante: string;
    prazoJudicial: string;
    tipoExame: string;
    vestigio?: string;
    acusadoVitima?: string;
    protocolo?: string;
    rep?: string;
    origem?: string;
    referencias?: string;
    prioridadeManual?: PriorityLevel | null;
    status?: RequestStatus;
    temPrazoJudicial?: boolean;
    tipoPrazo?: 'judicial' | 'interno';
    motivoPrazoInterno?: string;
  }) => boolean;
  updateRequest: (
    id: string,
    data: Partial<JudicialRequest>,
    motivoAlteracao?: string
  ) => boolean;
  deleteRequest: (id: string) => boolean;
  changeStatus: (
    id: string,
    novoStatus: RequestStatus,
    motivo?: string
  ) => boolean;
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  resetDemoData: () => boolean;
  exportBackup: () => void;
  importBackup: (
    payload: BackupPayload,
    mode: 'replace' | 'merge'
  ) => { success: boolean; message: string };
}

const DEFAULT_FILTERS: RequestFilters = {
  busca: '',
  setor: '',
  tipoExame: '',
  origem: '',
  status: '',
  prioridade: '',
  tipoPrazo: '',
};

const RequestContext = createContext<RequestContextType | undefined>(undefined);

export const RequestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, can } = useAuth();
  const { success, warning, error, info } = useToast();

  const [requests, setRequests] = useState<JudicialRequest[]>(() => {
    StorageService.initialize();
    return StorageService.getRequests();
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    StorageService.getNotifications()
  );

  const [filters, setFilters] = useState<RequestFilters>(DEFAULT_FILTERS);
  const [selectedRequest, setSelectedRequest] = useState<JudicialRequest | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingRequest, setEditingRequest] = useState<JudicialRequest | null>(null);

  // Recalcula notificações sempre que a lista de requisições é atualizada
  const refreshNotifications = useCallback(
    (currentRequests: JudicialRequest[]) => {
      const existing = StorageService.getNotifications();
      const updated = generateNotificationsFromRequests(currentRequests, existing);
      setNotifications(updated);
      StorageService.saveNotifications(updated);
    },
    []
  );

  // Inicialização de notificações
  useEffect(() => {
    refreshNotifications(requests);
  }, []); // Run on mount

  // Salva requisições e recalcula notificações
  const commitRequests = (updated: JudicialRequest[]) => {
    setRequests(updated);
    StorageService.saveRequests(updated);
    refreshNotifications(updated);

    // Se a requisição selecionada estiver aberta, atualiza a referência
    if (selectedRequest) {
      const match = updated.find((r) => r.id === selectedRequest.id);
      setSelectedRequest(match || null);
    }
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  // Adicionar nova requisição
  const addRequest = (data: {
    numeroProcesso: string;
    descricao: string;
    setorSolicitante: string;
    prazoJudicial: string;
    tipoExame: string;
    vestigio?: string;
    acusadoVitima?: string;
    protocolo?: string;
    rep?: string;
    origem?: string;
    referencias?: string;
    prioridadeManual?: PriorityLevel | null;
    status?: RequestStatus;
    temPrazoJudicial?: boolean;
    tipoPrazo?: 'judicial' | 'interno';
    motivoPrazoInterno?: string;
  }): boolean => {
    if (!can('canCreateRequest')) {
      error('Ação Não Permitida', 'Seu perfil não possui permissão para cadastrar requisições.');
      return false;
    }

    const nowIso = new Date().toISOString();
    const initialStatus = data.status || 'Pendente';
    const temPrazo = data.temPrazoJudicial !== undefined ? data.temPrazoJudicial : true;
    const tipo = data.tipoPrazo || (temPrazo ? 'judicial' : 'interno');

    let newReq: JudicialRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      numeroProcesso: data.numeroProcesso.trim(),
      descricao: data.descricao.trim(),
      setorSolicitante: data.setorSolicitante,
      prazoJudicial: data.prazoJudicial,
      tipoExame: data.tipoExame,
      vestigio: data.vestigio?.trim() || undefined,
      acusadoVitima: data.acusadoVitima?.trim() || undefined,
      protocolo: data.protocolo?.trim() || undefined,
      rep: data.rep?.trim() || undefined,
      origem: data.origem || undefined,
      referencias: data.referencias?.trim() || undefined,
      prioridadeManual: data.prioridadeManual || null,
      status: initialStatus,
      temPrazoJudicial: temPrazo,
      tipoPrazo: tipo,
      motivoPrazoInterno: data.motivoPrazoInterno?.trim() || undefined,
      criadoEm: nowIso,
      atualizadoEm: nowIso,
      criadoPor: currentUser.nome,
      historico: [
        {
          de: 'Pendente',
          para: initialStatus,
          data: nowIso,
          usuario: currentUser.nome,
          motivo: 'Cadastro inicial da requisição no sistema',
        },
      ],
    };

    // Valida se já nasce vencida
    newReq = syncRequestStatus(newReq);

    const updated = [newReq, ...requests];
    commitRequests(updated);
    success(
      'Requisição Cadastrada',
      `Processo ${newReq.numeroProcesso} protocolado com sucesso.`
    );
    return true;
  };

  // Atualizar requisição
  const updateRequest = (
    id: string,
    data: Partial<JudicialRequest>,
    motivoAlteracao?: string
  ): boolean => {
    if (!can('canEditRequest')) {
      error('Ação Não Permitida', 'Seu perfil não possui permissão para editar requisições.');
      return false;
    }

    const target = requests.find((r) => r.id === id);
    if (!target) return false;

    const nowIso = new Date().toISOString();
    let updatedReq: JudicialRequest = {
      ...target,
      ...data,
      atualizadoEm: nowIso,
    };

    // Se houve mudança de status, adiciona ao histórico
    if (data.status && data.status !== target.status) {
      updatedReq.historico = [
        ...(target.historico || []),
        {
          de: target.status,
          para: data.status,
          data: nowIso,
          usuario: currentUser.nome,
          motivo: motivoAlteracao || 'Atualização cadastral',
        },
      ];
    }

    // Sincroniza status de vencimento se o prazo foi alterado
    updatedReq = syncRequestStatus(updatedReq);

    const updatedList = requests.map((r) => (r.id === id ? updatedReq : r));
    commitRequests(updatedList);
    success('Requisição Atualizada', `Dados do processo ${target.numeroProcesso} salvos.`);
    return true;
  };

  // Alterar status diretamente com permissões checadas
  const changeStatus = (
    id: string,
    novoStatus: RequestStatus,
    motivo?: string
  ): boolean => {
    const target = requests.find((r) => r.id === id);
    if (!target) return false;

    if (novoStatus === 'Concluído' && !can('canConcludeRequest')) {
      error(
        'Acesso Restrito',
        'Apenas Supervisores e Administradores podem homologar e concluir requisições judiciais.'
      );
      return false;
    }

    if (novoStatus === 'Cancelado' && !can('canCancelRequest')) {
      error(
        'Acesso Restrito',
        'Apenas Supervisores e Administradores podem cancelar requisições.'
      );
      return false;
    }

    return updateRequest(id, { status: novoStatus }, motivo);
  };

  // Excluir requisição com checagem de permissão
  const deleteRequest = (id: string): boolean => {
    if (!can('canDeleteRequest')) {
      error(
        'Ação Bloqueada',
        'Seu perfil (Operador) não possui autorização para excluir requisições. Solicite ao Supervisor ou Administrador.'
      );
      return false;
    }

    const target = requests.find((r) => r.id === id);
    const updatedList = requests.filter((r) => r.id !== id);
    commitRequests(updatedList);

    // Remove também notificações vinculadas a esta requisição
    const cleanedNotifs = notifications.filter((n) => n.requisicaoId !== id);
    setNotifications(cleanedNotifs);
    StorageService.saveNotifications(cleanedNotifs);

    if (selectedRequest?.id === id) {
      setSelectedRequest(null);
    }

    warning(
      'Requisição Excluída',
      `O processo ${target?.numeroProcesso || id} foi removido do sistema.`
    );
    return true;
  };

  // Notificações
  const markNotificationAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, lida: true } : n));
    setNotifications(updated);
    StorageService.saveNotifications(updated);
  };

  const markAllNotificationsAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, lida: true }));
    setNotifications(updated);
    StorageService.saveNotifications(updated);
    info('Notificações', 'Todas as notificações foram marcadas como lidas.');
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    StorageService.saveNotifications(updated);
  };

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.lida).length,
    [notifications]
  );

  // Backup e Restauração
  const resetDemoData = (): boolean => {
    if (!can('canResetDemoData')) {
      error(
        'Ação Bloqueada',
        'Apenas o Administrador pode redefinir a base para dados de demonstração.'
      );
      return false;
    }

    const ok = StorageService.resetToDemo();
    if (ok) {
      const reloaded = StorageService.getRequests();
      setRequests(reloaded);
      refreshNotifications(reloaded);
      setSelectedRequest(null);
      success(
        'Dados Restaurados',
        'A base foi reiniciada com sucesso com os exemplos padrão de demonstração.'
      );
      return true;
    }
    return false;
  };

  const exportBackup = () => {
    if (!can('canExportBackup')) {
      error('Ação Bloqueada', 'Seu perfil não tem permissão para exportar dados.');
      return;
    }
    StorageService.exportBackup();
    success('Backup Exportado', 'Arquivo JSON de segurança gerado com sucesso.');
  };

  const importBackup = (
    payload: BackupPayload,
    mode: 'replace' | 'merge'
  ): { success: boolean; message: string } => {
    if (!can('canImportBackup')) {
      const msg = 'Apenas o Administrador possui permissão para importar arquivos de backup.';
      error('Ação Bloqueada', msg);
      return { success: false, message: msg };
    }

    const res = StorageService.importBackup(payload, mode);
    if (res.success) {
      const reloaded = StorageService.getRequests();
      setRequests(reloaded);
      refreshNotifications(reloaded);
      setSelectedRequest(null);
      success('Importação Concluída', res.message);
    } else {
      error('Falha na Importação', res.message);
    }
    return res;
  };

  // Filtragem dinâmica
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Busca textual ampla
      if (filters.busca.trim()) {
        const query = filters.busca.toLowerCase().trim();
        const matchProc = req.numeroProcesso.toLowerCase().includes(query);
        const matchProt = req.protocolo?.toLowerCase().includes(query) ?? false;
        const matchRep = req.rep?.toLowerCase().includes(query) ?? false;
        const matchPartes = req.acusadoVitima?.toLowerCase().includes(query) ?? false;
        const matchDesc = req.descricao.toLowerCase().includes(query);
        const matchSetor = req.setorSolicitante.toLowerCase().includes(query);

        if (!matchProc && !matchProt && !matchRep && !matchPartes && !matchDesc && !matchSetor) {
          return false;
        }
      }

      // Filtro por Setor
      if (filters.setor && req.setorSolicitante !== filters.setor) {
        return false;
      }

      // Filtro por Tipo de Exame
      if (filters.tipoExame && req.tipoExame !== filters.tipoExame) {
        return false;
      }

      // Filtro por Origem
      if (filters.origem && req.origem !== filters.origem) {
        return false;
      }

      // Filtro por Status
      if (filters.status && req.status !== filters.status) {
        return false;
      }

      // Filtro por Prioridade (considera a prioridade efetiva)
      if (filters.prioridade) {
        const { prioridadeEfetiva } = calculatePriority(
          req.prazoJudicial,
          req.status,
          req.prioridadeManual
        );
        if (prioridadeEfetiva !== filters.prioridade) {
          return false;
        }
      }

      // Filtro por Tipo de Prazo (Judicial vs Meta Interna)
      if (filters.tipoPrazo) {
        const isInterno = req.tipoPrazo === 'interno' || req.temPrazoJudicial === false;
        if (filters.tipoPrazo === 'interno' && !isInterno) return false;
        if (filters.tipoPrazo === 'judicial' && isInterno) return false;
      }

      return true;
    });
  }, [requests, filters]);

  return (
    <RequestContext.Provider
      value={{
        requests,
        filters,
        setFilters,
        resetFilters,
        filteredRequests,
        selectedRequest,
        setSelectedRequest,
        isCreateModalOpen,
        setIsCreateModalOpen,
        editingRequest,
        setEditingRequest,
        addRequest,
        updateRequest,
        deleteRequest,
        changeStatus,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        resetDemoData,
        exportBackup,
        importBackup,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
};

export function useRequests(): RequestContextType {
  const context = useContext(RequestContext);
  if (!context) {
    throw new Error('useRequests deve ser usado dentro de RequestProvider');
  }
  return context;
}
