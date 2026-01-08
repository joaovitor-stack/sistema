import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Building2, Plus, Search, Trash2, X, Save, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
// importado anteriormente: import { supabase } from '../lib/supabase';
// Como agora consumimos a API Express, removemos a dependência direta do Supabase.

// Definimos a URL base da API; ajuste a porta se o backend estiver em outra porta.
const API_URL = 'http://localhost:3333';

interface Cliente {
  id: string;
  nome: string;
  cnpj: string;
  status: string; // Adaptado para ler do join com cliente_status
}

interface GestaoClientesProps {
  onVoltar: () => void;
}

export function GestaoClientes({ onVoltar }: GestaoClientesProps) {
  const [busca, setBusca] = useState('');
  const [isCriando, setIsCriando] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [novoCliente, setNovoCliente] = useState({ nome: '', cnpj: '' });
  const [loading, setLoading] = useState(false);

  // Carregar dados via API
  async function carregarClientes() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/clientes`);
      if (!response.ok) {
        throw new Error('Não foi possível obter dados do servidor.');
      }
      const data = await response.json();
      // A API retorna diretamente um array de clientes já formatados.
      setClientes(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error('Erro ao carregar clientes: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoCliente.nome || !novoCliente.cnpj) {
      toast.error('Preencha todos os campos!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoCliente.nome,
          cnpj: novoCliente.cnpj,
        }),
      });
      if (!response.ok) {
        let errMsg = 'Erro ao salvar no servidor.';
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      toast.success('Cliente cadastrado no banco!');
      setNovoCliente({ nome: '', cnpj: '' });
      setIsCriando(false);
      carregarClientes();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const removerCliente = async (id: string) => {
    if (!confirm('Deseja remover este cliente permanentemente?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/clientes/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        let errMsg = 'Erro ao remover no servidor.';
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      toast.success('Cliente removido do banco.');
      carregarClientes();
    } catch (error: any) {
      toast.error('Erro ao remover: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase()) || 
    c.cnpj.includes(busca)
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Building2 className="size-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-800">Gestão de Clientes</h1>
          </div>
          <Button onClick={onVoltar} variant="outline">Voltar ao Menu</Button>
        </div>

        {isCriando && (
          <Card className="mb-6 border-blue-200 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Novo Cadastro</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsCriando(false)}><X className="size-4" /></Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input 
                    value={novoCliente.nome} 
                    onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})}
                    placeholder="Razão Social"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input 
                    value={novoCliente.cnpj} 
                    onChange={e => setNovoCliente({...novoCliente, cnpj: e.target.value})}
                    placeholder="00.000.000/0000-00"
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Cliente
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Clientes Cadastrados</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="Buscar cliente..." 
                    className="pl-8 w-64"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>
                {!isCriando && (
                  <Button onClick={() => setIsCriando(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Novo Cliente
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Cliente</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && clientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                      <p className="text-sm text-slate-500 mt-2">Carregando clientes...</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  clientesFiltrados.map(cliente => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>{cliente.cnpj}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          cliente.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {cliente.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => removerCliente(cliente.id)}
                          disabled={loading}
                        >
                          <Trash2 className="size-4" />
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