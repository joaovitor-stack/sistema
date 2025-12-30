import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"; 
import { ArrowLeft, Search, CalendarDays, Plus, Trash2, Loader2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '../types';
import { supabase } from '../lib/supabase';

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

  // Estados do formulário
  const [garagemFiltroId, setGaragemFiltroId] = useState(''); // Filtro para motoristas
  const [motoristaSelecionado, setMotoristaSelecionado] = useState<any>(null);
  const [novaData, setNovaData] = useState('');

  const podeEditar = userRole === 'admin' || userRole === 'escalante';

  useEffect(() => {
    fetchDados();
  }, []);

  async function fetchDados() {
    try {
      setLoading(true);
      const [m, g, f] = await Promise.all([
        supabase.from('motoristas').select('*').order('nome'),
        supabase.from('garagens').select('*').order('nome'),
        supabase.from('folgas').select(`
          *,
          motoristas (nome, numero_registro),
          garagens (nome)
        `).order('data_folga', { ascending: false })
      ]);

      setMotoristas(m.data || []);
      setGaragens(g.data || []);
      setFolgas(f.data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  // Quando seleciona o motorista, pegamos o objeto completo dele
  const handleSelecionarMotorista = (id: string) => {
    const mot = motoristas.find(m => m.id === id);
    setMotoristaSelecionado(mot);
  };

  const handleAdicionarFolga = async () => {
    if (!motoristaSelecionado || !novaData) {
      toast.error("Preencha o motorista e a data.");
      return;
    }

    const jaExiste = folgas.some(
      f => f.motorista_id === motoristaSelecionado.id && f.data_folga === novaData
    );

    if (jaExiste) {
      toast.error("Este motorista já possui uma folga registrada para este dia!");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from('folgas').insert([{
        motorista_id: motoristaSelecionado.id,
        garagem_id: motoristaSelecionado.garagem_id, // Usa a garagem do cadastro do motorista
        data_folga: novaData
      }]);

      if (error) throw error;

      toast.success("Folga registrada!");
      setMostrarForm(false);
      setMotoristaSelecionado(null);
      setNovaData('');
      fetchDados();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExcluirFolga = async (id: string) => {
    if (!confirm("Deseja excluir esta folga?")) return;
    try {
      const { error } = await supabase.from('folgas').delete().eq('id', id);
      if (error) throw error;
      toast.success("Registro removido.");
      fetchDados();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  const motoristasFiltradosPelaGaragem = garagemFiltroId 
    ? motoristas.filter(m => m.garagem_id === garagemFiltroId)
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
                {/* 1. Selecionar Garagem primeiro para filtrar */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">1. Filtrar Garagem</label>
                  <Select value={garagemFiltroId} onValueChange={(val) => {
                    setGaragemFiltroId(val);
                    setMotoristaSelecionado(null); // Limpa motorista se mudar garagem
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

                {/* 2. Selecionar Motorista (apenas daquela garagem) */}
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
                
                {/* RE automático e separado */}
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