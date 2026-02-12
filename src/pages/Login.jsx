import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();

  // Se já logou (ou acabou de logar), sai da tela
  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [loading, user, navigate]);

<<<<<<< HEAD
    return (
        <div className=\"min-h-screen flex items-center justify-center p-4 bg-gray-100\">
            < div className =\"bg-white p-6 rounded-lg shadow-md w-full max-w-sm\">
                < h2 className =\"text-2xl font-bold mb-6 text-center text-blue-800\">Controle de Veículos</h2>
                    < form onSubmit = { handleSubmit } >
                        <Input
                            label=\"E-mail\" 
    type =\"email\" 
    value = { email }
    onChange = { e => setEmail(e.target.value) }
    required
        />
        <Input
            label=\"Senha\" 
    type =\"password\" 
    value = { password }
    onChange = { e => setPassword(e.target.value) }
    required
        />
        { error && <div className=\"mb-4 text-red-600 text-sm text-center\">{error}</div>}
            < Button type =\"submit\" loading={loading}>Entrar</Button>
        </form >
      </div >
    </div >
  )
=======
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingLocal(true);
    setErrorMsg('');

    try {
      const result = await signIn(email, password);
      const maybeError = result?.error ?? null;
      if (maybeError) throw maybeError;

      // não navega aqui; o useEffect navega quando user atualizar
    } catch (err) {
      setErrorMsg('Falha no login. Verifique suas credenciais.');
    } finally {
      setLoadingLocal(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">
          Controle de Veículos
        </h2>

        <form onSubmit={handleSubmit}>
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {errorMsg && (
            <div className="mb-4 text-red-600 text-sm text-center">
              {errorMsg}
            </div>
          )}

          <Button type="submit" loading={loadingLocal}>
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
>>>>>>> b4892f26520e0b98bd3aa2239c5183f209b265b4
}
