import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit-table';
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config();

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  RESEND_API_KEY, // Chave do Resend (re_...)
  REPORT_EMAILS, // Lista de e-mails separados por vírgula
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
  console.error('Faltam variáveis de ambiente (SUPABASE ou RESEND_API_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

    doc.fontSize(16).text('RELATÓRIO DE AUDITORIA V5 - CONTROLE DE ACESSO', { align: 'center' });
    doc.fontSize(10).text(`Período de Auditoria: ${yesterday.toLocaleString('pt-BR')} até ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
    doc.moveDown();

    const table = {
      title: "Resumo de Movimentações",
      headers: ["Sistema (Fato)", "Lançamento", "Ação", "Tipo", "ID/Placa", "Condutor/Pessoa", "Destino", "Resp.", "Status"],
      rows: movements.length > 0 ? movements.map(m => {
        const eventDate = new Date(m.event_at);
        const createdDate = new Date(m.created_at);
        const diffMin = Math.round((createdDate - eventDate) / 60000);

        return [
          eventDate.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }),
          createdDate.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }),
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

    console.log(`Starting individual sending to ${emails.length} recipients...`);
    
    const base64Content = pdfBuffer.toString('base64');

    for (const email of emails) {
      try {
        console.log(`Sending to: ${email}...`);
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: 'Sistema de Controle <onboarding@resend.dev>',
            to: email,
            subject: `Relatório de Movimentação Diária - ${new Date().toLocaleDateString('pt-BR')}`,
            html: `<strong>Bom dia,</strong><br><br>Segue em anexo o relatório de entrada e saída das últimas 24 horas.<br><br>Sistema de Controle de Acesso`,
            attachments: [
              {
                filename: `relatorio_${new Date().toISOString().split('T')[0]}.pdf`,
                content: base64Content,
              },
            ],
          })
        });

        const result = await response.json();

        if (!response.ok) {
          console.error(`Falha no envio para ${email}:`, result.message || result);
        } else {
          console.log(`Sucesso para ${email}! ID:`, result.id);
        }
      } catch (innerErr) {
        console.error(`Erro de conexão ao enviar para ${email}:`, innerErr.message);
      }
    }
    
  } catch (err) {
    console.error('Erro fatal no processamento do robô:', err);
  }
}

// Run at 08:00 Every Day (Brazil/Brasilia Time)
cron.schedule('0 8 * * *', () => {
  console.log('Cron Triggered: Sending daily report...');
  run();
}, {
  timezone: "America/Sao_Paulo"
});

console.log('Report Worker (STABLE FETCH) started. Scheduled for 08:00 daily.');
// Run once on startup for testing
run();
// Trigger redeploy: 15:45
