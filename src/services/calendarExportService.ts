import { JudicialRequest } from '../types/request';
import { formatDatePtBR } from './deadlineService';

/**
 * Converte data ISO 'YYYY-MM-DD...' ou 'YYYY-MM-DD' para data no formato iCalendar 'YYYYMMDD'.
 */
function toIcsDateOnly(dateStr: string): string {
  const clean = dateStr.split('T')[0].replace(/-/g, '');
  return clean;
}

/**
 * Calcula o dia seguinte no formato 'YYYYMMDD' para fechar o intervalo de evento de dia inteiro.
 * No Google Calendar e RFC 5545 (iCalendar), eventos de dia inteiro cobrem [DTSTART, DTEND).
 * Ex: evento no dia 17/10/2026 tem DTSTART=20261017 e DTEND=20261018.
 */
function getNextDayIcsDateOnly(dateStr: string): string {
  const parts = dateStr.split('T')[0].split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const d = new Date(year, month, day);
  d.setDate(d.getDate() + 1);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

/**
 * Escapa caracteres reservados para o formato iCalendar RFC 5545.
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\n');
}

/**
 * Monta o texto descritivo padronizado do prazo judicial.
 */
export function buildCalendarEventDescription(req: JudicialRequest): string {
  const linhas: string[] = [
    `PRAZO JUDICIAL FATAL — POLÍCIA CIENTÍFICA DE ALAGOAS`,
    `----------------------------------------------------`,
    `Processo: ${req.numeroProcesso}`,
    `Exame Pericial: ${req.tipoExame}`,
    `Setor Solicitante: ${req.setorSolicitante}`,
    `Origem / Juízo: ${req.origem || 'Não informada'}`,
    req.protocolo ? `Protocolo: ${req.protocolo}` : '',
    req.rep ? `REP: ${req.rep}` : '',
    req.acusadoVitima ? `Partes: ${req.acusadoVitima}` : '',
    `Prazo Final: ${formatDatePtBR(req.prazoJudicial)} (Evento de Dia Inteiro)`,
    `Regra de Prazo: ${req.tipoPrazo === 'interno' || req.temPrazoJudicial === false ? 'Sem Prazo Expresso (Meta Interna)' : 'Prazo Judicial Determinado'}`,
    ``,
    `Objeto / Descrição:`,
    `${req.descricao || 'Sem descrição detalhada'}`,
    ``,
    `----------------------------------------------------`,
    `Aviso: Este evento é um registro estático gerado pelo PrazoJus.`,
    `Caso o prazo seja prorrogado nos autos judiciais, atualize seu evento na agenda.`,
  ].filter(Boolean);

  return linhas.join('\n');
}

/**
 * Gera a URL oficial de criação pré-preenchida no Google Agenda (Web & Mobile).
 */
export function generateGoogleCalendarUrl(req: JudicialRequest): string {
  const title = `Prazo judicial — Processo ${req.numeroProcesso}`;
  const startDate = toIcsDateOnly(req.prazoJudicial);
  const endDate = getNextDayIcsDateOnly(req.prazoJudicial);
  const dates = `${startDate}/${endDate}`;
  const details = buildCalendarEventDescription(req);
  const location = `${req.setorSolicitante} — ${req.origem || 'Polícia Científica de Alagoas'}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: dates,
    details: details,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Gera o conteúdo no formato iCalendar universal (.ics, RFC 5545).
 * Compatível com Apple Calendar (iOS/macOS), Microsoft Outlook e Thunderbird.
 */
export function generateIcsContent(req: JudicialRequest): string {
  const title = `Prazo judicial — Processo ${req.numeroProcesso}`;
  const startDate = toIcsDateOnly(req.prazoJudicial);
  const endDate = getNextDayIcsDateOnly(req.prazoJudicial);
  const description = buildCalendarEventDescription(req);
  const location = `${req.setorSolicitante} — ${req.origem || 'Polícia Científica de Alagoas'}`;
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `prazo-${req.id}-${Date.now()}@prazojus.polcal.al.gov.br`;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Policia Cientifica de Alagoas//PrazoJus//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${startDate}`,
    `DTEND;VALUE=DATE:${endDate}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    'STATUS:CONFIRMED',
    'TRANSP:TRANSPARENT',
    // Alarme preventivo 1: 3 dias antes às 09:00
    'BEGIN:VALARM',
    'TRIGGER:-P3D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Atenção: Prazo judicial em 3 dias (${escapeIcsText(req.numeroProcesso)})`,
    'END:VALARM',
    // Alarme preventivo 2: 1 dia antes às 09:00
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Urgente: Prazo judicial vence amanhã (${escapeIcsText(req.numeroProcesso)})`,
    'END:VALARM',
    // Alarme no dia do vencimento
    'BEGIN:VALARM',
    'TRIGGER:-PT0M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Prazo judicial fatal HOJE (${escapeIcsText(req.numeroProcesso)})`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return icsLines.join('\r\n');
}

/**
 * Dispara o download direto do arquivo .ics para o dispositivo do usuário.
 */
export function downloadIcsFile(req: JudicialRequest): void {
  const content = generateIcsContent(req);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const cleanNum = req.numeroProcesso.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = req.prazoJudicial.split('T')[0];

  const link = document.createElement('a');
  link.href = url;
  link.download = `prazo_${cleanNum}_${dateStr}.ics`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
