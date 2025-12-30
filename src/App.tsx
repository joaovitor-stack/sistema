import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Button } from './components/ui/button';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { TelaDeLancamento } from './components/TelaDeLancamento';
import { UserRole } from './types'; 
import { supabase } from './lib/supabase';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // ESTADOS DO USUÁRIO
  const [userId, setUserId] = useState(''); // <--- ADICIONADO: Armazena o UUID do banco
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('recursos-humanos');
  
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Autenticação no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        toast.error('Email ou senha inválidos');
        setLoading(false);
        return;
      }

      // 2. Busca o Perfil do Usuário com o Cargo
      const { data: perfil, error: perfilError } = await supabase
        .from('perfis_usuarios')
        .select(`
          id,
          nome,
          roles_usuario (
            codigo
          )
        `)
        .eq('id', authData.user.id)
        .single();

      if (perfilError || !perfil) {
        toast.error('Perfil de usuário não encontrado no banco.');
        setLoading(false);
        return;
      }

      // 3. Define os dados da sessão incluindo o ID do banco
      const cargoDoBanco = (perfil.roles_usuario as any).codigo as UserRole;
      
      setUserId(perfil.id); // <--- ADICIONADO: Define o ID para ser usado na Tela de Lançamento
      setUserName(perfil.nome);
      setUserRole(cargoDoBanco);
      setIsLoggedIn(true);
      
      toast.success(`Bem-vindo, ${perfil.nome}!`);
    } catch (error) {
      toast.error('Ocorreu um erro inesperado ao fazer login.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserId(''); // Limpa o ID no logout
    setEmail('');
    setPassword('');
  };

  if (isLoggedIn) {
    return (
      <>
        <Toaster richColors position="top-right" />
        <TelaDeLancamento 
          userId={userId}    // <--- PASSANDO O ID PARA O COMPONENTE
          userName={userName} 
          userRole={userRole} 
          onLogout={handleLogout} 
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <Toaster richColors position="top-right" />
      <Card className="w-full max-w-md bg-white shadow-lg border-green-100">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-800">Escalas Max Tour</CardTitle>
          <CardDescription>Faça login com sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 size-4 text-slate-400" />
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="E-mail" 
                  className="pl-10 bg-white border-slate-200"
                  required 
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 size-4 text-slate-400" />
                <Input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="pl-10 pr-10 bg-white border-slate-200"
                  required 
                  disabled={loading}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 font-bold transition-colors"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}