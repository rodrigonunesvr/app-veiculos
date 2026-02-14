import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import TypeSelector from '../components/TypeSelector';
import ConfirmationModal from '../components/ConfirmationModal';

const DESTINATIONS = [
  '7º GBM',
  'SOCORRO',
  'CSM',
  'ESTAFETA',
  'ODONTO.',
  'CRSI',
  'MANUTENÇÃO',
  'OUTROS',
];

export default function Entry() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [type, setType] = useState('VEHICLE'); // VEHICLE | VTR | PEDESTRIAN
  const [data, setData] = useState({
    code: '',
    driver: '',
    destination: DESTINATIONS[0],
    destOther: '',
  });

  // VTR
  const [vtrList, setVtrList] = useState([]); // [{code}]
  const [selectedVtrs, setSelectedVtrs] = useState([]); // string[]
  const [vtrSearch, setVtrSearch] = useState('');

  // UI
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from('vtr_catalog')
      .select('code')
      .order('code', { ascending: true })
      .then(({ data }) => setVtrList(data || []));
  }, []);

  const handleChange = (field, value) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const normalizeCode = (v) =>
    String(v || '')
      .toUpperCase()
      .replace(/\s/g, '');

  // Auto-complete driver for Vehicle only
  const handleBlur = async () => {
    if (type === 'VEHICLE') {
      const code = normalizeCode(data.code);
      if (code.length > 3) {
        const { data: log } = await supabase
          .from('movements')
          .select('driver_name')
          .eq('subject_code', code)
          .eq('subject_type', 'VEHICLE')
          .order('event_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (log?.driver_name) handleChange('driver', log.driver_name);
      }
    }
  };

  const toggleVtr = (code) => {
    setSelectedVtrs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const validate = () => {
    if (type === 'VEHICLE') {
      if (!data.code) return 'Preencha a placa/prefixo.';
      if (!data.driver) return 'Nome do condutor obrigatório.';
    }

    if (type === 'PEDESTRIAN') {
      if (!data.driver) return 'Nome do pedestre obrigatório.';
      if (!data.code) return 'Documento do pedestre obrigatório.';
    }

    if (type === 'VTR') {
      if (!selectedVtrs.length) return 'Selecione ao menos 1 viatura.';
    }

    if (data.destination === 'OUTROS' && !data.destOther)
      return 'Informe o destino.';

    return null;
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return alert(err);
    setConfirming(true);
  };
  const handleConfirm = async () => {
    setLoading(true);
    try {
      const finalDest =
        data.destination === 'OUTROS' ? data.destOther : data.destination;

      if (type === 'VTR') {
        const payloads = selectedVtrs.map((code) => ({
          direction: 'ENTRY',
          subject_type: 'VTR',
          subject_code: code,
          destination: finalDest,
          driver_name: null,
          person_name: null,
          person_doc: null,
        }));

        const { error } = await supabase.from('movements').insert(payloads);
        if (error) throw error;

        navigate('/');
        return;
      }

      // VEHICLE / PEDESTRIAN
      const payload = {
        direction: 'ENTRY',
        subject_type: type,
        subject_code: type === 'PEDESTRIAN' ? normalizeCode(data.code) : normalizeCode(data.code),
        destination: finalDest,
        driver_name: type === 'VEHICLE' ? data.driver : null,
        person_name: type === 'PEDESTRIAN' ? data.driver : null,
        person_doc: type === 'PEDESTRIAN' ? data.code : null,
      };

      const { error } = await supabase.from('movements').insert(payload);
      if (error) throw error;

      navigate('/');
    } catch (err) {
      alert('Erro: ' + err.message);
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  const vtrFiltered = vtrList.filter((v) =>
    v.code.toUpperCase().includes(vtrSearch.toUpperCase())
  );
  return
  (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow pb-24">
      <h2 className="text-xl font-bold mb-4 text-green-700">
        Registrar Entrada
      </h2>

      <TypeSelector
        value={type}
        onChange={(t) => {
          setType(t);
          setData((d) => ({ ...d, code: '', driver: '' }));
          setSelectedVtrs([]);
          setVtrSearch('');
        }}
      />

      <form onSubmit={handlePreSubmit}>
        {/* VEHICLE */}
        {type === 'VEHICLE' && (
          <>
            <Input
              label="Placa / Prefixo"
              value={data.code}
              onChange={(e) => handleChange('code', normalizeCode(e.target.value))}
              onBlur={handleBlur}
              placeholder="ABC-1234"
              required
            />
            <Input
              label="Condutor"
              value={data.driver}
              onChange={(e) => handleChange('driver', e.target.value)}
              required
            />
          </>
        )}

        {/* VTR MULTI */}
        {type === 'VTR' && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selecione as viaturas (pode marcar várias)
            </label>

            <Input
              label="Buscar viatura"
              value={vtrSearch}
              onChange={(e) => setVtrSearch(e.target.value)}
              placeholder="Digite para filtrar..."
            />

            <div className="mt-2 max-h-56 overflow-y-auto border rounded p-2 space-y-1">
              {vtrFiltered.map((v) => (
                <label
                  key={v.code}
                  className="flex items-center gap-2 p-1 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedVtrs.includes(v.code)}
                    onChange={() => toggleVtr(v.code)}
                  />
                  <span className="font-medium">{v.code}</span>
                </label>
              ))}

              {vtrFiltered.length === 0 && (
                <p className="text-sm text-gray-500 p-2">
                  Nenhuma viatura encontrada.
                </p>
              )}
            </div>

            <p className="text-xs text-gray-600 mt-2">
              Selecionadas: <b>{selectedVtrs.length}</b>
            </p>
          </div>
        )}

        {/* PEDESTRIAN */}
        {type === 'PEDESTRIAN' && (
          <>
            <Input
              label="Nome Completo"
              value={data.driver}
              onChange={(e) => handleChange('driver', e.target.value)}
              required
            />
            <Input
              label="Documento (RG/CPF)"
              value={data.code}
              onChange={(e) => handleChange('code', e.target.value)}
              required
            />
          </>
        )}

        {/* DESTINATION */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Destino
          </label>
          <select
            className="w-full p-2 border rounded-md"
            value={data.destination}
            onChange={(e) => handleChange('destination', e.target.value)}
          >
            {DESTINATIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {data.destination === 'OUTROS' && (
          <Input
            label="Qual destino?"
            value={data.destOther}
            onChange={(e) => handleChange('destOther', e.target.value)}
            required
          />
        )}

        <Button type="submit" variant="primary" className="mt-4">
          Continuar
        </Button>
      </form>

      <ConfirmationModal
        show={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleConfirm}
        loading={loading}
        data={{
          type: 'ENTRY',
          subject_type: type,
          subject_code:
            type === 'VTR'
              ? `${selectedVtrs.length} viatura(s)`
              : data.code,
          driver_name: data.driver,
          destination:
            data.destination === 'OUTROS' ? data.destOther : data.destination,
          staff_name: `${profile?.full_name || ''} (${profile?.rg5 || ''})`,
        }}
      />
    </div>
  );
}

        