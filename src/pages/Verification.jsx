import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'

export default function Verification() {
    return (
        <div className=\"min-h-screen flex items-center justify-center p-4 bg-gray-50\">
            < div className =\"bg-white p-8 rounded-lg shadow-lg w-full max-w-sm text-center\">
                < div className =\"flex justify-center mb-4\">
                    < div className =\"bg-green-100 p-3 rounded-full\">
                        < MailCheck size = { 48} className =\"text-green-600\" />
          </div >
        </div >

        <h2 className=\"text-2xl font-bold mb-2 text-gray-800\">Verifique seu E-mail</h2>

            < p className =\"text-gray-600 mb-6\">
          Enviamos um link de confirmação para o seu e - mail.Por favor, clique no link para ativar sua conta.
        </p >

        <div className=\"bg-yellow-50 p-3 rounded-md mb-6\">
            < p className =\"text-xs text-yellow-800\">
                < strong > Não encontrou ?</strong > Verifique sua caixa de Spam ou Lixo Eletrônico.
          </p >
        </div >

        <Link
            to=\"/login\" 
    className =\"block w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors\"
        >
        Ir para Login
        </Link >
      </div >
    </div >
  )
}
