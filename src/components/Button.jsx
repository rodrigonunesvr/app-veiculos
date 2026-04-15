export default function Button({ children, variant = 'primary', loading, onClick, type = 'button', className = '' }) {
    const baseClass = \"w-full py-2 px-4 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2\"

    const variants = {
        primary: \"bg-blue-600 text-white hover:bg-blue-700\",
    secondary: \"bg-gray-200 text-gray-800 hover:bg-gray-300\",
    danger: \"bg-red-600 text-white hover:bg-red-700\",
    outline: \"border border-gray-300 text-gray-700 hover:bg-gray-50\"
  }

    return (
        <button
            type={type}
            className={`${baseClass} ${variants[variant]} ${className}`}
            onClick={onClick}
            disabled={loading}
        >
            {loading ? <span className=\"animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full\" /> : children}
        </button>
    )
}
