import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Button } from './components/ui/button';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { TelaDeLancamento } from './components/TelaDeLancamento';
import { UserRole, Usuario } from './types'; 

const usuariosDemo: Record<string, { password: string; name: string; role: UserRole }> = {
  'admin@maxtour.com': { password: 'admin123', name: 'Admin Sistema', role: 'admin' },
  'escalante@maxtour.com': { password: 'escala123', name: 'João Escalante', role: 'escalante' },
  'rh@maxtour.com': { password: 'rh123', name: 'Maria RH', role: 'recursos-humanos' },
  'plantao@maxtour.com': { password: 'plantao123', name: 'Plantão Maxtour', role: 'plantao' },
  'extra@maxtour.com': { password: 'extra123', name: 'Carlos Extra', role: 'escalante_extra' }
};

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('recursos-humanos');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const usuariosCadastrados: Usuario[] = JSON.parse(localStorage.getItem('maxtour_usuarios') || '[]');
    const usuarioDinamico = usuariosCadastrados.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (usuarioDinamico) {
      setUserName(usuarioDinamico.nome);
      setUserRole(usuarioDinamico.role);
      setIsLoggedIn(true);
      toast.success(`Bem-vindo, ${usuarioDinamico.nome}!`);
      return;
    }

    const user = usuariosDemo[email];
    if (user && user.password === password) {
      setUserName(user.name);
      setUserRole(user.role);
      setIsLoggedIn(true);
      toast.success(`Bem-vindo, ${user.name}!`);
    } else {
      toast.error('Email ou senha inválidos');
    }
  };

  if (isLoggedIn) {
    return (
      <>
        <Toaster richColors position="top-right" />
        <TelaDeLancamento 
          userName={userName} 
          userRole={userRole} 
          onLogout={() => setIsLoggedIn(false)} 
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
          <CardDescription>Faça login para acessar o sistema</CardDescription>
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
                  placeholder="admin@maxtour.com" 
                  className="pl-10 bg-white border-slate-200"
                  required 
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
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold transition-colors">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}