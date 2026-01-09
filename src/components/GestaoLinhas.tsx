import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Route, Plus, Save, X, Trash2, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

// IMPORTANTE: Para a Vercel, mude para variável de ambiente
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

interface LinhaCadastrada {
  id: string;
  codigo: string;
  nome: string;
  clienteId: string;
  clienteNome: string;
  garagemId: string;
  garagemNome: string;
  turnoNome: string;   // Adicionado
  sentidoNome: string; // Adicionado
}

export function GestaoLinhas({ onVoltar }: { onVoltar: () => void }) {
  const [isCriando, setIsCriando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linhas, setLinhas] = useState<LinhaCadastrada[]>([]);
  
  // Listas para os Selects
  const [clientesCadastrados, setClientesCadastrados] = useState<{id: string, nome: string}[]>([]);
  const [garagensCadastradas, setGaragensCadastradas] = useState<{id: string, nome: string}[]>([]);
  const [turnosCadastrados, setTurnosCadastrados] = useState<{id: string, descricao: string}[]>([]);     // Ajustado para descricao
  const [sentidosCadastrados, setSentidosCadastrados] = useState<{id: string, descricao: string}[]>([]); // Ajustado para descricao
  
  // Estado do formulário atualizado
  const [novaLinha, setNovaLinha] = useState({ 
    codigo: '', 
    nome: '', 
    clienteId: '', 
    garagemId: '', 
    turnoId: '',    // Novo
    sentidoId: ''   // Novo
  });

  // Carregar dados via API
  async function carregarDados() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/linhas/dados-completos`);
      if (!response.ok) {
        throw new Error('Não foi possível obter dados do servidor.');
      }
      const data = await response.json();
      
      setClientesCadastrados(Array.isArray(data.clientes) ? data.clientes : []);
      setGaragensCadastradas(Array.isArray(data.garagens) ? data.garagens : []);
      setTurnosCadastrados(Array.isArray(data.turnos) ? data.turnos : []);     // Preenche select Turnos
      setSentidosCadastrados(Array.isArray(data.sentidos) ? data.sentidos : []); // Preenche select Sentidos
      setLinhas(Array.isArray(data.linhas) ? data.linhas : []);
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação atualizada
    if (!novaLinha.codigo || !novaLinha.clienteId || !novaLinha.nome || !novaLinha.garagemId || !novaLinha.turnoId || !novaLinha.sentidoId) {
      toast.error("Preencha todos os campos, incluindo turno e sentido!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/linhas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: novaLinha.codigo,
          nome: novaLinha.nome,
          cliente_id: novaLinha.clienteId,
          garagem_id: novaLinha.garagemId,
          turno_id: novaLinha.turnoId,     // Enviando Turno
          sentido_id: novaLinha.sentidoId  // Enviando Sentido
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
      toast.success('Linha cadastrada com sucesso!');
      setIsCriando(false);
      setNovaLinha({ codigo: '', nome: '', clienteId: '', garagemId: '', turnoId: '', sentidoId: '' });
      carregarDados();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const removerLinha = async (id: string) => {
    if (!confirm("Deseja remover esta linha?")) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/linhas/${id}`, {
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
      toast.success('Linha removida.');
      carregarDados();
    } catch (error: any) {
      toast.error('Erro ao remover: ' + error.message);
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
              {/* Grid ajustado para comportar os novos campos */}
              <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select 
                    value={novaLinha.clienteId}
                    onValueChange={(val) => setNovaLinha({...novaLinha, clienteId: val})}
                    disabled={loading}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {clientesCadastrados.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Garagem</Label>
                  <Select 
                    value={novaLinha.garagemId}
                    onValueChange={(val) => setNovaLinha({...novaLinha, garagemId: val})}
                    disabled={loading}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {garagensCadastradas.map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* NOVO CAMPO: Turno */}
                <div className="space-y-2">
                  <Label>Turno</Label>
                  <Select 
                    value={novaLinha.turnoId}
                    onValueChange={(val) => setNovaLinha({...novaLinha, turnoId: val})}
                    disabled={loading}
                  >
                    <SelectTrigger><SelectValue placeholder="Turno" /></SelectTrigger>
                    <SelectContent>
                      {turnosCadastrados.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.descricao}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* NOVO CAMPO: Sentido */}
                <div className="space-y-2">
                  <Label>Sentido</Label>
                  <Select 
                    value={novaLinha.sentidoId}
                    onValueChange={(val) => setNovaLinha({...novaLinha, sentidoId: val})}
                    disabled={loading}
                  >
                    <SelectTrigger><SelectValue placeholder="Sentido" /></SelectTrigger>
                    <SelectContent>
                      {sentidosCadastrados.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.descricao}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cód. Linha</Label>
                  <Input 
                    value={novaLinha.codigo} 
                    onChange={e => setNovaLinha({...novaLinha, codigo: e.target.value})} 
                    placeholder="ROTA-01" 
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label>Descrição da Rota</Label>
                  <Input 
                    value={novaLinha.nome} 
                    onChange={e => setNovaLinha({...novaLinha, nome: e.target.value})} 
                    placeholder="Ex: Centro x Industrial" 
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="bg-green-600 text-white hover:bg-green-700 lg:col-span-1" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar
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
                  <TableHead>Garagem</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Sentido</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && linhas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
                    </TableCell>
                  </TableRow>
                ) : (
                  linhas.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium text-blue-700">{l.clienteNome}</TableCell>
                      <TableCell className="text-slate-600 font-semibold">{l.garagemNome}</TableCell>
                      <TableCell className="text-orange-600 font-medium">{l.turnoNome}</TableCell>
                      <TableCell className="text-slate-600 italic">{l.sentidoNome}</TableCell>
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