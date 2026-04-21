import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit-table';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  RESEND_API_KEY,
  REPORT_EMAILS, // Comma separated emails
  FROM_EMAIL = 'onboarding@resend.dev'
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(RESEND_API_KEY);

async function generateReport() {
  console.log('Generating daily report for', new Date().toLocaleDateString());

  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);

  // 1. Fetch data from Supabase View
  const { data: movements, error } = await supabase
    .from('movements_report')
    .select('*')
    .gte('event_at', yesterday.toISOString())
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

    doc.fontSize(16).text('Relatório Diário de Movimentação - Controle de Acesso', { align: 'center' });
    doc.fontSize(10).text(`Período: ${yesterday.toLocaleString('pt-BR')} até ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
    doc.moveDown();

    const table = {
      title: "Resumo de Acessos",
      headers: ["Ocorrência", "Sistema", "Ação", "Tipo", "ID/Placa", "Condutor/Pessoa", "Destino", "Responsável"],
      rows: movements.map(m => [
        new Date(m.event_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        m.direction === 'ENTRY' ? 'ENTRADA' : 'SAÍDA',
        m.subject_type === 'EXTERNAL_VTR' ? 'VTR EXTERNA' : m.subject_type,
        m.subject_code,
        m.driver_name || m.person_name || '-',
        m.destination || '-',
        m.staff_full_name || 'Sistema'
      ]),
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

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: emails,
      subject: `Relatório de Movimentação Diária - ${new Date().toLocaleDateString('pt-BR')}`,
      html: `<strong>Bom dia,</strong><br><br>Segue em anexo o relatório de entrada e saída das últimas 24 horas.<br><br>Sistema de Controle de Acesso`,
      attachments: [
        {
          filename: `relatorio_${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent successfully!', data);
    }
  } catch (err) {
    console.error('Fatal error in report worker:', err);
  }
}

import cron from 'node-cron';

// Run at 07:30 Every Day (Brazil/Brasilia Time)
// Note: Ensure Railway server is set to America/Sao_Paulo or adjust the cron string
cron.schedule('30 7 * * *', () => {
  console.log('Cron Triggered: Sending daily report...');
  run();
}, {
  timezone: "America/Sao_Paulo"
});

console.log('Report Worker started. Scheduled for 07:30 daily.');
// Run once on startup for testing (Optional)
// run();
