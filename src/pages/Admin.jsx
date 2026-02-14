import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';

export default function Admin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr('');

      const { data, error } = await supabase
        .from('movements_report')
        .select('*')
        .order('event_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error(error);
        setErr('Erro ao carregar relatório.');
        setRows([]);
      } else {
        setRows(data || []);
      }

      setLoading(false);
    };

    run();
  }, []);

  const exportPDF = () => {
    if (!rows.length) return;

    const html = `
      <html>
        <head>
          <title>Relatório de Movimentações</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { font-size: 18px; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
            @page { size: A4 landscape; margin: 12mm; }
          </style>
        </head>
        <body>
          <h1>Relatório de Movimentações</h1>
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Direção</th>
                <th>Tipo</th>
                <th>Código</th>
                <th>Destino</th>
                <th>Registrado por</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((r) => {
                const when = r.event_at ? new Date(r.event_at).toLocaleString('pt-BR') : '';
                const direction = (r.direction || r.type || '').toString();
                const subjectType = (r.subject_type || '').toString();
                const code = (r.subject_code || '').toString();
                const destination = (r.destination || '').toString();
                const staff = `${r.staff_full_name || '-'} (${r.staff_rg || '-'})`;
                return `
                  <tr>
                    <td>${when}</td>
                    <td>${direction}</td>
                    <td>${subjectType}</td>
                    <td>${code}</td>
                    <td>${destination}</td>
                    <td>${staff}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <script>
            window.onload = () => window.print();
          </script>
        </body>
      </html>
    `;

    const w = window.open('', '_blank');
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  if (loading) return <div className="p-4 text-center">Carregando...</div>;
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Relatório (Admin)</h2>

        <Button variant="primary" className="!w-auto" onClick={exportPDF}>
          Exportar PDF
        </Button>
      </div>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3 text-left">Data/Hora</th>
              <th className="p-3 text-left">Direção</th>
              <th className="p-3 text-left">Tipo</th>
              <th className="p-3 text-left">Código</th>
              <th className="p-3 text-left">Destino</th>
              <th className="p-3 text-left">Registrado por</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  {r.event_at ? new Date(r.event_at).toLocaleString('pt-BR') : ''}
                </td>
                <td className="p-3 font-semibold">{r.direction || r.type}</td>
                <td className="p-3">{r.subject_type}</td>
                <td className="p-3 font-medium">{r.subject_code}</td>
                <td className="p-3">{r.destination}</td>
                <td className="p-3">
                  {(r.staff_full_name || '-') + ' (' + (r.staff_rg || '-') + ')'}
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={6}>
                  Sem registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
