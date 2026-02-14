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

export default function Exit() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [type, setType] = useState('VEHICLE');
  const [data, setData] = useState({
    code: '',
    driver: '',
    destination: DESTINATIONS[0],
    destOther: '',
  });

  // lists
  const [insideList, setInsideList] = useState([]);
  const [search, setSearch] = useState('');

  // VTR
  const [vtrList, setVtrList] = useState([]);
  const [selectedVtrs, setSelectedVtrs] = useState([]);
  const [vtrSearch, setVtrSearch] = useState('');

  // UI
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInside();
    supabase
      .from('vtr_catalog')
      .select('code')
      .order('code', { ascending: true })
      .then(({ data }) => setVtrList(data || []));
  }, []);

  const fetchInside = async () => {
    const { data } = await supabase.from('inside_subjects').select('*');
    setInsideList(data || []);
  };

  const handleChange = (field, value) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const normalizeCode = (v) =>
    String(v || '')
      .toUpperCase()
      .replace(/\s/g, '');

  const handleSelectFromList = (item) => {
    setType(item.subject_type);
    setSelectedVtrs([]); // limpa multi
    setData({
      code: item.subject_code,
      driver: item.driver_name || item.person_name || '',
      destination: DESTINATIONS[0],
      destOther: '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleVtr = (code) => {
    setSelectedVtrs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const validate = () => {
    if (type === 'VTR') {
      if (!selectedVtrs.length) return 'Selecione ao menos 1 viatura.';
    } else {
      if (!data.code) return 'Identificação obrigatória.';
      if (type === 'VEHICLE' && !data.driver)
        return 'Condutor obrigatório para veículo.';
      if (type === 'PEDESTRIAN' && !data.driver)
        return 'Nome obrigatório para pedestre.';
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
          direction: 'EXIT',
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

      const payload = {
        direction: 'EXIT',
        subject_type: type,
        subject_code: normalizeCode(data.code),
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

  const filteredList = insideList.filter((i) => {
    const q = search.toUpperCase();
    return (
      i.subject_code?.includes(q) ||
      (i.driver_name && i.driver_name.toUpperCase().includes(q))
    );
  });

  const vtrFiltered = vtrList.filter((v) =>
    v.code.toUpperCase().includes(vtrSearch.toUpperCase())
  );
  return
  (
    <div className="max-w-md mx-auto pb-24">
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4 text-orange-700">
          Registrar Saída
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
          {/* VTR multi-select */}
          {type === 'VTR' ? (
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
          ) : (
            <>
              <Input
                label={
                  type === 'PEDESTRIAN'
                    ? 'Documento'
                    : type === 'VEHICLE'
                    ? 'Placa / Prefixo'
                    : 'Código'
                }
                value={data.code}
                onChange={(e) => handleChange('code', normalizeCode(e.target.value))}
                placeholder={type === 'VEHICLE' ? 'ABC-1234' : ''}
              />

              <Input
                label={type === 'PEDESTRIAN' ? 'Nome' : 'Condutor'}
                value={data.driver}
                onChange={(e) => handleChange('driver', e.target.value)}
              />
            </>
          )}

          {/* Destination */}
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
            />
          )}

          <Button type="submit" variant="danger" className="mt-2">
            Continuar
          </Button>
        </form>
      </div>

      {/* Quick pick from "inside" list */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold mb-2 text-gray-700 text-sm uppercase">
          Selecionar de quem está DENTRO
        </h3>

        <Input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center p-2 border rounded hover:bg-gray-50 cursor-pointer"
              onClick={() => handleSelectFromList(item)}
            >
              <div>
                <p className="font-bold">{item.subject_code}</p>
                <p className="text-xs text-gray-500">{item.subject_type}</p>
              </div>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                Selecionar
              </span>
            </div>
          ))}

          {filteredList.length === 0 && (
            <p className="text-center text-gray-400 text-sm">
              Nenhum registro encontrado.
            </p>
          )}
        </div>
      </div>

      <ConfirmationModal
        show={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleConfirm}
        loading={loading}
        data={{
          type: 'EXIT',
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
