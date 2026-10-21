import { RequestStatus, PriorityLevel } from '../types/request';

export const SETORES_SOLICITANTES = [
  'Balística Forense',
  'Genética Forense / DNA',
  'Toxicologia Forense',
  'Informática Forense / Perícia Digital',
  'Documentoscopia e Grafotécnica',
  'Medicina Legal e Necrópsia',
  'Engenharia Forense',
  'Contabilidade e Finanças Forense',
  'Química Forense',
  'Identificação Criminal (Papiloscopia)',
];

export const TIPOS_DE_EXAME = [
  'Confronto Balístico',
  'Exame de DNA Forense',
  'Análise Toxicológica em Fluídos',
  'Extração e Análise em Smartphone',
  'Perícia Digital em Mídia de Armazenamento',
  'Exame Grafotécnico de Assinatura',
  'Perícia Documental de Autenticidade',
  'Laudo de Necropsia Forense',
  'Perícia Contábil e Financeira',
  'Análise Química de Substâncias Entorpecentes',
  'Levantamento Pericial em Local de Crime',
];

export const ORIGENS_COMUNS = [
  '1ª Vara Criminal Central',
  '2ª Vara do Tribunal do Júri',
  '3ª Vara de Família e Sucessões',
  '4ª Vara da Fazenda Pública',
  'Delegacia de Homicídios e Proteção à Pessoa (DHPP)',
  'Delegacia de Repressão a Crimes Cibernéticos (DRCC)',
  '14º Distrito Policial',
  'Ministério Público Estadual - 3ª Promotoria Criminal',
  'Juizado Especial Cível e Criminal',
  'Vara da Infância e da Juventude',
];

export const STATUS_CONFIG: Record<
  RequestStatus,
  {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    dotClass: string;
    desc: string;
  }
> = {
  'Não iniciado': {
    label: 'Não iniciado',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-300',
    dotClass: 'bg-slate-400',
    desc: 'Requisição cadastrada aguardando início dos trabalhos periciais',
  },
  Iniciado: {
    label: 'Iniciado',
    bgClass: 'bg-[#C9D7EE]/40',
    textClass: 'text-[#274578]',
    borderClass: 'border-[#95B1DE]',
    dotClass: 'bg-[#274578]',
    desc: 'Exames e análises periciais em execução',
  },
  Concluído: {
    label: 'Concluído',
    bgClass: 'bg-emerald-50/50',
    textClass: 'text-slate-600',
    borderClass: 'border-emerald-200/50',
    dotClass: 'bg-emerald-400/80',
    desc: 'Laudo pericial finalizado e juntado ao processo',
  },
  Cancelado: {
    label: 'Cancelado',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-600',
    borderClass: 'border-slate-300',
    dotClass: 'bg-slate-400',
    desc: 'Requisição revogada pela autoridade judicial ou policial',
  },
  // Retrocompatibilidade para dados legados
  Pendente: {
    label: 'Não iniciado',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-300',
    dotClass: 'bg-slate-400',
    desc: 'Requisição cadastrada aguardando início dos trabalhos periciais',
  },
  'Em andamento': {
    label: 'Iniciado',
    bgClass: 'bg-[#C9D7EE]/40',
    textClass: 'text-[#274578]',
    borderClass: 'border-[#95B1DE]',
    dotClass: 'bg-[#274578]',
    desc: 'Exames e análises periciais em execução',
  },
  'Aguardando informações': {
    label: 'Iniciado',
    bgClass: 'bg-[#C9D7EE]/40',
    textClass: 'text-[#274578]',
    borderClass: 'border-[#95B1DE]',
    dotClass: 'bg-[#274578]',
    desc: 'Exames e análises periciais em execução',
  },
  Vencido: {
    label: 'Vencido',
    bgClass: 'bg-[#FCD5D1]/60',
    textClass: 'text-[#97171B]',
    borderClass: 'border-[#FA9C93]',
    dotClass: 'bg-[#D12429]',
    desc: 'Prazo judicial expirado sem conclusão do laudo',
  },
};

export const PRIORIDADE_CONFIG: Record<
  PriorityLevel,
  {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    badgeClass: string;
    barColor: string;
    desc: string;
  }
> = {
  Urgente: {
    label: 'Urgente',
    bgClass: 'bg-red-50',
    textClass: 'text-red-700',
    borderClass: 'border-red-200',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    barColor: '#dc2626',
    desc: 'Vencido ou vencimento em até 5 dias',
  },
  Alta: {
    label: 'Alta',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    barColor: '#f59e0b',
    desc: 'Vencimento entre 6 e 15 dias',
  },
  Média: {
    label: 'Média',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-200',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    barColor: '#2563eb',
    desc: 'Vencimento entre 16 e 30 dias',
  },
  Baixa: {
    label: 'Baixa',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-200',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    barColor: '#94a3b8',
    desc: 'Vencimento em mais de 30 dias',
  },
};
