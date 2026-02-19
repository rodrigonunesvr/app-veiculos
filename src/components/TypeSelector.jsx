export default function TypeSelector({ value, onChange }) {
    const types = [
        { id: 'VEHICLE', label: 'Veículo Civil' },
        { id: 'VTR', label: 'Viatura' },
        { id: 'PEDESTRIAN', label: 'Pedestre' }
    ]

    return (
        <div className=\"flex gap-2 mb-4\">
    {
        types.map(t => (
            <button
                key={t.id}
                type=\"button\"
          onClick = {() => onChange(t.id)}
    className = {`flex-1 py-3 text-sm font-bold rounded-lg border-2 transition-all
            ${value === t.id
            ? 'border-blue-600 bg-blue-50 text-blue-700'
            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`
}
        >
    { t.label }
        </button >
      ))}
    </div >
  )
}
