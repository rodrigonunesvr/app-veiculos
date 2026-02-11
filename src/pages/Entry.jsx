import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Input from '../components/Input';
import Button from '../components/Button';

export default function Entry() {
  const [plate, setPlate] = useState('');
  const [driver, setDriver] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const normalizePlate = (v) =>
    String(v || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 7);

  const handlePlateBlur = async () => {
    const p = normalizePlate(plate);
    if (p.length < 3) return;

    // Auto-fill driver from last record (if exists)
    const { data, error } = await supabase
      .from('vehicles')
      .select('last_driver')
      .eq('plate', p)
      .maybeSingle();

    if (!error && data?.last_driver) setDriver(data.last_driver);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const p = normalizePlate(plate);
    const d = driver?.trim();

    try {
      if (p.length < 7) throw new Error('Placa inválida.');
      if (!d) throw new Error('Informe o condutor.');

      // 1) Check if already inside (exit_at is null)
      const { data: activeList, error: activeErr } = await supabase
        .from('vehicle_events')
        .select('id')
        .eq('plate', p)
        .is('exit_at', null)
        .limit(1);

      if (activeErr) throw activeErr;
      if (activeList && activeList.length > 0) {
        throw new Error('Veículo já está no pátio!');
      }

      // 2) Ensure vehicle exists (upsert)
      const { error: upsertErr } = await supabase.from('vehicles').upsert(
        {
          plate: p,
          last_driver: d,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'plate' }
      );
      if (upsertErr) throw upsertErr;

      // 3) Insert event
      const { error: insertError } = await supabase.from('vehicle_events').insert({
        plate: p,
        driver_name: d,
      });
      if (insertError) throw insertError;

      navigate('/');
    } catch (err) {
      setError(err?.message || 'Erro ao registrar entrada.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4 text-green-700">Registrar Entrada</h2>

      <form onSubmit={handleSubmit}>
        <Input
          label="Placa"
          value={plate}
          onChange={(e) => setPlate(normalizePlate(e.target.value))}
          onBlur={handlePlateBlur}
          maxLength={7}
          required
        />

        <Input
          label="Nome do Condutor"
          value={driver}
          onChange={(e) => setDriver(e.target.value)}
          required
        />

        {error && <p className="text-red-500 mb-3 text-sm">{error}</p>}

        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/')}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Confirmar
          </Button>
        </div>
      </form>
    </div>
  );
}
