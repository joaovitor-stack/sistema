import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Trash2, Plus, Search, Settings, LogOut, Eye, Edit, Copy, Clock } from 'lucide-react';
import { toast } from 'sonner';

import { CriarNovaEscala } from './CriarNovaEscala';
import { VisualizarEscala } from './VisualizarEscala';
import { EditarEscala } from './EditarEscala';
import { AdminMenu } from './AdminMenu';
import { UserRole } from '../types';

interface TelaDeLancamentoProps {
  userName: string;
  userRole: UserRole;
  onLogout: () => void;
}

export function TelaDeLancamento({ userName, userRole, onLogout }: TelaDeLancamentoProps) {
  const [view, setView] = useState<'lista' | 'nova' | 'admin' | 'visualizar' | 'editar'>('lista');
  const [busca, setBusca] = useState('');
  const [escalas, setEscalas] = useState<any[]>([]);
  const [escalaSelecionada, setEscalaSelecionada] = useState<any>(null); 
  
  const podeEditar = userRole === 'admin' || userRole === 'escalante';

  useEffect(() => {
    const salvas = JSON.parse(localStorage.getItem('maxtour_escalas_gerais') || '[]');
    setEscalas(salvas);
  }, [view]);

  const handleExcluir = (id: string) => {
    if (confirm("Deseja realmente excluir esta escala?")) {
      const novasEscalas = escalas.filter(e => e.id !== id);
      localStorage.setItem('maxtour_escalas_gerais', JSON.stringify(novasEscalas));
      setEscalas(novasEscalas);
      toast.success("Escala removida!");
    }
  };

  const handleDuplicar = (escala: any) => {
    const nova = {
      ...escala,
      id: Math.random().toString(36).substr(2, 9),
      horaCriacao: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    const novas = [nova, ...escalas];
    localStorage.setItem('maxtour_escalas_gerais', JSON.stringify(novas));
    setEscalas(novas);
    toast.success("Escala duplicada!");
  };

  if (view === 'admin') return <AdminMenu onVoltar={() => setView('lista')} userRole={userRole} />;
  if (view === 'nova') return <CriarNovaEscala onSave={() => setView('lista')} onBack={() => setView('lista')} />;
  
  if (view === 'visualizar' && escalaSelecionada) {
    return <VisualizarEscala dados={escalaSelecionada} onBack={() => { setEscalaSelecionada(null); setView('lista'); }} />;
  }
  
  if (view === 'editar' && escalaSelecionada) {
    return <EditarEscala escalaOriginal={escalaSelecionada} onBack={() => { setEscalaSelecionada(null); setView('lista'); }} />;
  }

  const escalasFiltradas = escalas.filter(e => 
    e.dataCriacao?.includes(busca) || 
    e.diaSemana?.toLowerCase().includes(busca.toLowerCase()) ||
    e.garagem?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Gestão Max Tour</h1>
            <p className="text-sm text-slate-500">Operador: {userName}</p>
          </div>
          <div className="flex gap-2">
            {/* REMOVIDO A TRAVA DE ADMIN AQUI PARA TODOS ACESSAREM */}
            <Button variant="outline" onClick={() => setView('admin')}>
              <Settings className="size-4 mr-2" /> Painel Admin
            </Button>
            <Button variant="ghost" onClick={onLogout} className="text-red-600">
              <LogOut className="size-4 mr-2" /> Sair
            </Button>
          </div>
        </header>

        <Card className="shadow-lg border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-7">
            <CardTitle className="text-2xl font-bold text-slate-800">Escalas de Serviço</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input 
                  placeholder="Filtrar por data, dia ou garagem..." 
                  className="w-80 pl-10 bg-slate-50" 
                  value={busca} 
                  onChange={(e) => setBusca(e.target.value)} 
                />
              </div>
              {podeEditar && (
                <Button onClick={() => setView('nova')} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" /> Nova Escala
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[350px]">Identificação da Escala</TableHead>
                  <TableHead className="text-center">Unidade</TableHead>
                  <TableHead className="text-center">Status </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {escalasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-400">
                      Nenhuma escala encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  escalasFiltradas.map((escala) => (
                    <TableRow key={escala.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-base">{escala.dataCriacao}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full uppercase">
                              {escala.diaSemana}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-slate-500 gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" /> Salva às {escala.horaCriacao}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium text-slate-700">{escala.garagem || 'Não informada'}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm text-slate-600 font-medium">{escala.linhas?.length || 0} viagens</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setEscalaSelecionada(escala); setView('visualizar'); }} className="h-8">
                            <Eye className="size-4 mr-1" /> Ver
                          </Button>
                          {podeEditar && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => { setEscalaSelecionada(escala); setView('editar'); }} className="h-8 text-blue-600">
                                <Edit className="size-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDuplicar(escala)} className="h-8 text-green-600">
                                <Copy className="size-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleExcluir(escala.id)} className="h-8 text-red-600">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}