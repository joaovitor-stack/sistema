import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Button } from './components/ui/button';
import { Eye, EyeOff, Lock, Mail, Loader2, RefreshCcw, Download } from 'lucide-react'; // Adicionado Download
import { toast, Toaster } from 'sonner';
import { TelaDeLancamento } from './components/TelaDeLancamento';
import PainelMotorista from './components/PainelMotorista';
import { UserRole } from './types';
import { supabase } from './lib/supabase';

/** * AJUSTE IMPORTANTE: 
 * Como você acessa via 10.100.30.190, o backend deve seguir o mesmo IP.
 */
const API_URL = 'http://10.100.30.190:3333';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true); 
  const [loading, setLoading] = useState(false);

  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('recursos-humanos');
  const [roleId, setRoleId] = useState('');

  // Estados para o PWA
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const isMobile = /Mobi|Android/i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '');

  // --- LÓGICA DE CAPTURA DO PWA ---
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    });

    window.addEventListener('appinstalled', () => {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
  };

  // Busca perfil no backend (Node.js)
  const fetchUserProfile = async (supabaseUid: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/perfil/${supabaseUid}`);
      if (!response.ok) throw new Error('Servidor de perfil não respondeu.');
      
      const perfil = await response.json();
      setUserId(perfil.id);
      setUserName(perfil.nome);
      setUserRole(perfil.role as UserRole);
      setRoleId(perfil.role_id);
      setIsLoggedIn(true);
      return true;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return false;
    }
  };

  // Fluxo de Inicialização
  useEffect(() => {
    async function inicializar() {
      setIsCheckingSession(true);
      
      try {
        // 1. Verifica se já existe sessão salva
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const success = await fetchUserProfile(session.user.id);
          if (success) {
            setIsCheckingSession(false);
            return;
          }
        }

        // 2. Se for Mobile, tenta o login automático de motorista
        if (isMobile) {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'motorista@motorista.com.br',
            password: '123456789',
          });

          if (!authError && authData.user) {
            await fetchUserProfile(authData.user.id);
          } else if (authError) {
            console.error("Erro no login automático:", authError.message);
          }
        }
      } catch (err) {
        console.error("Erro crítico na carga inicial:", err);
      } finally {
        setIsCheckingSession(false);
      }
    }

    inicializar();
  }, [isMobile]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error('E-mail ou senha incorretos');
        setLoading(false);
        return;
      }
      if (data.user) {
        const ok = await fetchUserProfile(data.user.id);
        if (!ok) toast.error('Perfil não encontrado no sistema.');
      }
    } catch (error) {
      toast.error('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserId('');
    // Força recarga para limpar tudo e garantir que o mobile tente logar como motorista de novo
    window.location.reload(); 
  };

  // TELA DE CARREGAMENTO
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-green-600" />
          <div>
            <h2 className="text-slate-800 font-bold text-lg uppercase">Max Tour</h2>
            <p className="text-slate-500 text-sm animate-pulse">Sincronizando acesso...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      <Toaster richColors position="top-right" />

      {/* BANNER DE INSTALAÇÃO PWA - Aparece apenas no celular se ainda não estiver instalado */}
      {showInstallBanner && isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 p-4 flex items-center justify-between text-white shadow-2xl animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-md">
                <Download className="text-green-600 size-5" />
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-bold">App Escalas Max Tour</span>
                <span className="text-[10px] opacity-90">Instale para acessar mais rápido</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
                onClick={handleInstallClick} 
                className="bg-white text-green-700 px-4 py-1.5 rounded-full text-xs font-black shadow-sm"
            >
                INSTALAR
            </button>
            <button 
                onClick={() => setShowInstallBanner(false)} 
                className="text-white opacity-70 hover:opacity-100"
            >
                <EyeOff size={18} />
            </button>
          </div>
        </div>
      )}

      {/* TELA LOGADA */}
      {isLoggedIn ? (
        isMobile ? (
          <PainelMotorista />
        ) : (
          <TelaDeLancamento 
            userId={userId} 
            userName={userName} 
            userRole={userRole} 
            roleId={roleId} 
            onLogout={handleLogout} 
          />
        )
      ) : isMobile && !isLoggedIn ? (
        /* ERRO NO MOBILE */
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-xs border border-green-100">
            <RefreshCcw className="text-amber-500 size-12 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Acesso Restrito</h2>
            <p className="text-slate-500 text-sm mb-6">
              Não conseguimos conectar ao painel. Verifique se o servidor em {API_URL} está ligado.
            </p>
            <Button onClick={() => window.location.reload()} className="w-full bg-green-600 font-bold">
              Tentar Novamente
            </Button>
          </div>
        </div>
      ) : (
        /* LOGIN DESKTOP */
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-lg border-green-100">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-slate-800">Escalas Max Tour</CardTitle>
              <CardDescription>Painel Administrativo</CardDescription>
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
                      className="pl-10" 
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
                      className="pl-10 pr-10" 
                      required 
                      disabled={loading} 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : 'Entrar'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}