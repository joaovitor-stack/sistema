import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Route, Plus, Save, X, Trash2 } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

interface LinhaCadastrada {
  id: string;
  codigo: string;
  nome: string;
  clienteId: string;
  clienteNome: string;
}

export function GestaoLinhas({ onVoltar }: { onVoltar: () => void }) {
  const [isCriando, setIsCriando] = useState(false);
  const [linhas, setLinhas] = useState<LinhaCadastrada[]>([]);
  const [clientesCadastrados, setClientesCadastrados] = useState<{id: string, nome: string}[]>([]);
  const [novaLinha, setNovaLinha] = useState({ codigo: '', nome: '', clienteId: '' });

  // Carregar Clientes e Linhas do localStorage
  useEffect(() => {
    const clientesSalvos = JSON.parse(localStorage.getItem('maxtour_clientes') || '[]');
    const linhasSalvas = JSON.parse(localStorage.getItem('maxtour_linhas') || '[]');
    setClientesCadastrados(clientesSalvos);
    setLinhas(linhasSalvas);
  }, []);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    const cliente = clientesCadastrados.find(c => c.id === novaLinha.clienteId);
    
    if (!novaLinha.codigo || !novaLinha.clienteId) {
      toast.error("Selecione o cliente e o código da linha!");
      return;
    }

    const item: LinhaCadastrada = {
      id: Math.random().toString(36).substr(2, 9),
      codigo: novaLinha.codigo,
      nome: novaLinha.nome,
      clienteId: novaLinha.clienteId,
      clienteNome: cliente?.nome || 'Cliente não encontrado'
    };

    const novaLista = [...linhas, item];
    setLinhas(novaLista);
    localStorage.setItem('maxtour_linhas', JSON.stringify(novaLista)); // Salva para uso na Escala
    
    setIsCriando(false);
    setNovaLinha({ codigo: '', nome: '', clienteId: '' });
    toast.success("Linha vinculada com sucesso!");
  };

  const removerLinha = (id: string) => {
    const novaLista = linhas.filter(l => l.id !== id);
    setLinhas(novaLista);
    localStorage.setItem('maxtour_linhas', JSON.stringify(novaLista));
    toast.success("Linha removida.");
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
              <Button variant="ghost" size="sm" onClick={() => setIsCriando(false)}><X className="size-4" /></Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Selecione o Cliente</Label>
                  <Select onValueChange={(val) => setNovaLinha({...novaLinha, clienteId: val})}>
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
                  <Input value={novaLinha.codigo} onChange={e => setNovaLinha({...novaLinha, codigo: e.target.value})} placeholder="Ex: ROTA-01" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição da Rota</Label>
                  <Input value={novaLinha.nome} onChange={e => setNovaLinha({...novaLinha, nome: e.target.value})} placeholder="Ex: Centro x Industrial" />
                </div>
                <Button type="submit" className="bg-green-600 text-white hover:bg-green-700">
                  <Save className="mr-2 h-4 w-4" /> Salvar Linha
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Relação Linha x Cliente</CardTitle>
            <Button onClick={() => setIsCriando(true)} className="bg-green-600 text-white hover:bg-green-700">
              <Plus className="size-4 mr-2" /> Vincular Linha
            </Button>
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
                {linhas.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium text-blue-700">{l.clienteNome}</TableCell>
                    <TableCell className="font-bold">{l.codigo}</TableCell>
                    <TableCell>{l.nome}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => removerLinha(l.id)}>
                        <Trash2 className="size-4 text-red-500" />
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