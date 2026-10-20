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
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200',
    dotClass: 'bg-emerald-500',
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
    bgClass: 'bg-[#FCD5D1]/50',
    textClass: 'text-[#97171B]',
    borderClass: 'border-[#FA9C93]',
    badgeClass: 'bg-[#FCD5D1] text-[#97171B] border-[#FA9C93]',
    barColor: '#D12429',
    desc: 'Vencido ou com vencimento em até 24 horas',
  },
  Alta: {
    label: 'Alta',
    bgClass: 'bg-[#EFDD51]/20',
    textClass: 'text-[#554E17]',
    borderClass: 'border-[#C5B641]',
    badgeClass: 'bg-[#EFDD51]/30 text-[#554E17] border-[#C5B641]',
    barColor: '#C5B641',
    desc: 'Vencimento entre 2 e 3 dias',
  },
  Média: {
    label: 'Média',
    bgClass: 'bg-[#C9D7EE]/40',
    textClass: 'text-[#274578]',
    borderClass: 'border-[#95B1DE]',
    badgeClass: 'bg-[#C9D7EE]/60 text-[#122443] border-[#95B1DE]',
    barColor: '#274578',
    desc: 'Vencimento entre 4 e 7 dias',
  },
  Baixa: {
    label: 'Baixa',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-200',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    barColor: '#797C7A',
    desc: 'Vencimento em mais de 7 dias',
  },
};
