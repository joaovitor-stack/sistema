import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Building2, Plus, Search, Trash2, X, Save } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';

interface Cliente {
  id: string;
  nome: string;
  cnpj: string;
  status: 'Ativo' | 'Inativo';
}

interface GestaoClientesProps {
  onVoltar: () => void;
}

export function GestaoClientes({ onVoltar }: GestaoClientesProps) {
  const [busca, setBusca] = useState('');
  const [isCriando, setIsCriando] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [novoCliente, setNovoCliente] = useState({ nome: '', cnpj: '' });

  // Carregar dados ao iniciar
  useEffect(() => {
    const salvos = localStorage.getItem('maxtour_clientes');
    if (salvos) {
      setClientes(JSON.parse(salvos));
    } else {
      // Exemplo inicial caso esteja vazio
      const inicial: Cliente[] = [{ id: '1', nome: 'Exemplo de Cliente LTDA', cnpj: '00.000.000/0001-00', status: 'Ativo' }];
      setClientes(inicial);
      localStorage.setItem('maxtour_clientes', JSON.stringify(inicial));
    }
  }, []);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoCliente.nome || !novoCliente.cnpj) {
      toast.error("Preencha todos os campos!");
      return;
    }

    const clienteParaAdicionar: Cliente = {
      id: Math.random().toString(36).substr(2, 9),
      nome: novoCliente.nome,
      cnpj: novoCliente.cnpj,
      status: 'Ativo'
    };

    const novaLista = [...clientes, clienteParaAdicionar];
    setClientes(novaLista);
    localStorage.setItem('maxtour_clientes', JSON.stringify(novaLista)); // Salva no "Banco"
    
    setNovoCliente({ nome: '', cnpj: '' });
    setIsCriando(false);
    toast.success("Cliente cadastrado com sucesso!");
  };

  const removerCliente = (id: string) => {
    const novaLista = clientes.filter(c => c.id !== id);
    setClientes(novaLista);
    localStorage.setItem('maxtour_clientes', JSON.stringify(novaLista));
    toast.success("Cliente removido.");
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input 
                    value={novoCliente.cnpj} 
                    onChange={e => setNovoCliente({...novoCliente, cnpj: e.target.value})}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Save className="mr-2 h-4 w-4" /> Salvar Cliente
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
                {clientesFiltrados.map(cliente => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">{cliente.nome}</TableCell>
                    <TableCell>{cliente.cnpj}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                        {cliente.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => removerCliente(cliente.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}