import { JudicialRequest, RequestFilters } from '../types/request';
import { AuditService } from './auditService';
import { User } from '../types/user';
import { STATUS_CONFIG } from '../data/constants';
import { calculatePriority } from './deadlineService';

function escapeCsv(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

function formatDatePtBR(dateString?: string): string {
  if (!dateString) return '-';
  const parts = dateString.split('T')[0].split('-');
  if (parts.length !== 3) return dateString;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export interface ReportSummaryOptions {
  filters: RequestFilters;
  totalFiltered: number;
  totalAll: number;
  currentUser?: User;
}

export class ReportService {
  /**
   * Exporta a lista de requisições filtradas em formato CSV
   * Delimitador por ponto e vírgula com UTF-8 BOM para perfeita abertura no Excel em Português
   */
  static exportToCSV(
    requests: JudicialRequest[],
    options: ReportSummaryOptions
  ): void {
    const cabecalho = [
      'Nº Processo',
      'Protocolo',
      'REP',
      'Setor Solicitante',
      'Tipo de Exame',
      'Origem / Juízo',
      'Partes Envolvidas',
      'Prazo Limite',
      'Tipo de Prazo',
      'Status Operacional',
      'Prioridade',
      'Data de Cadastro',
      'Qtd. Anexos',
      'Descrição / Objeto',
    ];

    const linhas = requests.map((req) => {
      const statusLabel = STATUS_CONFIG[req.status]?.label || req.status;
      const prioridadeEfetiva = calculatePriority(
        req.prazoJudicial,
        req.status,
        req.prioridadeManual
      ).prioridadeEfetiva;

      return [
        escapeCsv(req.numeroProcesso),
        escapeCsv(req.protocolo || '-'),
        escapeCsv(req.rep || '-'),
        escapeCsv(req.setorSolicitante),
        escapeCsv(req.tipoExame),
        escapeCsv(req.origem || '-'),
        escapeCsv(req.acusadoVitima || '-'),
        escapeCsv(formatDatePtBR(req.prazoJudicial)),
        escapeCsv(
          req.tipoPrazo === 'interno' || req.temPrazoJudicial === false
            ? 'Sem Prazo Judicial'
            : 'Prazo Judicial'
        ),
        escapeCsv(statusLabel),
        escapeCsv(prioridadeEfetiva),
        escapeCsv(formatDatePtBR(req.criadoEm)),
        escapeCsv(req.anexos?.length || 0),
        escapeCsv(req.descricao || '-'),
      ];
    });

    const csvContent =
      '\uFEFF' +
      [cabecalho.join(';'), ...linhas.map((l) => l.join(';'))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
    link.download = `prazojus_requisicoes_${dateStr}_${timeStr}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Auditoria automática de exportação de dados
    if (options.currentUser) {
      const activeList: string[] = [];
      if (options.filters.busca) activeList.push(`Busca: "${options.filters.busca}"`);
      if (options.filters.setor) activeList.push(`Setor: ${options.filters.setor}`);
      if (options.filters.tipoExame) activeList.push(`Exame: ${options.filters.tipoExame}`);
      if (options.filters.origem) activeList.push(`Origem: ${options.filters.origem}`);
      if (options.filters.status) activeList.push(`Status: ${options.filters.status}`);
      if (options.filters.tipoPrazo) {
        activeList.push(
          options.filters.tipoPrazo === 'judicial' ? 'Tipo: Prazo Judicial' : 'Tipo: Sem Prazo Judicial'
        );
      }
      if (options.filters.dataInicio) activeList.push(`De: ${formatDatePtBR(options.filters.dataInicio)}`);
      if (options.filters.dataFim) activeList.push(`Até: ${formatDatePtBR(options.filters.dataFim)}`);

      const filtrosTexto =
        activeList.length > 0
          ? activeList.join(' • ')
          : 'Todos os registros (Sem filtros restritivos)';

      AuditService.log({
        modulo: 'requisicoes',
        acao: 'backup',
        descricao: `Exportação de ${requests.length} requisição(ões) filtrada(s) em planilha CSV.`,
        usuario: options.currentUser,
        usuarioId: options.currentUser.id,
        usuarioNome: options.currentUser.nome,
        usuarioRole: options.currentUser.role,
        usuarioMatricula: options.currentUser.matricula,
        status: 'sucesso',
        metadados: {
          totalRegistros: requests.length,
          formato: 'Planilha CSV (Excel)',
          filtrosAtivos: filtrosTexto,
        },
      });
    }
  }

  /**
   * Gera um relatório executivo impresso/PDF oficial da Polícia Científica de Alagoas (POLCAL)
   * Abrindo a interface nativa de impressão/salvamento em PDF com papel timbrado oficial
   */
  static exportToPDF(
    requests: JudicialRequest[],
    options: ReportSummaryOptions
  ): void {
    const { filters, currentUser } = options;
    const now = new Date();
    const dataHoraEmissao = now.toLocaleString('pt-BR');
    const authCode = `PJ-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const logoUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/policia-cientifica-logo.png`
        : '/policia-cientifica-logo.png';

    // Descrever filtros ativos
    const activeFiltersList: { label: string; value: string }[] = [];
    if (filters.busca) activeFiltersList.push({ label: 'Busca Textual', value: `"${filters.busca}"` });
    if (filters.setor) activeFiltersList.push({ label: 'Setor Requisitante', value: filters.setor });
    if (filters.tipoExame) activeFiltersList.push({ label: 'Tipo de Exame', value: filters.tipoExame });
    if (filters.origem) activeFiltersList.push({ label: 'Origem / Vara', value: filters.origem });
    if (filters.status) activeFiltersList.push({ label: 'Status Operacional', value: filters.status });
    if (filters.tipoPrazo) {
      activeFiltersList.push({
        label: 'Regra de Prazo',
        value: filters.tipoPrazo === 'judicial' ? 'Prazo Judicial Determinado' : 'Sem Prazo Judicial Expresso',
      });
    }
    if (filters.dataInicio) activeFiltersList.push({ label: 'Prazo A Partir De', value: formatDatePtBR(filters.dataInicio) });
    if (filters.dataFim) activeFiltersList.push({ label: 'Prazo Até', value: formatDatePtBR(filters.dataFim) });

    const filtrosTagsHtml =
      activeFiltersList.length > 0
        ? activeFiltersList
            .map(
              (f) =>
                `<span style="display: inline-block; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 8px; font-size: 10px; margin: 2px 4px 2px 0;"><strong>${f.label}:</strong> ${f.value}</span>`
            )
            .join(' ')
        : `<span style="color: #64748b; font-size: 10.5px; font-style: italic;">Todos os registros cadastrados (Nenhum critério restritivo aplicado)</span>`;

    // Construção das linhas da tabela
    const rowsHtml = requests
      .map((req, idx) => {
        const isInterno = req.tipoPrazo === 'interno' || req.temPrazoJudicial === false;
        const tipoPrazoLabel = isInterno ? 'Sem Prazo' : 'Judicial';
        const tipoPrazoClass = isInterno
          ? 'color: #475569; background-color: #f1f5f9; border: 1px solid #cbd5e1;'
          : 'color: #1e40af; background-color: #dbeafe; border: 1px solid #bfdbfe; font-weight: bold;';

        // 1. Status padrão unificado do sistema (Não iniciado, Iniciado, Concluído, Vencido)
        const statusConfig = STATUS_CONFIG[req.status] || STATUS_CONFIG.Pendente;
        const statusLabel = statusConfig.label;

        let statusStyle = 'color: #334155; background-color: #f1f5f9; border: 1px solid #cbd5e1;';
        if (req.status === 'Concluído') {
          statusStyle = 'color: #166534; background-color: #dcfce7; border: 1px solid #bbf7d0;';
        } else if (req.status === 'Vencido') {
          statusStyle = 'color: #991b1b; background-color: #fee2e2; border: 1px solid #fecaca;';
        } else if (statusLabel === 'Iniciado') {
          statusStyle = 'color: #0369a1; background-color: #e0f2fe; border: 1px solid #bae6fd;';
        } else if (statusLabel === 'Não iniciado') {
          statusStyle = 'color: #475569; background-color: #f1f5f9; border: 1px solid #cbd5e1;';
        }

        // 2. Prioridade de todos os processos (calculada dinamicamente pelo prazo + manual)
        const prioInfo = calculatePriority(req.prazoJudicial, req.status, req.prioridadeManual);
        const prioLabel = prioInfo.prioridadeEfetiva;
        let prioStyle = 'color: #475569; background-color: #f8fafc; border: 1px solid #e2e8f0;';

        if (req.status === 'Concluído') {
          prioStyle = 'color: #166534; background-color: #f0fdf4; border: 1px solid #bbf7d0;';
        } else if (prioLabel === 'Urgente') {
          prioStyle = 'color: #991b1b; background-color: #fef2f2; border: 1px solid #fecaca; font-weight: 700;';
        } else if (prioLabel === 'Alta') {
          prioStyle = 'color: #c2410c; background-color: #fff7ed; border: 1px solid #fed7aa; font-weight: 600;';
        } else if (prioLabel === 'Média') {
          prioStyle = 'color: #1d4ed8; background-color: #eff6ff; border: 1px solid #bfdbfe; font-weight: 600;';
        } else {
          prioStyle = 'color: #475569; background-color: #f8fafc; border: 1px solid #e2e8f0;';
        }

        const zebraBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';

        return `
          <tr style="background-color: ${zebraBg}; border-bottom: 1px solid #e2e8f0; font-size: 10px; page-break-inside: avoid; break-inside: avoid;">
            <td style="padding: 4px 6px; text-align: center; color: #64748b; font-family: monospace;">${idx + 1}</td>
            <td style="padding: 4px 6px;">
              <div style="font-weight: 700; color: #0f172a; font-family: monospace; font-size: 10.5px;">${req.numeroProcesso}</div>
              <div style="font-size: 9px; color: #64748b; font-family: monospace; margin-top: 1px;">
                ${req.protocolo ? `Prot: ${req.protocolo}` : ''} ${req.rep ? `• REP: ${req.rep}` : ''}
              </div>
            </td>
            <td style="padding: 4px 6px;">
              <div style="font-weight: 600; color: #1e293b; font-size: 10px;">${req.tipoExame}</div>
              <div style="font-size: 9px; color: #64748b;">${req.setorSolicitante}</div>
            </td>
            <td style="padding: 4px 6px; color: #334155; max-width: 190px; line-height: 1.25; font-size: 9.5px;">
              ${req.origem || '-'}
            </td>
            <td style="padding: 4px 6px; white-space: nowrap;">
              <div style="font-weight: 700; font-family: monospace; color: #0f172a; font-size: 10.5px;">${formatDatePtBR(req.prazoJudicial)}</div>
              <span style="display: inline-block; padding: 1px 4px; border-radius: 3px; font-size: 8.5px; margin-top: 1px; ${tipoPrazoClass}">
                ${tipoPrazoLabel}
              </span>
            </td>
            <td style="padding: 4px 6px; white-space: nowrap;">
              <span style="display: inline-block; padding: 1.5px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; ${statusStyle}">
                ${statusLabel}
              </span>
            </td>
            <td style="padding: 4px 6px; text-align: center; white-space: nowrap;">
              <span style="display: inline-block; padding: 1.5px 6px; border-radius: 4px; font-size: 9px; ${prioStyle}">
                ${prioLabel}
              </span>
            </td>
          </tr>
        `;
      })
      .join('');

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>PrazoJus - Relatório de Requisições e Prazos Judiciais - POLCAL</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 6mm 8mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f1f5f9;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .screen-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #0f172a;
      color: #ffffff;
      padding: 8px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .screen-toolbar-title {
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .screen-toolbar-badge {
      background: #1e3a8a;
      color: #93c5fd;
      font-size: 10.5px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 500;
    }
    .screen-toolbar-actions {
      display: flex;
      gap: 10px;
    }
    .btn-print {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      background: #2563eb;
      hover-background: #1d4ed8;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .btn-close {
      padding: 7px 12px;
      background: #334155;
      color: #e2e8f0;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .document-container {
      max-width: 1240px;
      margin: 14px auto 30px auto;
      background: #ffffff;
      padding: 16px 22px 18px 22px;
      border-radius: 6px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border: 1px solid #cbd5e1;
    }
    .timbrado-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 6px;
    }
    .timbrado-brand {
      display: flex;
      align-items: center;
      gap: 14px;
      flex: 1;
    }
    .timbrado-logo {
      height: 52px;
      width: auto;
      object-fit: contain;
      filter: drop-shadow(0 2px 3px rgba(0,0,0,0.1));
      flex-shrink: 0;
    }
    .timbrado-titles {
      text-align: left;
    }
    .timbrado-state {
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #334155;
      line-height: 1.15;
    }
    .timbrado-sec {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #475569;
      margin-top: 1px;
      line-height: 1.15;
    }
    .timbrado-polcal {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: #0f172a;
      margin-top: 1px;
      line-height: 1.15;
    }
    .timbrado-doc-title {
      font-size: 12px;
      font-weight: 800;
      color: #1e3a8a;
      margin-top: 3px;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      line-height: 1.2;
    }
    .timbrado-meta {
      text-align: right;
      font-size: 9.5px;
      line-height: 1.4;
      color: #475569;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .timbrado-meta strong {
      color: #0f172a;
      font-weight: 700;
    }
    .decorative-bar {
      height: 2.5px;
      background: #1e3a8a;
      border-bottom: 1px solid #d97706;
      margin-bottom: 8px;
    }
    .filter-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #1e3a8a;
      border-radius: 4px;
      padding: 5px 10px;
      margin-bottom: 8px;
      font-size: 9px;
    }
    .filter-card-header {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #1e3a8a;
      margin-bottom: 3px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      border: 1px solid #cbd5e1;
      page-break-inside: auto;
    }
    th {
      background-color: #0f172a;
      color: #ffffff;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 6px 6px;
      font-weight: 700;
      border-right: 1px solid #334155;
    }
    th:last-child {
      border-right: none;
    }
    .footer-timbrado {
      margin-top: 10px;
      padding-top: 6px;
      border-top: 1px solid #cbd5e1;
      font-size: 8.5px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
      line-height: 1.35;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .footer-stamp {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      color: #0f172a;
    }

    @media print {
      html, body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .screen-toolbar {
        display: none !important;
      }
      .document-container {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }
      table {
        page-break-inside: auto;
      }
      tr {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .footer-timbrado {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="screen-toolbar">
    <div class="screen-toolbar-title">
      <span>Polícia Científica de Alagoas — PrazoJus</span>
      <span class="screen-toolbar-badge">Visualização de Impressão • A4 Paisagem</span>
    </div>
    <div class="screen-toolbar-actions">
      <button class="btn-print" onclick="window.print()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        Imprimir / Salvar como PDF
      </button>
      <button class="btn-close" onclick="window.close()">Fechar</button>
    </div>
  </div>

  <div class="document-container">
    <!-- Cabeçalho Timbrado Oficial Alinhado à Esquerda -->
    <div class="timbrado-header">
      <div class="timbrado-brand">
        <img
          id="polcal-logo"
          src="${logoUrl}"
          alt="Polícia Científica de Alagoas"
          class="timbrado-logo"
          onerror="this.style.display='none'"
        />
        <div class="timbrado-titles">
          <div class="timbrado-state">Estado de Alagoas</div>
          <div class="timbrado-sec">Secretaria de Estado da Segurança Pública</div>
          <div class="timbrado-polcal">Polícia Científica de Alagoas — POLCAL</div>
          <div class="timbrado-doc-title">Relatório de Gestão de Requisições e Prazos Judiciais</div>
        </div>
      </div>
      <div class="timbrado-meta">
        <div><strong>Emissão:</strong> ${dataHoraEmissao}</div>
        <div><strong>Operador:</strong> ${currentUser ? currentUser.nome : 'Usuário do Sistema'}</div>
        <div><strong>Perfil:</strong> ${currentUser ? currentUser.role : 'Sistema'}</div>
        <div><strong>Listados:</strong> ${requests.length} de ${options.totalAll} autos</div>
      </div>
    </div>

    <div class="decorative-bar"></div>

    <div class="filter-card">
      <div class="filter-card-header">Critérios e Parâmetros da Consulta (Filtros Ativos)</div>
      <div>${filtrosTagsHtml}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 28px; text-align: center;">#</th>
          <th style="width: 175px;">Processo / Protocolo</th>
          <th style="width: 165px;">Exame / Setor</th>
          <th>Origem / Órgão Requisitante</th>
          <th style="width: 105px;">Prazo Limite</th>
          <th style="width: 95px;">Status</th>
          <th style="width: 70px; text-align: center;">Prioridade</th>
        </tr>
      </thead>
      <tbody>
        ${
          rowsHtml ||
          `<tr><td colspan="7" style="padding: 24px; text-align: center; color: #64748b; font-size: 11px;">Nenhuma requisição atende aos filtros aplicados.</td></tr>`
        }
      </tbody>
    </table>

    <div class="footer-timbrado">
      <div>
        <div class="footer-stamp">POLÍCIA CIENTÍFICA DO ESTADO DE ALAGOAS — POLCAL</div>
        <div>Rua do Sol, 290 - Centro, Maceió - AL, 57020-070 • PrazoJus</div>
      </div>
      <div style="text-align: right;">
        <div>Documento oficial expedido eletronicamente para fins de instrução pericial.</div>
        <div>Página 1 de 1</div>
      </div>
    </div>
  </div>

  <script>
    window.addEventListener('load', () => {
      const logoImg = document.getElementById('polcal-logo');
      if (logoImg && !logoImg.complete) {
        logoImg.onload = () => {
          setTimeout(() => window.print(), 350);
        };
        logoImg.onerror = () => {
          setTimeout(() => window.print(), 350);
        };
      } else {
        setTimeout(() => window.print(), 400);
      }
    });
  </script>
</body>
</html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }

    // Auditoria automática de geração de relatório PDF
    if (currentUser) {
      const filtrosTexto =
        activeFiltersList.length > 0
          ? activeFiltersList.map((f) => `${f.label}: ${f.value}`).join(' • ')
          : 'Todos os registros (Sem filtros restritivos)';

      AuditService.log({
        modulo: 'requisicoes',
        acao: 'documento',
        descricao: `Emissão de Relatório em PDF com ${requests.length} requisição(ões) filtrada(s).`,
        usuario: currentUser,
        usuarioId: currentUser.id,
        usuarioNome: currentUser.nome,
        usuarioRole: currentUser.role,
        usuarioMatricula: currentUser.matricula,
        status: 'sucesso',
        metadados: {
          totalRegistros: requests.length,
          formato: 'Documento PDF Oficial',
          filtrosAtivos: filtrosTexto,
        },
      });
    }
  }
}
