import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Route, Plus, Save, X, Trash2, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase'; // Importação do Supabase

interface LinhaCadastrada {
  id: string;
  codigo: string;
  nome: string;
  clienteId: string;
  clienteNome: string;
}

export function GestaoLinhas({ onVoltar }: { onVoltar: () => void }) {
  const [isCriando, setIsCriando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linhas, setLinhas] = useState<LinhaCadastrada[]>([]);
  const [clientesCadastrados, setClientesCadastrados] = useState<{id: string, nome: string}[]>([]);
  const [novaLinha, setNovaLinha] = useState({ codigo: '', nome: '', clienteId: '' });

  // Carregar Dados do Supabase
  async function carregarDados() {
    setLoading(true);
    try {
      // 1. Carregar Clientes para o Select
      const { data: clientesData } = await supabase
        .from('clientes')
        .select('id, nome')
        .order('nome');
      
      if (clientesData) setClientesCadastrados(clientesData);

      // 2. Carregar Linhas com Join em Clientes
      const { data: linhasData, error } = await supabase
        .from('linhas')
        .select(`
          id, 
          codigo, 
          nome, 
          cliente_id,
          clientes (nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (linhasData) {
        const formatadas: LinhaCadastrada[] = linhasData.map((item: any) => ({
          id: item.id,
          codigo: item.codigo,
          nome: item.nome,
          clienteId: item.cliente_id,
          clienteNome: item.clientes?.nome || 'Cliente não encontrado'
        }));
        setLinhas(formatadas);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novaLinha.codigo || !novaLinha.clienteId || !novaLinha.nome) {
      toast.error("Preencha todos os campos!");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('linhas')
        .insert([
          { 
            codigo: novaLinha.codigo, 
            nome: novaLinha.nome, 
            cliente_id: novaLinha.clienteId 
          }
        ]);

      if (error) throw error;

      toast.success("Linha cadastrada com sucesso!");
      setIsCriando(false);
      setNovaLinha({ codigo: '', nome: '', clienteId: '' });
      carregarDados();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const removerLinha = async (id: string) => {
    if (!confirm("Deseja remover esta linha?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('linhas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Linha removida.");
      carregarDados();
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Route className="size-6 text-green-600" />
            <h1 className="text-2xl font-bold">Gestão de Linhas por Cliente</h1>
          </div>
          <Button onClick={onVoltar} variant="outline">Voltar ao Menu</Button>
        </div>

        {isCriando && (
          <Card className="mb-6 border-green-200 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Nova Linha</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsCriando(false)} disabled={loading}>
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Selecione o Cliente</Label>
                  <Select 
                    value={novaLinha.clienteId}
                    onValueChange={(val) => setNovaLinha({...novaLinha, clienteId: val})}
                    disabled={loading}
                  >
                    <SelectTrigger><SelectValue placeholder="Escolha um cliente" /></SelectTrigger>
                    <SelectContent>
                      {clientesCadastrados.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cód. Linha</Label>
                  <Input 
                    value={novaLinha.codigo} 
                    onChange={e => setNovaLinha({...novaLinha, codigo: e.target.value})} 
                    placeholder="Ex: ROTA-01" 
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição da Rota</Label>
                  <Input 
                    value={novaLinha.nome} 
                    onChange={e => setNovaLinha({...novaLinha, nome: e.target.value})} 
                    placeholder="Ex: Centro x Industrial" 
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="bg-green-600 text-white hover:bg-green-700" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Linha
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Relação Linha x Cliente</CardTitle>
            {!isCriando && (
              <Button onClick={() => setIsCriando(true)} className="bg-green-600 text-white hover:bg-green-700">
                <Plus className="size-4 mr-2" /> Vincular Linha
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Código da Linha</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && linhas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
                    </TableCell>
                  </TableRow>
                ) : (
                  linhas.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium text-blue-700">{l.clienteNome}</TableCell>
                      <TableCell className="font-bold">{l.codigo}</TableCell>
                      <TableCell>{l.nome}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removerLinha(l.id)}
                          disabled={loading}
                        >
                          <Trash2 className="size-4 text-red-500" />
                        </Button>
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