import React from 'react';
import { RequestAttachment } from '../../types/request';
import { Modal } from '../layout/Modal';
import { ATTACHMENT_TYPE_CONFIG } from './AttachmentSection';
import {
  Download,
  ExternalLink,
  FileText,
  Printer,
  ShieldCheck,
  Building2,
  Calendar,
  User,
  Scale,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface PdfPreviewModalProps {
  attachment: RequestAttachment | null;
  isOpen: boolean;
  onClose: () => void;
  processNumber?: string;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  attachment,
  isOpen,
  onClose,
  processNumber = '0003892-14.2026.8.02.0001',
}) => {
  const { info, success } = useToast();

  if (!attachment || !isOpen) return null;

  const cfg = ATTACHMENT_TYPE_CONFIG[attachment.tipo] || ATTACHMENT_TYPE_CONFIG.outro;
  const Icon = cfg.icon;

  const handleDownload = () => {
    if (attachment.url) {
      const a = document.createElement('a');
      a.href = attachment.url;
      a.download = attachment.nome;
      a.click();
      success('Download Iniciado', `Baixando "${attachment.nome}".`);
    } else {
      // Simular download gerando um blob de texto/pdf
      const content = `%PDF-1.4\n% Simulação oficial de ${attachment.nome}\nProcesso: ${processNumber}\nTipo: ${cfg.label}\nData: ${new Date(attachment.dataUpload).toLocaleString('pt-BR')}`;
      const blob = new Blob([content], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.nome;
      a.click();
      URL.revokeObjectURL(url);
      success('Download Concluído', `Arquivo "${attachment.nome}" salvo.`);
    }
  };

  const handlePrint = () => {
    // 1. Caso o anexo possua uma URL de PDF real (Base64 data URL, Blob URL ou HTTP)
    if (attachment.url) {
      const existingIframe = document.getElementById('pdf-preview-iframe') as HTMLIFrameElement;
      if (existingIframe && existingIframe.contentWindow) {
        try {
          existingIframe.contentWindow.focus();
          existingIframe.contentWindow.print();
          return;
        } catch {
          // Continua para criação de iframe temporário
        }
      }

      try {
        const printIframe = document.createElement('iframe');
        printIframe.style.position = 'fixed';
        printIframe.style.right = '0';
        printIframe.style.bottom = '0';
        printIframe.style.width = '0';
        printIframe.style.height = '0';
        printIframe.style.border = '0';
        printIframe.src = attachment.url;
        document.body.appendChild(printIframe);

        printIframe.onload = () => {
          setTimeout(() => {
            try {
              printIframe.contentWindow?.focus();
              printIframe.contentWindow?.print();
            } catch {
              window.open(attachment.url, '_blank');
            }
            setTimeout(() => {
              if (document.body.contains(printIframe)) {
                document.body.removeChild(printIframe);
              }
            }, 5000);
          }, 350);
        };
        return;
      } catch {
        window.open(attachment.url, '_blank');
        return;
      }
    }

    // 2. Caso seja um documento processual simulado / renderizado
    // Extrai o conteúdo do elemento e imprime exclusivamente a folha do documento em A4
    const docElement = document.getElementById('printable-document-content');
    if (!docElement) {
      window.print();
      return;
    }

    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    document.body.appendChild(printIframe);

    const frameDoc = printIframe.contentWindow?.document;
    if (!frameDoc) {
      window.print();
      return;
    }

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>${attachment.nome}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm 20mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 0;
              font-size: 11pt;
              line-height: 1.6;
            }
            img {
              max-width: 100%;
              display: inline-block;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-justify { text-align: justify; }
            .font-bold { font-weight: bold; }
            .font-extrabold { font-weight: 800; }
            .font-semibold { font-weight: 600; }
            .font-mono { font-family: monospace; }
            .font-sans { font-family: Arial, Helvetica, sans-serif; }
            .font-serif { font-family: 'Times New Roman', Times, serif; }
            .uppercase { text-transform: uppercase; }
            .border-b { border-bottom: 1px solid #cbd5e1; }
            .border-t { border-top: 1px solid #cbd5e1; }
            .pb-5 { padding-bottom: 1.25rem; }
            .pb-3 { padding-bottom: 0.75rem; }
            .pt-4 { padding-top: 1rem; }
            .mb-1 { margin-bottom: 0.25rem; }
            .space-y-2 > * + * { margin-top: 0.5rem; }
            .space-y-4 > * + * { margin-top: 1rem; }
            .space-y-6 > * + * { margin-top: 1.5rem; }
            .tracking-widest { letter-spacing: 0.1em; }
            .tracking-wide { letter-spacing: 0.05em; }
            .text-xs { font-size: 0.75rem; }
            .text-sm { font-size: 0.875rem; }
            .text-emerald-600 { color: #059669; }
            .text-slate-500 { color: #64748b; }
            .text-slate-700 { color: #334155; }
            .text-slate-900 { color: #0f172a; }
            .w-16 { width: 4rem; }
            .h-16 { height: 4rem; }
            .w-5 { width: 1.25rem; }
            .h-5 { height: 1.25rem; }
            .object-contain { object-fit: contain; }
            .flex { display: flex; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .justify-center { justify-content: center; }
            .gap-2 { gap: 0.5rem; }
            .gap-3 { gap: 0.75rem; }
            .leading-relaxed { line-height: 1.625; }
            .bg-emerald-50 { background-color: #ecfdf5; }
            .border-emerald-300 { border-color: #6ee7b7; }
            .p-3 { padding: 0.75rem; }
            .rounded-lg { border-radius: 0.5rem; }
            .text-emerald-950 { color: #022c22; }
          </style>
        </head>
        <body>
          <div style="max-width: 100%; margin: 0 auto;">
            ${docElement.innerHTML}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      printIframe.contentWindow?.focus();
      printIframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe);
        }
      }, 5000);
    }, 400);
  };

  const handleOpenNewTab = () => {
    if (attachment.url) {
      const win = window.open();
      if (win) {
        win.document.write(
          `<iframe src="${attachment.url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
        );
      }
    } else {
      info('Visualização', 'Exibindo prévia oficial dos autos na tela.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Visualizador de Documento PDF`}
      subtitle={`${attachment.nome} • ${cfg.label}`}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Barra Superior com Informações e Ações */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-100 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2.5 py-1 rounded-md font-semibold border flex items-center gap-1.5 ${cfg.badgeStyle}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cfg.label}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Processo nº {processNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-1 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 flex items-center gap-1 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar PDF</span>
            </button>
          </div>
        </div>

        {/* Área do Documento (Iframe real ou Simulação Oficial) */}
        {attachment.url && attachment.url.startsWith('data:application/pdf') ? (
          <div className="w-full h-[60vh] rounded-lg border border-slate-300 overflow-hidden bg-slate-800">
            <iframe
              id="pdf-preview-iframe"
              src={attachment.url}
              title={attachment.nome}
              className="w-full h-full border-0"
            />
          </div>
        ) : (
          <div
            id="printable-document-content"
            className="w-full max-h-[60vh] overflow-y-auto p-8 rounded-xl border border-slate-300 bg-white shadow-inner font-serif text-slate-900 space-y-6"
          >
            {/* Cabeçalho Oficial do Documento */}
            <div className="text-center border-b border-slate-200 pb-5 space-y-2">
              <div className="flex justify-center mb-1">
                <img
                  src="/policia-cientifica-logo.png"
                  alt="Brasão POLCAL"
                  className="w-16 h-16 object-contain"
                />
              </div>
              <p className="text-xs font-bold tracking-widest text-slate-700 uppercase">
                ESTADO DE ALAGOAS • PODER JUDICIÁRIO / SECRETARIA DE SEGURANÇA PÚBLICA
              </p>
              <p className="text-sm font-extrabold text-[#122443] tracking-wide">
                POLÍCIA CIENTÍFICA DO ESTADO DE ALAGOAS
              </p>
              <p className="text-[11px] text-slate-500">
                Sistema Integrado de Controle de Requisições e Prazos Judiciais — PrazoJus
              </p>
            </div>

            {/* Identificação da Peça */}
            <div className="flex justify-between items-start text-xs border-b border-slate-100 pb-3 font-sans">
              <div>
                <p>
                  <strong>Documento:</strong> {attachment.nome}
                </p>
                <p>
                  <strong>Classificação:</strong> {cfg.label}
                </p>
                <p>
                  <strong>Autos do Processo:</strong> {processNumber}
                </p>
              </div>
              <div className="text-right text-slate-500">
                <p>
                  <strong>Data de Juntada:</strong>{' '}
                  {new Date(attachment.dataUpload).toLocaleDateString('pt-BR')}
                </p>
                <p>
                  <strong>Tamanho:</strong>{' '}
                  {(attachment.tamanho / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>

            {/* Corpo do Documento de Acordo com o Tipo */}
            <div className="text-sm leading-relaxed text-slate-800 space-y-4 font-sans text-justify">
              {attachment.tipo === 'oficio' && (
                <>
                  <p className="font-bold">
                    OFÍCIO Nº {attachment.nome.replace(/\D/g, '').slice(0, 4) || '0492'}/2026 - VARA CRIMINAL
                  </p>
                  <p>
                    A Sua Senhoria o(a) Senhor(a) Diretor(a) do Instituto de Criminalística / Polícia Científica de Alagoas.
                  </p>
                  <p>
                    <strong>Assunto:</strong> Requisição de exame pericial especializado com fixação de prazo processual.
                  </p>
                  <p>
                    Cumprimentando-o(a) cordialmente, venho por meio deste encaminhar os autos do processo criminal em epígrafe para a realização do exame técnico-pericial requisitado, com urgência justificada em razão da tramitação prioritária do feito.
                  </p>
                  <p>
                    Solicita-se a remessa do respectivo Laudo Pericial no prazo assinalado nos autos, instruído com a documentação da cadeia de custódia e conclusões definitivas dos peritos oficiais designados.
                  </p>
                </>
              )}

              {attachment.tipo === 'decisao' && (
                <>
                  <p className="font-bold text-center">
                    DECISÃO INTERLOCUTÓRIA / DETERMINAÇÃO DE PRAZO
                  </p>
                  <p>
                    Vistos etc. Autos nº {processNumber}.
                  </p>
                  <p>
                    Considerando a necessidade impreterível da prova pericial para a formação do convencimento jurisdicional e a iminência de audiência de instrução e julgamento:
                  </p>
                  <p className="bg-amber-50 border-l-4 border-amber-500 p-3 italic">
                    "DETERMINO a intimação com urgência da Polícia Científica de Alagoas para que proceda à conclusão da perícia e encaminhamento do Laudo Pericial aos autos, no prazo improrrogável legalmente assinalado a contar da data de recebimento do expediente."
                  </p>
                  <p>
                    Cumpra-se com as cautelas e prioridade de praxe. Intimem-se as partes e o Ministério Público.
                  </p>
                </>
              )}

              {attachment.tipo === 'email' && (
                <>
                  <p className="font-bold">
                    MENSAGEM DE CORREIO ELETRÔNICO INSTITUCIONAL
                  </p>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1 font-mono">
                    <p><strong>De:</strong> cartorio.criminal@tjal.jus.br</p>
                    <p><strong>Para:</strong> protocolo.pericias@policiacientifica.al.gov.br</p>
                    <p><strong>Assunto:</strong> Solicitação de Informações de Andamento e Laudo - Proc. {processNumber}</p>
                  </div>
                  <p>
                    Prezados Senhores,
                  </p>
                  <p>
                    Por ordem do MM. Juiz de Direito, solicitamos informações quanto à previsão de conclusão do exame pericial relativo aos autos sobreditos, bem como o envio da cópia do laudo preliminar ou definitivo caso já concluído.
                  </p>
                  <p>
                    Atenciosamente,<br />
                    Secretaria da Vara / Cartório Judicial
                  </p>
                </>
              )}

              {attachment.tipo === 'laudo' && (
                <>
                  <p className="font-bold text-center uppercase tracking-wide">
                    LAUDO DE EXAME PERICIAL OFICIAL
                  </p>
                  <p>
                    <strong>Órgão Pericial:</strong> Polícia Científica de Alagoas — Instituto de Criminalística
                  </p>
                  <p>
                    <strong>1. HISTÓRICO:</strong> Em atendimento à requisição expedida pela autoridade competente nos autos do processo nº {processNumber}, procederam os Peritos Oficiais aos exames periciais no vestígio apresentado.
                  </p>
                  <p>
                    <strong>2. DESCRIÇÃO E METODOLOGIA:</strong> O material foi recebido devidamente lacrado com cadeia de custódia preservada. Foram aplicados os protocolos técnico-científicos padronizados pelas normas vigentes.
                  </p>
                  <p>
                    <strong>3. CONCLUSÃO:</strong> Com base nos elementos técnicos observados e registrados, os peritos firmam as conclusões periciais constantes nos anexos fotográficos e analíticos.
                  </p>
                </>
              )}

              {attachment.tipo === 'comprovacao' && (
                <>
                  <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-lg text-xs text-emerald-950 font-bold flex items-center justify-between">
                    <span>DOCUMENTO COMPROBATÓRIO DE CONCLUSÃO PERICIAL</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded uppercase font-extrabold">
                      Cumprimento Integral
                    </span>
                  </div>
                  <p className="font-bold text-center uppercase tracking-wide text-slate-900">
                    CERTIDÃO DE CONCLUSÃO E REMESSA DE LAUDO PERICIAL
                  </p>
                  <p>
                    <strong>Órgão Emitente:</strong> Polícia Científica de Alagoas • Instituto de Criminalística
                  </p>
                  <p>
                    <strong>Referência Processual:</strong> Autos nº {processNumber}
                  </p>
                  <p>
                    Certifico e dou fé que a requisição de exame pericial referente aos autos supramencionados foi devidamente concluída pelos peritos oficiais designados, tendo sido o respectivo Laudo Pericial Oficial emitido e disponibilizado à autoridade judiciária requisitante, instruído com a documentação de cadeia de custódia e registros analíticos.
                  </p>
                  <p>
                    Para constar e produzir os efeitos jurídicos cabíveis perante o Poder Judiciário e o sistema PrazoJus, junta-se o presente comprovante aos autos digitais.
                  </p>
                </>
              )}

              {attachment.tipo === 'outro' && (
                <>
                  <p className="font-bold">
                    DOCUMENTO COMPLEMENTAR INTEGRANTE DOS AUTOS
                  </p>
                  <p>
                    Documento juntado aos autos como elemento instrutório e comprobatório para a requisição nº {processNumber}.
                  </p>
                </>
              )}
            </div>

            {/* Selo de Assinatura e Autenticidade Digital */}
            <div className="border-t border-slate-200 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-sans">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-semibold text-slate-700">Documento Assinado Digitalmente</p>
                  <p className="text-[10px]">Certificação ICP-Brasil • Validade jurídica comprovada</p>
                </div>
              </div>
              <div className="text-right text-[11px] font-mono">
                Hash: SHA256-{(attachment.id + '99a4f').slice(0, 16)}...
              </div>
            </div>
          </div>
        )}

        {/* Rodapé do Modal */}
        <div className="flex justify-between items-center pt-2">
          <p className="text-xs text-slate-400">
            Visualização de documentos do sistema PrazoJus • POLCAL
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};
