import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Trash2, Plus, Search, Settings, LogOut, Eye, Edit, Copy, Clock, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

import { CriarNovaEscala } from './CriarNovaEscala';
import { VisualizarEscala } from './VisualizarEscala';
import { EditarEscala } from './EditarEscala';
import { AdminMenu } from './AdminMenu';
import { UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface TelaDeLancamentoProps {
  userId: string;     // Essencial para o 'criado_por'
  userName: string;
  userRole: UserRole;
  onLogout: () => void;
}

export function TelaDeLancamento({ userId, userName, userRole, onLogout }: TelaDeLancamentoProps) {
  const [view, setView] = useState<'lista' | 'nova' | 'admin' | 'visualizar' | 'editar'>('lista');
  const [busca, setBusca] = useState('');
  const [escalas, setEscalas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [escalaSelecionada, setEscalaSelecionada] = useState<any>(null); 
  
  const podeEditar = userRole === 'admin' || userRole === 'escalante';

  // BUSCA DADOS DO SUPABASE COM JOIN NO CRIADOR E GARAGEM
  async function carregarEscalas() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('escalas')
        .select(`
          *,
          garagens (nome),
          escala_viagens (id),
          perfis_usuarios!criado_por (nome)
        `)
        .order('data_escala', { ascending: false });

      if (error) throw error;
      setEscalas(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar escalas do banco de dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (view === 'lista') {
      carregarEscalas();
    }
  }, [view]);

  const handleExcluir = async (id: string) => {
    if (confirm("Deseja realmente excluir esta escala e todas as suas viagens?")) {
      try {
        const { error } = await supabase.from('escalas').delete().eq('id', id);
        if (error) throw error;
        
        setEscalas(prev => prev.filter(e => e.id !== id));
        toast.success("Escala removida com sucesso!");
      } catch (error) {
        toast.error("Erro ao excluir registro.");
      }
    }
  };

  const handleDuplicar = async (escala: any) => {
    try {
      // 1. Clona o cabeçalho registrando quem está duplicando
      const { data: novaEscala, error: errE } = await supabase
        .from('escalas')
        .insert([{
          data_escala: escala.data_escala,
          garagem_id: escala.garagem_id,
          dia_semana_texto: escala.dia_semana_texto,
          criado_por: userId // Vincula ao usuário logado atual
        }])
        .select()
        .single();

      if (errE) throw errE;

      // 2. Busca e clona as viagens vinculadas
      const { data: viagens } = await supabase.from('escala_viagens').select('*').eq('escala_id', escala.id);
      
      if (viagens && viagens.length > 0) {
        const novasViagens = viagens.map(({ id, created_at, ...v }) => ({
          ...v,
          escala_id: novaEscala.id
        }));
        await supabase.from('escala_viagens').insert(novasViagens);
      }

      toast.success("Escala duplicada com sucesso!");
      carregarEscalas();
    } catch (error) {
      toast.error("Erro ao duplicar escala.");
    }
  };

  const escalasFiltradas = escalas.filter(e => 
    e.data_escala?.includes(busca) || 
    e.dia_semana_texto?.toLowerCase().includes(busca.toLowerCase()) ||
    e.garagens?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    e.perfis_usuarios?.nome?.toLowerCase().includes(busca.toLowerCase())
  );

  if (view === 'admin') return <AdminMenu onVoltar={() => setView('lista')} userRole={userRole} />;
  if (view === 'nova') return <CriarNovaEscala onSave={() => setView('lista')} onBack={() => setView('lista')} />;
  if (view === 'visualizar' && escalaSelecionada) return <VisualizarEscala dados={escalaSelecionada} onBack={() => { setEscalaSelecionada(null); setView('lista'); }} />;
  if (view === 'editar' && escalaSelecionada) return <EditarEscala escalaOriginal={escalaSelecionada} onBack={() => { setEscalaSelecionada(null); setView('lista'); }} />;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-lg text-white">
              <User className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">Gestão Max Tour</h1>
              <p className="text-sm text-slate-500 font-medium">Operador: <span className="text-blue-600">{userName}</span></p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setView('admin')} className="border-slate-200 text-slate-600 hover:bg-slate-50">
              <Settings className="size-4 mr-2" /> Painel Admin
            </Button>
            <Button variant="ghost" onClick={onLogout} className="text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors">
              <LogOut className="size-4 mr-2" /> Sair
            </Button>
          </div>
        </header>

        <Card className="shadow-xl border-none overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between p-8 bg-white border-b border-slate-100">
            <CardTitle className="text-2xl font-bold text-slate-800">Escalas de Serviço</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input 
                  placeholder="Filtrar por data, unidade, dia ou operador..." 
                  className="w-96 pl-10 bg-slate-50 border-slate-200 focus:ring-blue-500 transition-all" 
                  value={busca} 
                  onChange={(e) => setBusca(e.target.value)} 
                />
              </div>
              {podeEditar && (
                <Button onClick={() => setView('nova')} className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200">
                  <Plus className="mr-2 h-4 w-4" /> Nova Escala
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-32 flex flex-col items-center gap-4">
                <Loader2 className="animate-spin size-10 text-blue-600" />
                <p className="text-slate-500 animate-pulse">Sincronizando com o banco de dados...</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="px-8 py-4 font-semibold text-slate-700">Data e Identificação</TableHead>
                    <TableHead className="text-center font-semibold text-slate-700">Unidade</TableHead>
                    <TableHead className="text-center font-semibold text-slate-700">Criado por</TableHead>
                    <TableHead className="text-center font-semibold text-slate-700">Viagens</TableHead>
                    <TableHead className="text-right px-8 font-semibold text-slate-700">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {escalasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20 text-slate-400 italic">
                        Nenhuma escala encontrada no sistema.
                      </TableCell>
                    </TableRow>
                  ) : (
                    escalasFiltradas.map((escala) => (
                      <TableRow key={escala.id} className="hover:bg-slate-50/80 transition-all border-b border-slate-50 last:border-0">
                        <TableCell className="px-8 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-bold text-slate-900 text-lg">
                              {new Date(escala.data_escala).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-[11px] font-bold px-3 py-1 bg-blue-50 text-blue-600 rounded-full w-fit uppercase tracking-wider">
                              {escala.dia_semana_texto}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold text-slate-700">{escala.garagens?.nome || 'Geral'}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-bold text-slate-800">{escala.perfis_usuarios?.nome || 'Sistema'}</span>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              <Clock className="size-3" /> {escala.hora_criacao?.slice(0,5)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-slate-100 text-slate-600 text-sm font-medium">
                            {escala.escala_viagens?.length || 0} viagens
                          </span>
                        </TableCell>
                        <TableCell className="text-right px-8">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setEscalaSelecionada(escala); setView('visualizar'); }} className="h-9 hover:bg-slate-100 border-slate-200">
                              <Eye className="size-4 mr-2" /> Ver
                            </Button>
                            {podeEditar && (
                              <>
                                <Button variant="outline" size="sm" onClick={() => { setEscalaSelecionada(escala); setView('editar'); }} className="h-9 text-blue-600 border-blue-100 hover:bg-blue-50">
                                  <Edit className="size-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDuplicar(escala)} className="h-9 text-green-600 border-green-100 hover:bg-green-50">
                                  <Copy className="size-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleExcluir(escala.id)} className="h-9 text-red-500 hover:bg-red-50">
                                  <Trash2 className="size-4" />
                                </Button>
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
      </div>
    </div>
  );
}