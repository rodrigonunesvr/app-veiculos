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

  const exportCSV = () => {
    if (!rows.length) return;

    const headers = [
      'Data/Hora',
      'Direção',
      'Tipo',
      'Código',
      'Condutor',
      'Pedestre Nome',
      'Pedestre Doc',
      'Destino',
      'Registrado por',
    ];

    const lines = [
      headers.join(','),
      ...rows.map((r) => {
        const when = r.event_at ? new Date(r.event_at).toLocaleString('pt-BR') : '';
        const direction = r.direction || r.type || '';
        const subjectType = r.subject_type || '';
        const code = r.subject_code || r.vehicle_code || r.plate || '';
        const driver = r.driver_name || '';
        const personName = r.person_name || '';
        const personDoc = r.person_doc || '';
        const destination = r.destination || '';
        const staff = `${r.staff_full_name || ''} (${r.staff_rg || ''})`;

        const row = [when, direction, subjectType, code, driver, personName, personDoc, destination, staff];
        return row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',');
      }),
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'relatorio.csv';
    link.click();
  };

  if (loading) return <div className="p-4 text-center">Carregando...</div>;
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Relatório (Admin)</h2>

        <Button variant="outline" className="!w-auto" onClick={exportCSV}>
          Exportar CSV
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
