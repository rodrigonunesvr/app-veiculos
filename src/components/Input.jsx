export default function Input({ label, error, ...props }) {
    return (
        <div className="mb-3">
    {
        label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
            < input
        className = {`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${error ? 'border-red-500' : 'border-gray-300'}`
    }
    {...props }
      />
    {
        error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div >
  )
    }
