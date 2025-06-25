import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { Proposal } from './entities/proposal.entity';

@Injectable()
export class PdfService {
  async generateProposalPdf(proposal: Proposal): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const page = await browser.newPage();
      
      const html = this.generateProposalHtml(proposal);
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        }
      });

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }

  private generateProposalHtml(proposal: Proposal): string {
    const formattedDate = new Date(proposal.validUntil).toLocaleDateString('pt-BR');
    const totalFormatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(proposal.totalValue));

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Proposta - ${proposal.title}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: white;
            }
            
            .container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .header {
                text-align: center;
                margin-bottom: 40px;
                border-bottom: 3px solid #e11d48;
                padding-bottom: 20px;
            }
            
            .logo {
                font-size: 32px;
                font-weight: bold;
                color: #e11d48;
                margin-bottom: 10px;
            }
            
            .company-info {
                color: #666;
                font-size: 14px;
            }
            
            .proposal-title {
                font-size: 28px;
                color: #1f2937;
                margin: 30px 0;
                text-align: center;
            }
            
            .client-info {
                background-color: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
                border-left: 4px solid #e11d48;
            }
            
            .client-info h3 {
                color: #e11d48;
                margin-bottom: 10px;
            }
            
            .scope-section {
                margin-bottom: 30px;
            }
            
            .scope-section h3 {
                color: #1f2937;
                margin-bottom: 15px;
                font-size: 20px;
            }
            
            .scope-content {
                background-color: #f9fafb;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
                white-space: pre-wrap;
            }
            
            .items-section {
                margin-bottom: 30px;
            }
            
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
            }
            
            .items-table th,
            .items-table td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .items-table th {
                background-color: #f3f4f6;
                font-weight: 600;
                color: #374151;
            }
            
            .items-table .value {
                text-align: right;
                font-weight: 500;
            }
            
            .total-section {
                background-color: #fef2f2;
                padding: 20px;
                border-radius: 8px;
                border: 2px solid #e11d48;
                text-align: center;
                margin-bottom: 30px;
            }
            
            .total-value {
                font-size: 28px;
                font-weight: bold;
                color: #e11d48;
            }
            
            .validity {
                background-color: #fef9c3;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #f59e0b;
                margin-bottom: 30px;
            }
            
            .footer {
                text-align: center;
                color: #666;
                font-size: 12px;
                border-top: 1px solid #e5e7eb;
                padding-top: 20px;
                margin-top: 40px;
            }
            
            .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
                text-transform: uppercase;
            }
            
            .status-draft { background-color: #f3f4f6; color: #374151; }
            .status-sent { background-color: #dbeafe; color: #1d4ed8; }
            .status-approved { background-color: #d1fae5; color: #065f46; }
            .status-rejected { background-color: #fee2e2; color: #991b1b; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">CLICK HYPE</div>
                <div class="company-info">
                    Soluções em Marketing Digital<br>
                    Transformando ideias em resultados
                </div>
            </div>

            <h1 class="proposal-title">${proposal.title}</h1>
            
            <div class="client-info">
                <h3>Informações do Cliente</h3>
                <p><strong>Nome:</strong> ${proposal.clientName}</p>
                ${proposal.clientEmail ? `<p><strong>Email:</strong> ${proposal.clientEmail}</p>` : ''}
                <p><strong>Status:</strong> <span class="status-badge status-${proposal.status.toLowerCase()}">${this.getStatusText(proposal.status)}</span></p>
            </div>

            <div class="scope-section">
                <h3>Escopo do Projeto</h3>
                <div class="scope-content">${proposal.scope}</div>
            </div>

            ${proposal.items && proposal.items.length > 0 ? `
            <div class="items-section">
                <h3>Itens da Proposta</h3>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Descrição</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${proposal.items.map(item => `
                        <tr>
                            <td>${item.description}</td>
                            <td class="value">${new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(Number(item.value))}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}

            <div class="total-section">
                <h3>Valor Total da Proposta</h3>
                <div class="total-value">${totalFormatted}</div>
            </div>

            <div class="validity">
                <strong>⏰ Validade da Proposta:</strong> ${formattedDate}
            </div>

            <div class="footer">
                <p>Esta proposta foi gerada automaticamente pela plataforma Click Hype Partners</p>
                <p>Para mais informações, entre em contato conosco</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private getStatusText(status: string): string {
    const statusMap = {
      'DRAFT': 'Rascunho',
      'SENT': 'Enviada',
      'APPROVED': 'Aprovada',
      'REJECTED': 'Rejeitada'
    };
    return statusMap[status] || status;
  }
} 