import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';

export default function Admin() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('vehicle_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Erro ao buscar eventos:', error);
      setEvents([]);
    } else {
      setEvents(data || []);
    }

    setLoading(false);
  };

  const exportCSV = () => {
    if (!events.length) return;

    const headers = ['Placa', 'Condutor', 'Entrada', 'Saída'];

    const rows = events.map((e) => [
      e.plate,
      e.driver_name,
      new Date(e.entry_at).toLocaleString('pt-BR'),
      e.exit_at ? new Date(e.exit_at).toLocaleString('pt-BR') : 'Em pátio',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const v = String(cell ?? '');
            // escapa aspas e envolve em aspas para CSV correto
            return `"${v.replace(/"/g, '""')}"`;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'relatorio.csv';
    link.click();
  };

  if (loading) return <div className="p-4 text-center">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Relatório</h2>
        <Button variant="outline" className="!w-auto" onClick={exportCSV}>
          Exportar CSV
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3 text-left">Placa</th>
              <th className="p-3 text-left">Condutor</th>
              <th className="p-3 text-left">Entrada</th>
              <th className="p-3 text-left">Saída</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{e.plate}</td>
                <td className="p-3">{e.driver_name}</td>
                <td className="p-3">
                  {new Date(e.entry_at).toLocaleString('pt-BR')}
                </td>
                <td className="p-3">
                  {e.exit_at ? (
                    new Date(e.exit_at).toLocaleString('pt-BR')
                  ) : (
                    <span className="text-green-600 font-bold">No Pátio</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
