import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import {
  Users,
  Building2,
  Route,
  BarChart3,
  Calendar,
  ArrowLeft,
  UserSquare2,
  BusFront,
  MapPin,
  Loader2,
  Bus,
} from 'lucide-react';
import { TelaAdmin } from './TelaAdmin';
import { GestaoClientes } from './GestaoClientes';
import { GestaoLinhas } from './GestaoLinhas';
import { GestaoMotoristas } from './GestaoMotoristas';
import { TelaFolgas } from './TelaFolgas';
import { CriarViagemExtra } from './CriarViagemExtra';
import { GestaoItinerarios } from './GestaoDeItinerarios';
import { TelaDashboard } from './TelaDashboard';
import { TelaVeiculos } from './TelaVeiculos';
import { UserRole } from '../types';
import PainelMotorista from './PainelMotorista';

interface AdminMenuProps {
  onVoltar: () => void;
  userRole: UserRole;
  roleId?: string;
}

// Extend TelaAtiva to include the motorista panel
type TelaAtiva =
  | 'menu'
  | 'usuarios'
  | 'clientes'
  | 'linhas'
  | 'motoristas'
  | 'dashboard'
  | 'folgas'
  | 'viagens_extras'
  | 'itinerarios'
  | 'veiculos'
  | 'painelmotorista';

export function AdminMenu({ onVoltar, userRole, roleId }: AdminMenuProps) {
  const [telaAtiva, setTelaAtiva] = useState<TelaAtiva>('menu');
  const [permissoes, setPermissoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarPermissoes() {
      // Admin has access to everything, skip fetch
      if (userRole === 'admin') {
        setLoading(false);
        return;
      }
      if (!roleId) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`http://localhost:3333/api/permissoes/${roleId}`);
        if (response.ok) {
          const data = await response.json();
          setPermissoes(data);
        }
      } catch (error) {
        console.error('Erro ao carregar permissões no servidor:', error);
      } finally {
        setLoading(false);
      }
    }
    carregarPermissoes();
  }, [roleId, userRole]);

  // Utilitário para checar se o usuário tem permissão
  const temAcesso = (moduloId: string) => {
    if (userRole === 'admin') return true;
    const p = permissoes.find(perm => perm.modulo_id === moduloId);
    return p ? p.pode_ver : false;
  };

  // Regras de visibilidade para cada módulo
  const podeVerUsuarios = userRole === 'admin';
  const podeVerLinhas = userRole === 'admin' || userRole === 'escalante' || temAcesso('linhas');
  const podeVerItinerario =
    userRole === 'admin' ||
    userRole === 'escalante' ||
    userRole === 'escalante_extra' ||
    userRole === 'recursos-humanos' ||
    userRole === 'plantao' ||
    temAcesso('itinerarios');
  const podeVerFolgas =
    userRole === 'admin' ||
    userRole === 'escalante' ||
    userRole === 'escalante_extra' ||
    userRole === 'recursos-humanos' ||
    userRole === 'plantao' ||
    temAcesso('folgas');
  const podeVerMotoristasClientesDashboard =
    userRole === 'admin' || temAcesso('motoristas');
  const podeVerViagensExtras =
    userRole === 'admin' ||
    userRole === 'plantao' ||
    userRole === 'escalante' ||
    userRole === 'escalante_extra' ||
    temAcesso('viagens_extras');
  const podeVerVeiculos =
    userRole === 'admin' ||
    userRole === 'escalante' ||
    userRole === 'plantao' ||
    temAcesso('veiculos');
  // Mostrar Painel do Motorista apenas para admin por enquanto
  const podeVerPainelMotorista = userRole === 'admin';

  // Tela de loading enquanto verifica permissões
  if (loading && userRole !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin size-10 text-blue-600" />
        <p className="text-slate-500 font-medium">Carregando permissões de acesso...</p>
      </div>
    );
  }

  // Navegação entre telas do painel de gestão
  if (telaAtiva === 'usuarios') return <TelaAdmin onVoltar={() => setTelaAtiva('menu')} />;
  if (telaAtiva === 'clientes') return <GestaoClientes onVoltar={() => setTelaAtiva('menu')} />;
  if (telaAtiva === 'linhas') return <GestaoLinhas onVoltar={() => setTelaAtiva('menu')} />;
  if (telaAtiva === 'motoristas') return <GestaoMotoristas onBack={() => setTelaAtiva('menu')} />;
  if (telaAtiva === 'folgas') return <TelaFolgas onVoltar={() => setTelaAtiva('menu')} userRole={userRole} />;
  if (telaAtiva === 'viagens_extras') return <CriarViagemExtra onBack={() => setTelaAtiva('menu')} />;
  if (telaAtiva === 'itinerarios') return <GestaoItinerarios onBack={() => setTelaAtiva('menu')} />;
  if (telaAtiva === 'dashboard') return <TelaDashboard onBack={() => setTelaAtiva('menu')} />;
  if (telaAtiva === 'veiculos') return <TelaVeiculos onBack={() => setTelaAtiva('menu')} />;
  if (telaAtiva === 'painelmotorista') return <PainelMotorista />;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Painel de Gestão</h1>
          <Button
            variant="outline"
            onClick={onVoltar}
            className="bg-white border-slate-300 shadow-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {podeVerMotoristasClientesDashboard && (
            <Card
              className="p-6 cursor-pointer border-l-4 border-l-blue-600 hover:shadow-md transition-all"
              onClick={() => setTelaAtiva('motoristas')}
            >
              <div className="flex items-center gap-4">
                <UserSquare2 className="size-8 text-blue-600" />
                <div>
                  <h3 className="font-bold">Motoristas</h3>
                  <p className="text-sm text-gray-500">Cadastro</p>
                </div>
              </div>
            </Card>
          )}

          {podeVerVeiculos && (
            <Card
              className="p-6 cursor-pointer border-l-4 border-l-amber-500 hover:shadow-md transition-all"
              onClick={() => setTelaAtiva('veiculos')}
            >
              <div className="flex items-center gap-4">
                <Bus className="size-8 text-amber-600" />
                <div>
                  <h3 className="font-bold">Frota de Veículos</h3>
                  <p className="text-sm text-gray-500">Gestão e Tipos</p>
                </div>
              </div>
            </Card>
          )}

          {podeVerMotoristasClientesDashboard && (
            <Card
              className="p-6 cursor-pointer border-l-4 border-l-purple-500 hover:shadow-md transition-all"
              onClick={() => setTelaAtiva('clientes')}
            >
              <div className="flex items-center gap-4">
                <Building2 className="size-8 text-purple-600" />
                <div>
                  <h3 className="font-bold">Clientes</h3>
                  <p className="text-sm text-gray-500">Empresas</p>
                </div>
              </div>
            </Card>
          )}

          {podeVerLinhas && (
            <Card
              className="p-6 cursor-pointer border-l-4 border-l-green-500 hover:shadow-md transition-all"
              onClick={() => setTelaAtiva('linhas')}
            >
              <div className="flex items-center gap-4">
                <Route className="size-8 text-green-600" />
                <div>
                  <h3 className="font-bold">Linhas</h3>
                  <p className="text-sm text-gray-500">Gestão de Linhas</p>
                </div>
              </div>
            </Card>
          )}

          {podeVerItinerario && (
            <Card
              className="p-6 cursor-pointer border-l-4 border-l-orange-600 hover:shadow-md transition-all"
              onClick={() => setTelaAtiva('itinerarios')}
            >
              <div className="flex items-center gap-4">
                <MapPin className="size-8 text-orange-600" />
                <div>
                  <h3 className="font-bold">Fichas de Itinerário</h3>
                  <p className="text-sm text-gray-500">Consulta e Gestão</p>
                </div>
              </div>
            </Card>
          )}

          {podeVerViagensExtras && (
            <Card
              className="p-6 cursor-pointer border-l-4 border-l-orange-400 hover:shadow-md transition-all"
              onClick={() => setTelaAtiva('viagens_extras')}
            >
              <div className="flex items-center gap-4">
                <BusFront className="size-8 text-orange-400" />
                <div>
                  <h3 className="font-bold">Viagens Extras</h3>
                  <p className="text-sm text-gray-500">Eventuais / Turismo</p>
                </div>
              </div>
            </Card>
          )}

          {podeVerFolgas && (
            <Card
              className="p-6 cursor-pointer border-l-4 border-l-red-500 hover:shadow-md transition-all"
              onClick={() => setTelaAtiva('folgas')}
            >
              <div className="flex items-center gap-4">
                <Calendar className="size-8 text-red-600" />
                <div>
                  <h3 className="font-bold">Gestão de Folgas</h3>
                  <p className="text-sm text-gray-500">Calendário e Escalas</p>
                </div>
              </div>
            </Card>
          )}

          {podeVerUsuarios && (
            <Card
              className="p-6 cursor-pointer border-l-4 border-l-slate-400 hover:shadow-md transition-all"
              onClick={() => setTelaAtiva('usuarios')}
            >
              <div className="flex items-center gap-4">
                <Users className="size-8 text-slate-600" />
                <div>
                  <h3 className="font-bold">Usuários</h3>
                  <p className="text-sm text-gray-500">Gerenciar Acessos</p>
                </div>
              </div>
            </Card>
          )}

          {podeVerMotoristasClientesDashboard && (
            <Card
              className="p-6 cursor-pointer border-l-4 border-l-indigo-600 hover:shadow-md transition-all"
              onClick={() => setTelaAtiva('dashboard')}
            >
              <div className="flex items-center gap-4">
                <BarChart3 className="size-8 text-indigo-600" />
                <div>
                  <h3 className="font-bold">Indicadores</h3>
                  <p className="text-sm text-gray-500">Dashboard de Performance</p>
                </div>
              </div>
            </Card>
          )}

          {/* Novo card: Painel do Motorista */}
          {podeVerPainelMotorista && (
            <Card
              className="p-6 cursor-pointer border-l-4 border-l-teal-500 hover:shadow-md transition-all"
              onClick={() => setTelaAtiva('painelmotorista')}
            >
              <div className="flex items-center gap-4">
                <UserSquare2 className="size-8 text-teal-500" />
                <div>
                  <h3 className="font-bold">Painel Motorista</h3>
                  <p className="text-sm text-gray-500">Escala, Folgas e Itinerário</p>
                </div>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}