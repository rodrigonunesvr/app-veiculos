import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LogIn, LogOut, Car } from 'lucide-react'

export default function Home() {
    const navigate = useNavigate()
    const [count, setCount] = useState(0)

    useEffect(() => {
        const fetchCount = async () => {
            const { count } = await supabase
                .from('active_vehicles')
                .select('*', { count: 'exact', head: true })
                .eq('type', 'ENTRY')
            setCount(count || 0)
        }
        fetchCount()
        const interval = setInterval(fetchCount, 10000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="space-y-6">
            <div className ="bg-blue-600 text-white p-6 rounded-xl shadow-lg text-center">
                < p className ="text-blue-100 text-sm uppercase tracking-wider font-semibold">Veículos no Pátio (v2.1)</p>
                    < p className ="text-5xl font-bold my-2">{count}</p>
                        <div className ="flex justify-center items-center gap-2 opacity-80">
                            < Car size = { 20} />
                                <span>Ativos agora</span>
        </div >
      </div >

        <div className="grid grid-cols-2 gap-4">
            < button
    onClick = {() => navigate('/entry')
}
className ="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl shadow flex flex-col items-center justify-center gap-2 transition-transform active:scale-95"
    >
          <LogIn size={40} />
          <span className="font-bold text-lg">Entrada</span>
        </button >

    <button
        onClick={() => navigate('/exit')}
        className="bg-orange-600 hover:bg-orange-700 text-white p-6 rounded-xl shadow flex flex-col items-center justify-center gap-2 transition-transform active:scale-95"
            >
            <LogOut size={40} className="rotate-180" />
                < span className ="font-bold text-lg">Saída</span>
        </button >
      </div >

    <div className="bg-white p-4 rounded-lg shadow">
        < h3 className ="font-bold text-gray-700 mb-2">Versão 2.1</h3>
            < p className ="text-sm text-gray-500">
          • Suporte a Destinos na Entrada / Saída < br />
          • Fluxo flexível(Saída Avulsa) < br />
          • Relatórios PDF no Admin
        </p >
      </div >
    </div >
  )
}
