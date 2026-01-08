import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { 
  Trash2, 
  Plus, 
  Search, 
  Settings, 
  LogOut, 
  Eye, 
  Edit, 
  Copy, 
  Clock, 
  Loader2, 
  User, 
  Archive, 
  CalendarCheck 
} from 'lucide-react';
import { toast } from 'sonner';

import { CriarNovaEscala } from './CriarNovaEscala';
import { VisualizarEscala } from './VisualizarEscala';
import { EditarEscala } from './EditarEscala';
import { AdminMenu } from './AdminMenu';
import { UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface TelaDeLancamentoProps {
  userId: string;
  userName: string;
  userRole: UserRole;
  roleId: string; 
  onLogout: () => void;
}

export function TelaDeLancamento({ userId, userName, userRole, roleId, onLogout }: TelaDeLancamentoProps) {
  const [view, setView] = useState<'lista' | 'nova' | 'admin' | 'visualizar' | 'editar'>('lista');
  const [abaAtiva, setAbaAtiva] = useState<'disponiveis' | 'arquivadas'>('disponiveis');
  const [busca, setBusca] = useState('');
  const [escalas, setEscalas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [escalaSelecionada, setEscalaSelecionada] = useState<any>(null); 
  
  const podeEditar = userRole === 'admin' || userRole === 'escalante';

  async function carregarEscalas() {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3333/api/escalas');
      if (!response.ok) throw new Error('Erro ao buscar escalas');
      const data = await response.json();
      setEscalas(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar escalas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (view === 'lista') carregarEscalas();
  }, [view]);

  const handleExcluir = async (id: string) => {
    if (confirm("Deseja realmente excluir esta escala?")) {
      try {
        const { error } = await supabase.from('escalas').delete().eq('id', id);
        if (error) throw error;
        setEscalas(prev => prev.filter(e => e.id !== id));
        toast.success("Removida!");
      } catch (error) { toast.error("Erro ao excluir."); }
    }
  };

  const handleDuplicar = async (escala: any) => {
    try {
      const response = await fetch('http://localhost:3333/api/escalas/duplicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escalaId: escala.id,
          userId: userId
        })
      });

      if (!response.ok) throw new Error('Falha na duplicação');

      toast.success("Escala duplicada com sucesso!");
      carregarEscalas();
    } catch (error) { 
      console.error(error);
      toast.error("Erro ao duplicar."); 
    }
  };

  // CORREÇÃO NO FILTRO: Usando o meio do dia para comparar datas sem erro de fuso
  const filtrarEscalas = (lista: any[]) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const limite15Dias = new Date();
    limite15Dias.setDate(hoje.getDate() - 15);
    limite15Dias.setHours(0, 0, 0, 0);

    return lista.filter(e => {
      // Adicionamos T12:00:00 apenas para a lógica de comparação de "arquivados"
      const dataEscala = new Date(e.data_escala + "T12:00:00");
      const ehRecente = dataEscala >= limite15Dias;

      if (abaAtiva === 'disponiveis' && !ehRecente) return false;
      if (abaAtiva === 'arquivadas' && ehRecente) return false;

      const termo = busca.toLowerCase();
      return (
        e.data_escala?.includes(busca) || 
        e.dia_semana_texto?.toLowerCase().includes(termo) ||
        e.garagens?.nome?.toLowerCase().includes(termo) ||
        e.perfis_usuarios?.nome?.toLowerCase().includes(termo)
      );
    });
  };

  const escalasExibidas = filtrarEscalas(escalas);

  if (view === 'admin') return <AdminMenu onVoltar={() => setView('lista')} userRole={userRole} roleId={roleId} />;
  if (view === 'nova') return <CriarNovaEscala userId={userId} onSave={() => setView('lista')} onBack={() => setView('lista')} />;
  if (view === 'visualizar' && escalaSelecionada) return <VisualizarEscala dados={escalaSelecionada} onBack={() => { setEscalaSelecionada(null); setView('lista'); }} />;
  if (view === 'editar' && escalaSelecionada) return <EditarEscala escalaOriginal={escalaSelecionada} onBack={() => { setEscalaSelecionada(null); setView('lista'); }} />;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-lg text-white"><User className="size-6" /></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Gestão Max Tour</h1>
              <p className="text-sm text-slate-500">Operador: <span className="text-blue-600 font-bold">{userName}</span></p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setView('admin')}><Settings className="size-4 mr-2" /> Painel</Button>
            <Button variant="ghost" onClick={onLogout} className="text-red-500 hover:bg-red-50"><LogOut className="size-4 mr-2" /> Sair</Button>
          </div>
        </header>

        <div className="flex gap-2 mb-4 bg-slate-200/50 p-1 rounded-lg w-fit border border-slate-200">
          <Button 
            variant={abaAtiva === 'disponiveis' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setAbaAtiva('disponiveis')}
            className={abaAtiva === 'disponiveis' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-slate-500'}
          >
            <CalendarCheck className="size-4 mr-2" /> Escalas Disponíveis
          </Button>
          <Button 
            variant={abaAtiva === 'arquivadas' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setAbaAtiva('arquivadas')}
            className={abaAtiva === 'arquivadas' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-slate-500'}
          >
            <Archive className="size-4 mr-2" /> Arquivadas (Histórico)
          </Button>
        </div>

        <Card className="shadow-xl border-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between p-8 border-b">
            <div>
              <CardTitle className="text-xl text-slate-800">
                {abaAtiva === 'disponiveis' ? 'Escalas Recentes' : 'Arquivo Geral'}
              </CardTitle>
              <p className="text-xs text-slate-400 mt-1 uppercase font-medium tracking-wider">
                Total de {escalasExibidas.length} registros encontrados
              </p>
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input 
                  placeholder="Localizar escala..." 
                  className="w-80 pl-10 h-10 border rounded-md text-sm" 
                  value={busca} 
                  onChange={(e) => setBusca(e.target.value)} 
                />
              </div>
              {podeEditar && (
                <Button onClick={() => setView('nova')} className="bg-blue-600 hover:bg-blue-700 h-10">
                  <Plus className="mr-2 h-4 w-4" /> Nova Escala
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-20 flex flex-col items-center gap-4"><Loader2 className="animate-spin size-10 text-blue-600" /><p className="text-slate-400 font-medium">Carregando dados...</p></div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="px-8 py-4 font-bold text-slate-600">Data de Serviço</TableHead>
                    <TableHead className="text-center font-bold text-slate-600">Unidade/Garagem</TableHead>
                    <TableHead className="text-center font-bold text-slate-600">Responsável</TableHead>
                    <TableHead className="text-center font-bold text-slate-600">Volume</TableHead>
                    <TableHead className="text-center font-bold text-slate-600 px-8">Gerenciar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {escalasExibidas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20 text-slate-400 italic">
                        Nenhum registro encontrado para este filtro.
                      </TableCell>
                    </TableRow>
                  ) : (
                    escalasExibidas.map((escala) => (
                      <TableRow key={escala.id} className="hover:bg-blue-50/30 transition-colors">
                        <TableCell className="px-8 py-5">
                          <div className="flex flex-col">
                            {/* CORREÇÃO DEFINITIVA: Exibindo a data literal do banco sem passar pelo new Date() */}
                            <span className="font-bold text-slate-900 text-base">
                              {escala.data_escala.split('-').reverse().join('/')}
                            </span>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">
                              {escala.dia_semana_texto}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <Badge variant="outline" className="font-semibold px-3 py-1 bg-slate-50">{escala.garagens?.nome || 'Geral'}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-bold text-slate-700">
                              {escala.perfis_usuarios?.nome || (escala.criado_por === userId ? userName : 'Sistema')}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                              <Clock className="size-3" /> Criado às {escala.hora_criacao?.slice(0,5) || '--:--'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-bold text-slate-600">{escala.escala_viagens?.length || 0} viagens</span>
                        </TableCell>
                        <TableCell className="text-center px-8">
                          <div className="flex justify-center gap-2">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Visualizar" onClick={() => { setEscalaSelecionada(escala); setView('visualizar'); }}><Eye className="size-4 text-slate-600" /></Button>
                            {podeEditar && (
                              <>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-blue-100 hover:bg-blue-50" title="Editar" onClick={() => { setEscalaSelecionada(escala); setView('editar'); }}><Edit className="size-4 text-blue-600" /></Button>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-green-100 hover:bg-green-50" title="Duplicar" onClick={() => handleDuplicar(escala)}><Copy className="size-4 text-green-600" /></Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50" title="Excluir" onClick={() => handleExcluir(escala.id)}><Trash2 className="size-4 text-red-500" /></Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Footer mantido conforme original */}
        <footer className="mt-16 flex flex-col items-center justify-center border-t border-slate-200 pt-10 pb-12">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em] text-center">
            © {new Date().getFullYear()} SISTEMA DE GESTÃO MAXTOUR - TODOS OS DIREITOS RESERVADOS
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="h-px w-8 bg-blue-200"></div>
            <p className="text-[11px] text-blue-600 font-black uppercase tracking-widest">
              JOÃO VITOR SILVA FERREIRA
            </p>
            <div className="h-px w-8 bg-blue-200"></div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Badge({ children, variant, className }: any) {
  const styles = variant === 'outline' ? 'border border-slate-200 text-slate-600' : 'bg-slate-100 text-slate-800';
  return <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${styles} ${className}`}>{children}</span>;
}