import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function generateReportPDF(movements, periodStart, periodEnd) {
    const doc = new jsPDF('landscape', 'pt', 'a4'); // Paisagem para caber mais colunas
    
    // Título e Período
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DE SERVIÇO - CONTROLE DE ACESSO', doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const startStr = format(periodStart, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    const endStr = format(periodEnd, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    doc.text(`Período do Relatório: ${startStr} até ${endStr}`, doc.internal.pageSize.getWidth() / 2, 60, { align: 'center' });

    // Preparar dados da Tabela
    const tableData = movements.length > 0 ? movements.map(m => {
        const eventDate = new Date(m.event_at);
        const createdDate = new Date(m.created_at);
        const diffMin = Math.round((createdDate - eventDate) / 60000);

        return [
            format(eventDate, "dd/MM/yy HH:mm"),
            m.direction === 'ENTRY' ? 'ENTRADA' : 'SAÍDA',
            m.subject_type === 'EXTERNAL_VTR' ? 'VTR EXT' : m.subject_type,
            m.subject_code,
            `${m.driver_name || m.person_name || '-'} / ${m.person_doc || '-'}`,
            m.destination || '-',
            m.staff_full_name ? `${m.staff_full_name.split(' ')[0]} (${m.staff_rg || 'S/RG'})` : 'Sist.',
            diffMin > 5 ? `RET (+${diffMin}m)` : "OK"
        ];
    }) : [["-", "-", "-", "Nenhuma movimentação encontrada", "-", "-", "-", "-"]];

    // Desenhar Tabela
    doc.autoTable({
        startY: 80,
        head: [["Data/Hora", "Ação", "Tipo", "ID/Placa", "Condutor/Pessoa", "Destino", "Resp.", "Status"]],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        margin: { top: 80, bottom: 100 } // Margem inferior para assinaturas
    });

    // Campos de Assinatura (Rodapé)
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const finalY = doc.lastAutoTable.finalY;
    
    // Se a tabela terminar muito perto do fim, adiciona nova página
    let signY = finalY + 80;
    if (signY > pageHeight - 50) {
        doc.addPage();
        signY = 80; // Topo da nova página
    }

    doc.setFontSize(10);
    
    // Assinatura 1 (Esquerda)
    doc.line(40, signY, 240, signY);
    doc.text('Oficial de Dia', 140, signY + 15, { align: 'center' });
    
    // Assinatura 2 (Centro)
    doc.line(pageWidth / 2 - 100, signY, pageWidth / 2 + 100, signY);
    doc.text('Comandante da Guarda', pageWidth / 2, signY + 15, { align: 'center' });

    // Assinatura 3 (Direita)
    doc.line(pageWidth - 240, signY, pageWidth - 40, signY);
    doc.text('Adjunto ao Oficial de Dia', pageWidth - 140, signY + 15, { align: 'center' });

    // Informação de geração
    doc.setFontSize(8);
    doc.text(`Gerado por: Sistema de Controle - ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 40, pageHeight - 20);

    // Salvar o arquivo
    const fileName = `Relatorio_Servico_${format(periodStart, "yyyy-MM-dd")}.pdf`;
    doc.save(fileName);
}
