import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  JudicialRequest,
  RequestStatus,
  RequestFilters,
  PriorityLevel,
  RequestAttachment,
} from '../types/request';
import { AppNotification } from '../types/notification';
import { StorageService, BackupPayload } from '../services/storageService';
import { syncRequestStatus, calculatePriority, getRequestRiskCategory } from '../services/deadlineService';
import { generateNotificationsFromRequests } from '../services/notificationService';
import { AuditService, buildDiff } from '../services/auditService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

export type CreateRequestData = Omit<
  JudicialRequest,
  'id' | 'criadoEm' | 'atualizadoEm' | 'criadoPor' | 'historico' | 'status'
> & {
  status?: RequestStatus;
};

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
  addRequest: (data: CreateRequestData) => boolean;
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
  receiveRequest: (id: string) => boolean;
  startRequestWork: (id: string) => boolean;
  concludeOperationalRequest: (
    id: string,
    motivo?: string,
    anexoComprovacao?: RequestAttachment | RequestAttachment[]
  ) => boolean;
  reopenOperationalRequest: (
    id: string,
    targetOperationalStatus: 'Recebido' | 'Em andamento',
    motivo: string
  ) => boolean;
  transferRequest: (
    id: string,
    newUserId: string,
    newUserName: string,
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
  statusOperacional: '',
  responsavelOperacional: '',
  cadastroCompleto: '',
  prioridade: '',
  tipoPrazo: '',
  dataInicio: '',
  dataFim: '',
};

const RequestContext = createContext<RequestContextType | undefined>(undefined);

export const RequestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, can } = useAuth();
  const { success, warning, error, info } = useToast();

  const [allRequests, setAllRequests] = useState<JudicialRequest[]>(() => {
    StorageService.initialize();
    return StorageService.getRequests();
  });

  // Requisições acessíveis ao usuário atual (conforme seus setores atribuídos ou acesso total de Administrador)
  const requests = useMemo(() => {
    if (currentUser.role === 'Administrador') {
      return allRequests;
    }
    const allowed = currentUser.setores || [];
    if (allowed.length === 0) {
      return [];
    }
    return allRequests.filter((r) => allowed.includes(r.setorSolicitante));
  }, [allRequests, currentUser]);

  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    StorageService.getNotifications()
  );

  const [filters, setFilters] = useState<RequestFilters>(DEFAULT_FILTERS);
  const [selectedRequest, setSelectedRequest] = useState<JudicialRequest | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingRequest, setEditingRequest] = useState<JudicialRequest | null>(null);

  // Recalcula notificações sempre que a lista de requisições acessíveis é atualizada
  const refreshNotifications = useCallback(
    (currentRequests: JudicialRequest[]) => {
      const existing = StorageService.getNotifications();
      const updated = generateNotificationsFromRequests(currentRequests, existing);
      setNotifications(updated);
      StorageService.saveNotifications(updated);
    },
    []
  );

  // Inicialização e atualização de notificações quando as requisições visíveis mudam
  useEffect(() => {
    refreshNotifications(requests);
  }, [requests, refreshNotifications]);

  // Se o filtro de setor estiver ativo e o usuário atual não tiver acesso a ele, limpa o filtro
  useEffect(() => {
    if (filters.setor && currentUser.role !== 'Administrador') {
      const allowed = currentUser.setores || [];
      if (!allowed.includes(filters.setor)) {
        setFilters((prev) => ({ ...prev, setor: '' }));
      }
    }
  }, [currentUser, filters.setor]);

  // Salva requisições e recalcula notificações
  const commitRequests = (updatedAll: JudicialRequest[]) => {
    setAllRequests(updatedAll);
    StorageService.saveRequests(updatedAll);

    // Se a requisição selecionada estiver aberta, atualiza a referência
    if (selectedRequest) {
      const match = updatedAll.find((r) => r.id === selectedRequest.id);
      setSelectedRequest(match || null);
    }
  };

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  // Adicionar nova requisição
  const addRequest = (data: CreateRequestData): boolean => {
    if (!can('canCreateRequest')) {
      AuditService.log({
        usuario: currentUser,
        modulo: 'requisicoes',
        acao: 'criacao',
        descricao: `Tentativa não autorizada de cadastrar requisição para o processo "${data.numeroProcesso}".`,
        entidadeReferencia: data.numeroProcesso,
        status: 'falha',
        motivoFalha: 'Perfil sem permissão canCreateRequest.',
      });
      error('Ação Não Permitida', 'Seu perfil não possui permissão para cadastrar requisições.');
      return false;
    }

    // Validação de Setores Responsáveis
    const hasSectorAccess =
      currentUser.role === 'Administrador' ||
      (currentUser.setores || []).includes(data.setorSolicitante);

    if (!hasSectorAccess) {
      AuditService.log({
        usuario: currentUser,
        modulo: 'requisicoes',
        acao: 'criacao',
        descricao: `Tentativa não autorizada de cadastrar requisição para o setor não atribuído "${data.setorSolicitante}".`,
        entidadeReferencia: data.numeroProcesso,
        status: 'falha',
        motivoFalha: `Usuário sem atribuição ao setor ${data.setorSolicitante}.`,
      });
      error(
        'Setor Não Autorizado',
        `Você não possui atribuição ao setor "${data.setorSolicitante}" para cadastrar requisições.`
      );
      return false;
    }

    const nowIso = new Date().toISOString();
    const initialStatus = data.status || 'Pendente';
    const temPrazo = data.temPrazoJudicial !== undefined ? data.temPrazoJudicial : true;
    const tipo = data.tipoPrazo || (temPrazo ? 'judicial' : 'interno');

    // Identifica se é cadastro simplificado ou completo
    const hasTechnicalData = Boolean(
      data.tipoExame &&
      data.tipoExame.trim() !== '' &&
      data.tipoExame !== 'A definir pelo setor'
    );
    const isCadastroCompleto = hasTechnicalData && Boolean(data.prazoJudicial);

    // Define status operacional e atribuição inicial
    let statusOperacional: any = data.statusOperacional || 'Aguardando recebimento';
    let responsavelOperacionalId = data.responsavelOperacionalId;
    let responsavelOperacionalNome = data.responsavelOperacionalNome;
    let dataRecebimentoOperacional = data.dataRecebimentoOperacional;

    // Se o próprio Operacional estiver cadastrando, já vincula a ele como recebido
    if (currentUser.role === 'Operacional') {
      statusOperacional = 'Recebido';
      responsavelOperacionalId = currentUser.id;
      responsavelOperacionalNome = currentUser.nome;
      dataRecebimentoOperacional = nowIso;
    } else if (currentUser.role === 'Administrador' && !hasTechnicalData && !responsavelOperacionalId) {
      statusOperacional = 'Aguardando recebimento';
    }

    const isPrazoIndefinido = Boolean(
      data.prazoIndefinido ||
      (statusOperacional === 'Aguardando recebimento' && (!data.prazoJudicial || data.prazoJudicial.trim() === ''))
    );

    // Prazos e descrições com fallback para cadastro simplificado
    const prazoFinal = isPrazoIndefinido
      ? ''
      : data.prazoJudicial || (() => {
          const d = new Date();
          d.setDate(d.getDate() + 10);
          d.setHours(23, 59, 59, 999);
          return d.toISOString();
        })();

    const descricaoFinal = data.descricao && data.descricao.trim() !== ''
      ? data.descricao.trim()
      : 'Demanda pericial cadastrada pela Direção/Triagem para recebimento e preenchimento técnico pelo setor.';

    const tipoExameFinal = data.tipoExame && data.tipoExame.trim() !== ''
      ? data.tipoExame
      : 'A definir pelo setor';

    let newReq: JudicialRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      numeroProcesso: data.numeroProcesso.trim(),
      descricao: descricaoFinal,
      setorSolicitante: data.setorSolicitante,
      prazoJudicial: prazoFinal,
      tipoExame: tipoExameFinal,
      dataRecebimento: isPrazoIndefinido ? undefined : (data.dataRecebimento || nowIso.slice(0, 10)),
      diasPrazo: isPrazoIndefinido ? undefined : (data.diasPrazo !== undefined ? data.diasPrazo : 10),
      prazoIndefinido: isPrazoIndefinido,
      temPrazoJudicial: isPrazoIndefinido ? undefined : data.temPrazoJudicial,
      tipoPrazo: isPrazoIndefinido ? undefined : data.tipoPrazo,
      vestigio: data.vestigio?.trim() || undefined,
      acusadoVitima: data.acusadoVitima?.trim() || undefined,
      protocolo: data.protocolo?.trim() || undefined,
      rep: data.rep?.trim() || undefined,
      origem: data.origem || undefined,
      referencias: data.referencias?.trim() || undefined,
      anexos: data.anexos && data.anexos.length > 0 ? [...data.anexos] : [],
      anexoComprovacao: data.anexoComprovacao || undefined,
      anexosComprovacao:
        data.anexosComprovacao && data.anexosComprovacao.length > 0
          ? [...data.anexosComprovacao]
          : undefined,
      prioridadeManual: data.prioridadeManual || null,
      status: initialStatus,
      statusOperacional,
      cadastroCompleto: isCadastroCompleto,
      responsavelOperacionalId,
      responsavelOperacionalNome,
      dataRecebimentoOperacional,
      motivoPrazoInterno: isPrazoIndefinido ? undefined : (data.motivoPrazoInterno?.trim() || undefined),
      criadoEm: nowIso,
      atualizadoEm: nowIso,
      criadoPor: currentUser.nome,
      criadoPorRole: currentUser.role,
      historico: [
        {
          de: 'Pendente',
          para: initialStatus,
          data: nowIso,
          usuario: currentUser.nome,
          motivo:
            currentUser.role === 'Administrador' && statusOperacional === 'Aguardando recebimento'
              ? 'Cadastro inicial da demanda efetuado pela Direção. Aguardando recebimento pelo setor responsável.'
              : `Cadastro da requisição pericial por ${currentUser.nome}`,
        },
      ],
    };

    // Valida se já nasce vencida
    newReq = syncRequestStatus(newReq);

    const updated = [newReq, ...allRequests];
    commitRequests(updated);

    // Registro automático de auditoria
    AuditService.log({
      usuario: currentUser,
      modulo: 'requisicoes',
      acao: 'criacao',
      descricao: `Cadastro da requisição pericial do Processo nº ${newReq.numeroProcesso} (${newReq.setorSolicitante} - ${newReq.tipoExame}).`,
      entidadeId: newReq.id,
      entidadeReferencia: newReq.numeroProcesso,
      status: 'sucesso',
      detalhes: [
        { campo: 'numeroProcesso', rotulo: 'Nº do Processo', valorAnterior: null, valorNovo: newReq.numeroProcesso },
        { campo: 'setorSolicitante', rotulo: 'Setor', valorAnterior: null, valorNovo: newReq.setorSolicitante },
        { campo: 'tipoExame', rotulo: 'Tipo de Exame', valorAnterior: null, valorNovo: newReq.tipoExame },
        { campo: 'prazoJudicial', rotulo: 'Prazo Estabelecido', valorAnterior: null, valorNovo: newReq.prazoJudicial },
        { campo: 'status', rotulo: 'Status Geral', valorAnterior: null, valorNovo: newReq.status },
        { campo: 'statusOperacional', rotulo: 'Status Operacional', valorAnterior: null, valorNovo: newReq.statusOperacional },
        { campo: 'cadastroCompleto', rotulo: 'Completude Cadastral', valorAnterior: null, valorNovo: newReq.cadastroCompleto ? 'Completo' : 'Pendente' },
        { campo: 'descricao', rotulo: 'Descrição', valorAnterior: null, valorNovo: newReq.descricao },
        {
          campo: 'anexos',
          rotulo: 'Documentos Anexados',
          valorAnterior: null,
          valorNovo:
            newReq.anexos && newReq.anexos.length > 0
              ? newReq.anexos.map((a) => a.nome).join(', ')
              : '(Nenhum documento)',
        },
      ],
    });

    // Se estiver aguardando recebimento, cria notificação operacional para o setor
    if (newReq.statusOperacional === 'Aguardando recebimento') {
      const notifOperacional: AppNotification = {
        id: `notif-op-${Date.now()}`,
        chaveUnica: `new_req_${newReq.id}`,
        requisicaoId: newReq.id,
        numeroProcesso: newReq.numeroProcesso,
        titulo: 'Nova Demanda no Setor',
        mensagem: `Processo nº ${newReq.numeroProcesso} aguarda recebimento na fila de ${newReq.setorSolicitante}.`,
        tipo: 'aviso',
        marco: 'nova_demanda',
        categoria: 'operacional',
        setor: newReq.setorSolicitante,
        lida: false,
        criadaEm: nowIso,
      };
      const updatedNotifs = [notifOperacional, ...notifications];
      setNotifications(updatedNotifs);
      StorageService.saveNotifications(updatedNotifs);
    }

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
      AuditService.log({
        usuario: currentUser,
        modulo: 'requisicoes',
        acao: 'edicao',
        descricao: `Tentativa não autorizada de editar requisição ID "${id}".`,
        entidadeId: id,
        status: 'falha',
        motivoFalha: 'Perfil sem permissão canEditRequest.',
      });
      error('Ação Não Permitida', 'Seu perfil não possui permissão para editar requisições.');
      return false;
    }

    const target = allRequests.find((r) => r.id === id);
    if (!target) return false;

    // Validação de Setor de Origem da Requisição
    const hasOriginSectorAccess =
      currentUser.role === 'Administrador' ||
      (currentUser.setores || []).includes(target.setorSolicitante);

    if (!hasOriginSectorAccess) {
      AuditService.log({
        usuario: currentUser,
        modulo: 'requisicoes',
        acao: 'edicao',
        descricao: `Tentativa não autorizada de editar requisição do setor "${target.setorSolicitante}".`,
        entidadeId: id,
        entidadeReferencia: target.numeroProcesso,
        status: 'falha',
        motivoFalha: `Usuário sem atribuição ao setor da requisição.`,
      });
      error(
        'Acesso Restrito ao Setor',
        `Você não possui permissão para editar requisições do setor "${target.setorSolicitante}".`
      );
      return false;
    }

    // Se houver alteração do setor da requisição, valida se o usuário tem acesso ao setor de destino
    if (data.setorSolicitante && data.setorSolicitante !== target.setorSolicitante) {
      const hasDestSectorAccess =
        currentUser.role === 'Administrador' ||
        (currentUser.setores || []).includes(data.setorSolicitante);

      if (!hasDestSectorAccess) {
        AuditService.log({
          usuario: currentUser,
          modulo: 'requisicoes',
          acao: 'edicao',
          descricao: `Tentativa não autorizada de transferir requisição para o setor "${data.setorSolicitante}".`,
          entidadeId: id,
          entidadeReferencia: target.numeroProcesso,
          status: 'falha',
          motivoFalha: `Usuário sem atribuição ao setor de destino.`,
        });
        error(
          'Setor de Destino Não Autorizado',
          `Você não possui permissão para transferir requisições para o setor "${data.setorSolicitante}".`
        );
        return false;
      }
    }

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

    // Calcula diferenças para a auditoria
    const diffs = buildDiff(target, updatedReq);

    // Identifica se a operação principal é alteração de status ou documentos
    const statusMudou = Boolean(data.status && data.status !== target.status);
    const anexosMudaram =
      (data.anexos !== undefined && JSON.stringify(target.anexos || []) !== JSON.stringify(updatedReq.anexos || [])) ||
      (data.anexosComprovacao !== undefined && JSON.stringify(target.anexosComprovacao || []) !== JSON.stringify(updatedReq.anexosComprovacao || [])) ||
      (data.anexoComprovacao !== undefined && JSON.stringify(target.anexoComprovacao || null) !== JSON.stringify(updatedReq.anexoComprovacao || null));

    let acao: any = 'edicao';
    let modulo: any = 'requisicoes';
    let descricao = `Atualização de dados cadastrais do Processo nº ${target.numeroProcesso}.`;

    if (statusMudou) {
      acao = 'status';
      modulo = 'requisicoes';
      descricao = `Situação do Processo nº ${target.numeroProcesso} alterada de "${target.status}" para "${data.status}".`;
      if (anexosMudaram) {
        descricao += ' Documento(s) comprobatório(s) anexado(s).';
      }
    } else if (anexosMudaram) {
      acao = 'documento';
      modulo = 'documentos';
      descricao = `Alteração nos documentos/anexos do Processo nº ${target.numeroProcesso}.`;
    }

    if (motivoAlteracao) {
      diffs.push({
        campo: 'motivoAlteracao',
        rotulo: 'Motivo / Justificativa',
        valorAnterior: null,
        valorNovo: motivoAlteracao,
      });
    }

    const updatedList = allRequests.map((r) => (r.id === id ? updatedReq : r));
    commitRequests(updatedList);
    if (selectedRequest?.id === id) {
      setSelectedRequest(updatedReq);
    }

    // Registro automático de auditoria
    AuditService.log({
      usuario: currentUser,
      modulo,
      acao,
      descricao,
      entidadeId: target.id,
      entidadeReferencia: target.numeroProcesso,
      status: 'sucesso',
      detalhes: diffs,
    });

    success('Requisição Atualizada', `Dados do processo ${target.numeroProcesso} salvos.`);
    return true;
  };

  // Alterar status diretamente com permissões checadas
  const changeStatus = (
    id: string,
    novoStatus: RequestStatus,
    motivo?: string
  ): boolean => {
    const target = allRequests.find((r) => r.id === id);
    if (!target) return false;

    const hasSectorAccess =
      currentUser.role === 'Administrador' ||
      (currentUser.setores || []).includes(target.setorSolicitante);

    if (!hasSectorAccess) {
      AuditService.log({
        usuario: currentUser,
        modulo: 'requisicoes',
        acao: 'status',
        descricao: `Tentativa não autorizada de alterar status de requisição do setor "${target.setorSolicitante}".`,
        entidadeId: id,
        entidadeReferencia: target.numeroProcesso,
        status: 'falha',
        motivoFalha: 'Usuário sem atribuição ao setor da requisição.',
      });
      error(
        'Acesso Restrito ao Setor',
        `Você não possui permissão para alterar o status de requisições do setor "${target.setorSolicitante}".`
      );
      return false;
    }

    if (novoStatus === 'Concluído' && !can('canConcludeRequest')) {
      AuditService.log({
        usuario: currentUser,
        modulo: 'requisicoes',
        acao: 'status',
        descricao: `Tentativa não autorizada de concluir/homologar o Processo nº ${target.numeroProcesso}.`,
        entidadeId: id,
        entidadeReferencia: target.numeroProcesso,
        status: 'falha',
        motivoFalha: 'Perfil sem permissão canConcludeRequest.',
      });
      error(
        'Acesso Restrito',
        'Apenas perfis autorizados podem homologar e concluir requisições judiciais.'
      );
      return false;
    }

    if (novoStatus === 'Cancelado' && !can('canCancelRequest')) {
      AuditService.log({
        usuario: currentUser,
        modulo: 'requisicoes',
        acao: 'status',
        descricao: `Tentativa não autorizada de cancelar o Processo nº ${target.numeroProcesso}.`,
        entidadeId: id,
        entidadeReferencia: target.numeroProcesso,
        status: 'falha',
        motivoFalha: 'Perfil sem permissão canCancelRequest.',
      });
      error(
        'Acesso Restrito',
        'Apenas o Administrador pode cancelar requisições.'
      );
      return false;
    }

    return updateRequest(id, { status: novoStatus }, motivo);
  };

  // Excluir requisição com checagem de permissão
  const deleteRequest = (id: string): boolean => {
    const target = allRequests.find((r) => r.id === id);
    if (!target) return false;

    const hasSectorAccess =
      currentUser.role === 'Administrador' ||
      (currentUser.setores || []).includes(target.setorSolicitante);

    if (!hasSectorAccess) {
      AuditService.log({
        usuario: currentUser,
        modulo: 'requisicoes',
        acao: 'exclusao',
        descricao: `Tentativa não autorizada de excluir requisição do setor "${target.setorSolicitante}".`,
        entidadeId: id,
        entidadeReferencia: target.numeroProcesso,
        status: 'falha',
        motivoFalha: 'Usuário sem atribuição ao setor da requisição.',
      });
      error(
        'Ação Bloqueada',
        `Você não possui autorização para excluir requisições do setor "${target.setorSolicitante}".`
      );
      return false;
    }

    if (!can('canDeleteRequest')) {
      AuditService.log({
        usuario: currentUser,
        modulo: 'requisicoes',
        acao: 'exclusao',
        descricao: `Tentativa não autorizada de excluir a requisição do processo nº ${target.numeroProcesso || id}.`,
        entidadeId: id,
        entidadeReferencia: target.numeroProcesso,
        status: 'falha',
        motivoFalha: 'Perfil sem permissão canDeleteRequest.',
      });
      error(
        'Ação Bloqueada',
        'Seu perfil não possui autorização para excluir requisições. Apenas o Administrador possui permissão de exclusão.'
      );
      return false;
    }

    const updatedList = allRequests.filter((r) => r.id !== id);
    commitRequests(updatedList);

    // Remove também notificações vinculadas a esta requisição
    const cleanedNotifs = notifications.filter((n) => n.requisicaoId !== id);
    setNotifications(cleanedNotifs);
    StorageService.saveNotifications(cleanedNotifs);

    if (selectedRequest?.id === id) {
      setSelectedRequest(null);
    }

    // Registro automático de auditoria
    AuditService.log({
      usuario: currentUser,
      modulo: 'requisicoes',
      acao: 'exclusao',
      descricao: `Exclusão permanente dos autos e requisição do processo nº ${target?.numeroProcesso || id}.`,
      entidadeId: id,
      entidadeReferencia: target?.numeroProcesso,
      status: 'sucesso',
    });

    success('Requisição Excluída', `Processo ${target.numeroProcesso} removido com sucesso.`);
    return true;
  };

  // Operacional: Ação explícita "Receber Requisição"
  const receiveRequest = (id: string): boolean => {
    const target = allRequests.find((r) => r.id === id);
    if (!target) return false;

    const hasSectorAccess =
      currentUser.role === 'Administrador' ||
      (currentUser.setores || []).includes(target.setorSolicitante);

    if (!hasSectorAccess) {
      AuditService.log({
        usuario: currentUser,
        modulo: 'requisicoes',
        acao: 'status',
        descricao: `Tentativa não autorizada de receber requisição do setor "${target.setorSolicitante}".`,
        entidadeId: id,
        entidadeReferencia: target.numeroProcesso,
        status: 'falha',
        motivoFalha: 'Usuário sem atribuição ao setor da requisição.',
      });
      error(
        'Ação Bloqueada',
        `Apenas servidores com atuação no setor "${target.setorSolicitante}" podem receber esta demanda.`
      );
      return false;
    }

    const nowIso = new Date().toISOString();
    const novoStatusGeral =
      target.status === 'Pendente' || target.status === 'Não iniciado' ? 'Iniciado' : target.status;

    const updatedReq: JudicialRequest = {
      ...target,
      statusOperacional: 'Em andamento',
      responsavelOperacionalId: currentUser.id,
      responsavelOperacionalNome: currentUser.nome,
      dataRecebimentoOperacional: nowIso,
      dataIniciadoOperacional: nowIso,
      status: novoStatusGeral,
      atualizadoEm: nowIso,
      historico: [
        ...(target.historico || []),
        {
          de: target.status,
          para: novoStatusGeral,
          data: nowIso,
          usuario: currentUser.nome,
          motivo: `Demanda recebida e iniciada em execução pericial pelo perito ${currentUser.nome} (${target.setorSolicitante}).`,
        },
      ],
    };

    const updatedList = allRequests.map((r) => (r.id === id ? updatedReq : r));
    commitRequests(updatedList);

    // Notificação operacional
    const newNotif: AppNotification = {
      id: `notif-rec-${Date.now()}`,
      chaveUnica: `recebido_${id}_${currentUser.id}`,
      requisicaoId: id,
      numeroProcesso: target.numeroProcesso,
      titulo: 'Demanda Recebida',
      mensagem: `${currentUser.nome} recebeu a demanda do Processo nº ${target.numeroProcesso} (${target.setorSolicitante}).`,
      tipo: 'sucesso',
      marco: 'recebido',
      categoria: 'operacional',
      setor: target.setorSolicitante,
      lida: false,
      criadaEm: nowIso,
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    StorageService.saveNotifications(updatedNotifs);

    AuditService.log({
      usuario: currentUser,
      modulo: 'requisicoes',
      acao: 'status',
      descricao: `Recebimento formal da demanda do Processo nº ${target.numeroProcesso} pelo perito ${currentUser.nome} no setor ${target.setorSolicitante}.`,
      entidadeId: id,
      entidadeReferencia: target.numeroProcesso,
      status: 'sucesso',
      detalhes: [
        { campo: 'statusOperacional', rotulo: 'Situação Operacional', valorAnterior: target.statusOperacional || 'Aguardando recebimento', valorNovo: 'Recebido' },
        { campo: 'responsavelOperacionalNome', rotulo: 'Perito Responsável', valorAnterior: target.responsavelOperacionalNome || 'Fila do Setor', valorNovo: currentUser.nome },
        { campo: 'dataRecebimentoOperacional', rotulo: 'Data/Hora Recebimento', valorAnterior: null, valorNovo: nowIso },
      ],
    });

    success('Demanda Recebida', `Você assumiu o Processo ${target.numeroProcesso}.`);
    return true;
  };

  // Operacional: Iniciar Atendimento Pericial
  const startRequestWork = (id: string): boolean => {
    const target = allRequests.find((r) => r.id === id);
    if (!target) return false;

    const hasSectorAccess =
      currentUser.role === 'Administrador' ||
      (currentUser.setores || []).includes(target.setorSolicitante);

    if (!hasSectorAccess) {
      error('Ação Bloqueada', 'Você não tem permissão para iniciar exames nesta demanda.');
      return false;
    }

    const nowIso = new Date().toISOString();
    const novoStatusGeral =
      target.status === 'Pendente' || target.status === 'Não iniciado' ? 'Iniciado' : target.status;

    const updatedReq: JudicialRequest = {
      ...target,
      statusOperacional: 'Em andamento',
      dataIniciadoOperacional: nowIso,
      status: novoStatusGeral,
      atualizadoEm: nowIso,
      historico: [
        ...(target.historico || []),
        {
          de: target.status,
          para: novoStatusGeral,
          data: nowIso,
          usuario: currentUser.nome,
          motivo: `Início do exame pericial na bancada técnica por ${currentUser.nome}`,
        },
      ],
    };

    const updatedList = allRequests.map((r) => (r.id === id ? updatedReq : r));
    commitRequests(updatedList);

    AuditService.log({
      usuario: currentUser,
      modulo: 'requisicoes',
      acao: 'status',
      descricao: `Início do atendimento pericial no Processo nº ${target.numeroProcesso} por ${currentUser.nome}.`,
      entidadeId: id,
      entidadeReferencia: target.numeroProcesso,
      status: 'sucesso',
      detalhes: [
        { campo: 'statusOperacional', rotulo: 'Situação Operacional', valorAnterior: target.statusOperacional || 'Recebido', valorNovo: 'Em andamento' },
        { campo: 'dataIniciadoOperacional', rotulo: 'Data de Início', valorAnterior: null, valorNovo: nowIso },
      ],
    });

    success('Atendimento Iniciado', `Exame pericial iniciado para o processo ${target.numeroProcesso}.`);
    return true;
  };

  // Reatribuição / Transferência de demanda
  const transferRequest = (
    id: string,
    newUserId: string,
    newUserName: string,
    motivo?: string
  ): boolean => {
    const target = allRequests.find((r) => r.id === id);
    if (!target) return false;

    if (currentUser.role !== 'Administrador') {
      error('Acesso Negado', 'Apenas o Administrador pode reatribuir requisições periciais entre servidores.');
      return false;
    }

    if (target.status === 'Concluído' || target.statusOperacional === 'Concluído') {
      error('Operação Não Permitida', 'Requisições já concluídas não podem ter a requisição pericial reatribuída.');
      return false;
    }

    const nowIso = new Date().toISOString();
    const historyEntry = {
      usuarioAnteriorId: target.responsavelOperacionalId,
      usuarioAnteriorNome: target.responsavelOperacionalNome,
      usuarioNovoId: newUserId,
      usuarioNovoNome: newUserName,
      setor: target.setorSolicitante,
      data: nowIso,
      motivo: motivo || 'Transferência administrativa de perito responsável',
    };

    const updatedReq: JudicialRequest = {
      ...target,
      responsavelOperacionalId: newUserId,
      responsavelOperacionalNome: newUserName,
      statusOperacional: 'Recebido',
      dataRecebimentoOperacional: nowIso,
      historicoAtribuicoes: [...(target.historicoAtribuicoes || []), historyEntry],
      atualizadoEm: nowIso,
    };

    const updatedList = allRequests.map((r) => (r.id === id ? updatedReq : r));
    commitRequests(updatedList);

    AuditService.log({
      usuario: currentUser,
      modulo: 'requisicoes',
      acao: 'edicao',
      descricao: `Reatribuição de responsabilidade do Processo nº ${target.numeroProcesso} de "${target.responsavelOperacionalNome || 'Fila do Setor'}" para "${newUserName}".`,
      entidadeId: id,
      entidadeReferencia: target.numeroProcesso,
      status: 'sucesso',
      detalhes: [
        { campo: 'responsavelOperacionalNome', rotulo: 'Perito Responsável', valorAnterior: target.responsavelOperacionalNome || 'Nenhum', valorNovo: newUserName },
        { campo: 'motivoTransferencia', rotulo: 'Motivo', valorAnterior: null, valorNovo: motivo || 'Transferência administrativa' },
      ],
    });

    success('Requisição Reatribuída', `Processo transferido para ${newUserName}.`);
    return true;
  };

  // Concluir requisição pericial operacional com validação e auditoria
  const concludeOperationalRequest = (
    id: string,
    motivo?: string,
    anexoComprovacao?: RequestAttachment | RequestAttachment[]
  ): boolean => {
    const target = allRequests.find((r) => r.id === id);
    if (!target) return false;

    if (!can('canConcludeRequest')) {
      AuditService.log({
        usuario: currentUser,
        modulo: 'requisicoes',
        acao: 'status',
        descricao: `Tentativa não autorizada de concluir o Processo nº ${target.numeroProcesso}.`,
        entidadeId: id,
        entidadeReferencia: target.numeroProcesso,
        status: 'falha',
        motivoFalha: 'Perfil sem permissão canConcludeRequest.',
      });
      error('Acesso Restrito', 'Apenas perfis autorizados podem homologar e concluir requisições judiciais.');
      return false;
    }

    const hasSectorAccess =
      currentUser.role === 'Administrador' ||
      (currentUser.setores || []).includes(target.setorSolicitante);

    if (!hasSectorAccess) {
      error('Ação Bloqueada', `Você não possui atribuição ao setor "${target.setorSolicitante}".`);
      return false;
    }

    const nowIso = new Date().toISOString();
    const finalAttachments: RequestAttachment[] = Array.isArray(anexoComprovacao)
      ? anexoComprovacao
      : anexoComprovacao
      ? [anexoComprovacao]
      : target.anexosComprovacao || (target.anexoComprovacao ? [target.anexoComprovacao] : []);

    const updatedReq: JudicialRequest = {
      ...target,
      statusOperacional: 'Concluído',
      status: 'Concluído',
      dataConclusaoOperacional: nowIso,
      anexoComprovacao: finalAttachments[0] || target.anexoComprovacao,
      anexosComprovacao: finalAttachments.length > 0 ? finalAttachments : undefined,
      atualizadoEm: nowIso,
      historico: [
        ...(target.historico || []),
        {
          de: target.status,
          para: 'Concluído',
          data: nowIso,
          usuario: currentUser.nome,
          motivo: motivo || `Demanda pericial finalizada e homologada por ${currentUser.nome}.`,
        },
      ],
    };

    const updatedList = allRequests.map((r) => (r.id === id ? updatedReq : r));
    commitRequests(updatedList);

    // Notificação operacional
    const newNotif: AppNotification = {
      id: `notif-concl-${Date.now()}`,
      chaveUnica: `conclusao_${id}_${Date.now()}`,
      requisicaoId: id,
      numeroProcesso: target.numeroProcesso,
      titulo: 'Demanda Pericial Concluída',
      mensagem: `Demanda do Processo nº ${target.numeroProcesso} foi concluída por ${currentUser.nome}.`,
      tipo: 'sucesso',
      marco: 'conclusao',
      categoria: 'operacional',
      setor: target.setorSolicitante,
      lida: false,
      criadaEm: nowIso,
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    StorageService.saveNotifications(updatedNotifs);

    AuditService.log({
      usuario: currentUser,
      modulo: 'requisicoes',
      acao: 'status',
      descricao: `Demanda pericial do Processo nº ${target.numeroProcesso} homologada e concluída por ${currentUser.nome}.`,
      entidadeId: id,
      entidadeReferencia: target.numeroProcesso,
      status: 'sucesso',
      detalhes: [
        { campo: 'statusOperacional', rotulo: 'Status Operacional', valorAnterior: target.statusOperacional || 'Em andamento', valorNovo: 'Concluído' },
        { campo: 'status', rotulo: 'Status Geral', valorAnterior: target.status, valorNovo: 'Concluído' },
        { campo: 'motivo', rotulo: 'Justificativa / Laudo', valorAnterior: null, valorNovo: motivo || 'Homologação' },
      ],
    });

    success('Demanda Concluída', `Processo ${target.numeroProcesso} concluído com sucesso.`);
    return true;
  };

  // Reabertura de demanda concluída
  const reopenOperationalRequest = (
    id: string,
    targetOperationalStatus: 'Recebido' | 'Em andamento',
    motivo: string
  ): boolean => {
    const target = allRequests.find((r) => r.id === id);
    if (!target) return false;

    if (currentUser.role !== 'Administrador' && currentUser.id !== target.responsavelOperacionalId) {
      error('Acesso Restrito', 'Apenas o Administrador ou o perito responsável podem reabrir demandas concluídas.');
      return false;
    }

    if (!motivo || !motivo.trim()) {
      error('Motivo Obrigatório', 'Informe uma justificativa formal para a reabertura da demanda.');
      return false;
    }

    const nowIso = new Date().toISOString();
    const novoStatusGeral = targetOperationalStatus === 'Em andamento' ? 'Iniciado' : 'Pendente';

    const updatedReq: JudicialRequest = {
      ...target,
      statusOperacional: targetOperationalStatus,
      status: novoStatusGeral,
      dataConclusaoOperacional: undefined,
      atualizadoEm: nowIso,
      historico: [
        ...(target.historico || []),
        {
          de: 'Concluído',
          para: novoStatusGeral,
          data: nowIso,
          usuario: currentUser.nome,
          motivo: `Reabertura da demanda pericial: ${motivo}`,
        },
      ],
    };

    const updatedList = allRequests.map((r) => (r.id === id ? updatedReq : r));
    commitRequests(updatedList);

    AuditService.log({
      usuario: currentUser,
      modulo: 'requisicoes',
      acao: 'status',
      descricao: `Reabertura da demanda pericial do Processo nº ${target.numeroProcesso} por ${currentUser.nome}. Motivo: ${motivo}`,
      entidadeId: id,
      entidadeReferencia: target.numeroProcesso,
      status: 'sucesso',
      detalhes: [
        { campo: 'statusOperacional', rotulo: 'Status Operacional', valorAnterior: 'Concluído', valorNovo: targetOperationalStatus },
        { campo: 'motivoReabertura', rotulo: 'Justificativa da Reabertura', valorAnterior: null, valorNovo: motivo },
      ],
    });

    success('Demanda Reaberta', `Processo ${target.numeroProcesso} retornado para "${targetOperationalStatus === 'Em andamento' ? 'Em execução' : 'Recebido'}".`);
    return true;
  };



  // Notificações
  const markNotificationAsRead = (id: string) => {
    const nowIso = new Date().toISOString();
    const updated = notifications.map((n) =>
      n.id === id
        ? {
            ...n,
            lida: true,
            lidaPor: n.lidaPor || currentUser.nome,
            lidaEm: n.lidaEm || nowIso,
          }
        : n
    );
    setNotifications(updated);
    StorageService.saveNotifications(updated);
  };

  const markAllNotificationsAsRead = () => {
    const nowIso = new Date().toISOString();
    const updated = notifications.map((n) => ({
      ...n,
      lida: true,
      lidaPor: n.lidaPor || currentUser.nome,
      lidaEm: n.lidaEm || nowIso,
    }));
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
      AuditService.log({
        usuario: currentUser,
        modulo: 'sistema',
        acao: 'sistema',
        descricao: 'Tentativa não autorizada de redefinir o sistema para dados de demonstração.',
        status: 'falha',
        motivoFalha: 'Perfil sem permissão canResetDemoData.',
      });
      error(
        'Ação Bloqueada',
        'Apenas o Administrador pode redefinir a base para dados de demonstração.'
      );
      return false;
    }

    const ok = StorageService.resetToDemo();
    if (ok) {
      const reloaded = StorageService.getRequests();
      setAllRequests(reloaded);
      refreshNotifications(reloaded);
      setSelectedRequest(null);

      AuditService.log({
        usuario: currentUser,
        modulo: 'sistema',
        acao: 'sistema',
        descricao: 'Restauração da base local para os dados padrão de demonstração.',
        status: 'sucesso',
      });

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
      AuditService.log({
        usuario: currentUser,
        modulo: 'backup',
        acao: 'backup',
        descricao: 'Tentativa não autorizada de exportar backup de dados.',
        status: 'falha',
        motivoFalha: 'Perfil sem permissão canExportBackup.',
      });
      error('Ação Bloqueada', 'Seu perfil não tem permissão para exportar dados.');
      return;
    }
    StorageService.exportBackup();

    AuditService.log({
      usuario: currentUser,
      modulo: 'backup',
      acao: 'backup',
      descricao: 'Exportação manual de arquivo de backup JSON de segurança do sistema.',
      status: 'sucesso',
    });

    success('Backup Exportado', 'Arquivo JSON de segurança gerado com sucesso.');
  };

  const importBackup = (
    payload: BackupPayload,
    mode: 'replace' | 'merge'
  ): { success: boolean; message: string } => {
    if (!can('canImportBackup')) {
      const msg = 'Apenas o Administrador possui permissão para importar arquivos de backup.';
      AuditService.log({
        usuario: currentUser,
        modulo: 'backup',
        acao: 'backup',
        descricao: 'Tentativa não autorizada de restauração de backup do sistema.',
        status: 'falha',
        motivoFalha: msg,
      });
      error('Ação Bloqueada', msg);
      return { success: false, message: msg };
    }

    const res = StorageService.importBackup(payload, mode);
    if (res.success) {
      const reloaded = StorageService.getRequests();
      setAllRequests(reloaded);
      refreshNotifications(reloaded);
      setSelectedRequest(null);

      AuditService.log({
        usuario: currentUser,
        modulo: 'backup',
        acao: 'backup',
        descricao: `Restauração de backup realizada com sucesso no modo "${mode === 'replace' ? 'Substituição total' : 'Mesclagem'}" (${payload.requests?.length || 0} requisições).`,
        status: 'sucesso',
      });

      success('Importação Concluída', res.message);
    } else {
      AuditService.log({
        usuario: currentUser,
        modulo: 'backup',
        acao: 'backup',
        descricao: 'Falha durante o processamento da importação do arquivo de backup.',
        status: 'falha',
        motivoFalha: res.message,
      });
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
        const matchOrigem = req.origem?.toLowerCase().includes(query) ?? false;

        if (
          !matchProc &&
          !matchProt &&
          !matchRep &&
          !matchPartes &&
          !matchDesc &&
          !matchSetor &&
          !matchOrigem
        ) {
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

      // Filtro por Status e Faixa de Prazo
      if (filters.status) {
        const s = req.status;
        const norm =
          s === 'Pendente'
            ? 'Não iniciado'
            : s === 'Em andamento' || s === 'Aguardando informações'
            ? 'Iniciado'
            : s;

        const normalizeStr = (v: string) =>
          v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

        const cat = getRequestRiskCategory(req);

        if (filters.status === 'proximos') {
          const now = new Date();
          const seteDias = new Date();
          seteDias.setDate(seteDias.getDate() + 7);
          const prazo = new Date(req.prazoJudicial);
          if (s === 'Concluído' || s === 'Cancelado' || s === 'Vencido') {
            return false;
          }
          if (prazo < now || prazo > seteDias) {
            return false;
          }
        } else if (filters.status === 'pendentes') {
          if (s === 'Concluído' || s === 'Cancelado' || s === 'Vencido' || cat === 'vencidos') {
            return false;
          }
        } else if (filters.status === 'urgente') {
          if (cat !== 'urgente') return false;
        } else if (filters.status === 'alta') {
          if (cat !== 'alta') return false;
        } else if (filters.status === 'media') {
          if (cat !== 'media') return false;
        } else if (filters.status === 'baixa') {
          if (cat !== 'baixa') return false;
        } else if (filters.status === 'Vencido') {
          if (cat !== 'vencidos' && s !== 'Vencido') return false;
        } else {
          const target = normalizeStr(filters.status);
          if (target === 'concluido') {
            if (s !== 'Concluído') return false;
          } else if (
            normalizeStr(norm) !== target &&
            normalizeStr(s) !== target
          ) {
            return false;
          }
        }
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

      // Filtro por Status Operacional
      if (filters.statusOperacional) {
        if (filters.statusOperacional === 'Em andamento') {
          if (req.statusOperacional !== 'Em andamento' && req.statusOperacional !== 'Recebido') {
            return false;
          }
        } else if (req.statusOperacional !== filters.statusOperacional) {
          return false;
        }
      }

      // Filtro por Responsável Operacional
      if (filters.responsavelOperacional) {
        if (filters.responsavelOperacional === 'sem_responsavel') {
          if (req.responsavelOperacionalId) return false;
        } else if (filters.responsavelOperacional === 'meus') {
          if (req.responsavelOperacionalId !== currentUser.id) return false;
        } else if (req.responsavelOperacionalId !== filters.responsavelOperacional) {
          return false;
        }
      }

      // Filtro por Completude do Cadastro
      if (filters.cadastroCompleto) {
        if (filters.cadastroCompleto === 'completo' && !req.cadastroCompleto) return false;
        if (filters.cadastroCompleto === 'pendente' && req.cadastroCompleto) return false;
      }

      // Filtro por Período de Prazo (Data Inicial e Data Final)
      if (filters.dataInicio) {
        const dPrazo = req.prazoJudicial.slice(0, 10);
        if (dPrazo < filters.dataInicio) return false;
      }

      if (filters.dataFim) {
        const dPrazo = req.prazoJudicial.slice(0, 10);
        if (dPrazo > filters.dataFim) return false;
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
        receiveRequest,
        startRequestWork,
        concludeOperationalRequest,
        reopenOperationalRequest,
        transferRequest,
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
