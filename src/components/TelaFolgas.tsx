import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"; 
import { ArrowLeft, Search, CalendarDays, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '../types';

// URL da sua API centralizada
const API_URL = "http://localhost:3333/api";

interface TelaFolgasProps {
  onVoltar: () => void;
  userRole: UserRole;
}

export function TelaFolgas({ onVoltar, userRole }: TelaFolgasProps) {
  const [motoristas, setMotoristas] = useState<any[]>([]);
  const [garagens, setGaragens] = useState<any[]>([]);
  const [folgas, setFolgas] = useState<any[]>([]);
  
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  const [garagemFiltroId, setGaragemFiltroId] = useState(''); 
  const [motoristaSelecionado, setMotoristaSelecionado] = useState<any>(null);
  const [novaData, setNovaData] = useState('');

  const podeEditar = userRole === 'admin' || userRole === 'escalante';

  useEffect(() => {
    fetchDados();
  }, []);

  async function fetchDados() {
    try {
      setLoading(true);
      // Agora buscamos da nossa API Node.js
      const [resM, resG, resF] = await Promise.all([
        fetch(`${API_URL}/motoristas`),
        fetch(`${API_URL}/garagens`),
        fetch(`${API_URL}/folgas`)
      ]);

      const [m, g, f] = await Promise.all([
        resM.json(), resG.json(), resF.json()
      ]);

      setMotoristas(m || []);
      setGaragens(g || []);
      setFolgas(f || []);
    } catch (error: any) {
      toast.error("Erro ao carregar dados do servidor.");
    } finally {
      setLoading(false);
    }
  }

  const handleSelecionarMotorista = (id: string) => {
    // Usando String() para garantir a comparação correta de IDs
    const mot = motoristas.find(m => String(m.id) === String(id));
    setMotoristaSelecionado(mot);
  };

  const handleAdicionarFolga = async () => {
    if (!motoristaSelecionado || !novaData) {
      toast.error("Preencha o motorista e a data.");
      return;
    }

    try {
      setSaving(true);
      
      const response = await fetch(`${API_URL}/folgas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motorista_id: motoristaSelecionado.id,
          garagem_id: motoristaSelecionado.garagem_id,
          data_folga: novaData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Exibe a mensagem de erro vinda do backend (ex: motorista já tem folga)
        throw new Error(data.error || "Erro ao salvar folga");
      }

      toast.success("Folga registrada!");
      setMostrarForm(false);
      setMotoristaSelecionado(null);
      setNovaData('');
      fetchDados();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExcluirFolga = async (id: string) => {
    if (!confirm("Deseja excluir esta folga?")) return;
    try {
      const response = await fetch(`${API_URL}/folgas/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error("Erro ao excluir no servidor");

      toast.success("Registro removido.");
      fetchDados();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  const motoristasFiltradosPelaGaragem = garagemFiltroId 
    ? motoristas.filter(m => String(m.garagem_id) === String(garagemFiltroId))
    : [];

  const filtradosTabela = folgas.filter(f => 
    f.motoristas?.nome.toLowerCase().includes(busca.toLowerCase()) || 
    f.garagens?.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="text-red-600 size-7" /> Gestão de Folgas
          </h1>
          <Button variant="outline" onClick={onVoltar} className="bg-white border-slate-300">
            <ArrowLeft className="size-4 mr-2" /> Voltar
          </Button>
        </header>

        {mostrarForm && (
          <Card className="mb-6 border-blue-200 bg-blue-50/50 shadow-sm animate-in fade-in zoom-in-95">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">1. Filtrar Garagem</label>
                  <Select value={garagemFiltroId} onValueChange={(val) => {
                    setGaragemFiltroId(val);
                    setMotoristaSelecionado(null);
                  }}>
                    <SelectTrigger className="bg-white border-slate-300">
                      <SelectValue placeholder="Selecione a garagem..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {garagens.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">2. Motorista</label>
                  <Select 
                    value={motoristaSelecionado?.id || ''} 
                    onValueChange={handleSelecionarMotorista}
                    disabled={!garagemFiltroId}
                  >
                    <SelectTrigger className="bg-white border-slate-300">
                      <SelectValue placeholder={garagemFiltroId ? "Escolha o motorista..." : "Selecione a garagem antes"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {motoristasFiltradosPelaGaragem.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">RE do Motorista</label>
                  <div className="h-10 px-3 flex items-center bg-slate-100 border border-slate-300 rounded-md font-mono font-bold text-slate-600">
                    {motoristaSelecionado?.numero_registro || '---'}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">Data da Folga</label>
                  <Input type="date" className="bg-white border-slate-300" value={novaData} onChange={(e) => setNovaData(e.target.value)} />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                <Button variant="ghost" onClick={() => {
                   setMostrarForm(false);
                   setGaragemFiltroId('');
                   setMotoristaSelecionado(null);
                }}>Cancelar</Button>
                <Button onClick={handleAdicionarFolga} disabled={saving || !motoristaSelecionado} className="bg-blue-600 hover:bg-blue-700 px-8">
                  {saving ? <Loader2 className="animate-spin size-4" /> : "Confirmar Lançamento"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg border-slate-200 overflow-hidden">
          <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input placeholder="Buscar por motorista ou garagem..." className="pl-10 h-10" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            {podeEditar && !mostrarForm && (
              <Button onClick={() => setMostrarForm(true)} className="bg-blue-600 hover:bg-blue-700 h-10 px-6 font-bold">
                <Plus className="size-4 mr-2" /> Nova Folga
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div> : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="text-sm font-black text-slate-700 uppercase">
                    <TableHead className="px-6 py-4">Nome do Motorista</TableHead>
                    <TableHead>RE</TableHead>
                    <TableHead>Garagem</TableHead>
                    <TableHead className="text-center">Data</TableHead>
                    <TableHead className="w-20 text-right px-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white">
                  {filtradosTabela.map((f) => (
                    <TableRow key={f.id} className="hover:bg-slate-50 border-b">
                      <TableCell className="px-6 py-4 font-black text-slate-800 text-base uppercase">
                        {f.motoristas?.nome}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-slate-500">
                        {f.motoristas?.numero_registro}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-md border border-blue-100 text-xs uppercase">
                          {f.garagens?.nome}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-black text-slate-700">
                        {new Date(f.data_folga + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <Button variant="ghost" size="sm" onClick={() => handleExcluirFolga(f.id)} className="text-slate-300 hover:text-red-600">
                          <Trash2 size={20} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}