import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function Input({ label, error, type = 'text', ...props }) {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

    return (
        <div className="mb-3">
            {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

            <div className="relative">
                <input
                    type={inputType}
                    className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${error ? 'border-red-500' : 'border-gray-300'} ${isPassword ? 'pr-10' : ''}`}
                    {...props}
                />

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                )}
            </div>

            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    )
}
