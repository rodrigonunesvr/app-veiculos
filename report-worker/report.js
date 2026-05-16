import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit-table';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SMTP_USER, // O seu e-mail do Gmail
  SMTP_PASS, // A sua senha de App do Google (16 dígitos)
  REPORT_EMAILS, // Lista de e-mails separados por vírgula
  FROM_EMAIL // Remetente (geralmente o mesmo que SMTP_USER)
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SMTP_USER || !SMTP_PASS) {
  console.error('Faltam variáveis de ambiente (SUPABASE ou SMTP)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Configuração do Transportador SMTP (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

async function generateReport() {
  console.log('Generating daily report for', new Date().toLocaleDateString());

  const endDate = new Date();
  endDate.setHours(8, 0, 0, 0);

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 1);

  // 1. Fetch data from Supabase View
  const { data: movements, error } = await supabase
    .from('movements_report')
    .select('*')
    .gte('event_at', startDate.toISOString())
    .lte('event_at', endDate.toISOString())
    .order('event_at', { ascending: true });

  if (error) {
    console.error('Error fetching movements:', error);
    return;
  }

  console.log(`Found ${movements.length} records.`);

  // 2. Create PDF
  const doc = new PDFDocument({ margin: 30, size: 'A4' });
  let buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  return new Promise((resolve) => {
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });

    doc.fontSize(16).text('RELATÓRIO DE AUDITORIA V5 - CONTROLE DE ACESSO', { align: 'center' });
    doc.fontSize(10).text(`Período de Auditoria: ${startDate.toLocaleString('pt-BR')} até ${endDate.toLocaleString('pt-BR')}`, { align: 'center' });
    doc.moveDown();

    const table = {
      title: "Resumo de Movimentações",
      headers: ["Sistema (Fato)", "Lançamento", "Ação", "Tipo", "ID/Placa", "Condutor/Pessoa", "Destino", "Resp.", "Status"],
      rows: movements.length > 0 ? movements.map(m => {
        const eventDate = new Date(m.event_at);
        const createdDate = new Date(m.created_at);
        const diffMin = Math.round((createdDate - eventDate) / 60000);
        const retroactiveMark = diffMin > 5 ? ` (R: +${diffMin}m)` : "";

        return [
          eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          createdDate.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
          m.direction === 'ENTRY' ? 'ENTRADA' : 'SAÍDA',
          m.subject_type === 'EXTERNAL_VTR' ? 'VTR EXT' : m.subject_type,
          m.subject_code,
          `${m.driver_name || m.person_name || '-'} / ${m.person_doc || '-'}`,
          m.destination || '-',
          m.staff_full_name ? `${m.staff_full_name.split(' ')[0]} (${m.staff_rg || 'S/RG'})` : 'Sist.',
          diffMin > 5 ? `RET (+${diffMin}m)` : "OK"
        ];
      }) : [["-", "-", "-", "-", "Nenhuma movimentação nas últimas 24h", "-", "-", "-", "-"]],
    };

    doc.table(table, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
      prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
        doc.font("Helvetica").fontSize(7);
      },
    });

    doc.end();
  });
}

async function run() {
  try {
    const pdfBuffer = await generateReport();
    const emails = REPORT_EMAILS.split(',').map(e => e.trim());

    const mailOptions = {
      from: FROM_EMAIL || SMTP_USER,
      to: emails,
      subject: `Relatório de Movimentação Diária - ${new Date().toLocaleDateString('pt-BR')}`,
      html: `<strong>Bom dia,</strong><br><br>Segue em anexo o relatório de entrada e saída das últimas 24 horas.<br><br>Sistema de Controle de Acesso`,
      attachments: [
        {
          filename: `relatorio_${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail enviado com sucesso (Gmail):', info.messageId);
    
  } catch (err) {
    console.error('Erro fatal no robô de relatórios:', err);
  }
}

import cron from 'node-cron';

// Run at 08:00 Every Day (Brazil/Brasilia Time)
// Note: Ensure Railway server is set to America/Sao_Paulo or adjust the cron string
cron.schedule('0 8 * * *', () => {
  console.log('Cron Triggered: Sending daily report...');
  run();
}, {
  timezone: "America/Sao_Paulo"
});

console.log('Report Worker started. Scheduled for 08:00 daily.');
// Run once on startup for testing (Optional)
// run();
