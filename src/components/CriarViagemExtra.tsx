import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, Trash2, ArrowLeft, BusFront, Search, FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

interface ViagemExtra {
  id: string;
  data_viagem: string;
  garagem_id: string;
  cliente_id: string;
  cliente: string; 
  linha_id: string | null;
  linha: string;   
  descricao: string;
  motivo_viagem: string; 
  sentido_id: string;
  turno_codigo: string;
  inicio: string;
  tipo_veiculo_id: string;
  carro: string;
}

export function CriarViagemExtra({ onBack }: { onBack: () => void }) {
  const [viagens, setViagens] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [linhas, setLinhas] = useState<any[]>([]);
  const [garagens, setGaragens] = useState<any[]>([]);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [sentidos, setSentidos] = useState<any[]>([]);
  const [tiposVeiculo, setTiposVeiculo] = useState<any[]>([]);

  const [busca, setBusca] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [novaViagem, setNovaViagem] = useState<Partial<ViagemExtra>>({
    cliente_id: '',
    linha_id: null,
    sentido_id: '',
    turno_codigo: 'Extra',
    data_viagem: '',
    inicio: '',
    carro: '',
    descricao: '',
    motivo_viagem: '',
    tipo_veiculo_id: '',
    garagem_id: ''
  });

  useEffect(() => {
    fetchDados();
  }, []);

  async function fetchDados() {
    try {
      setLoading(true);
      const [v, c, l, g, t, s, tv] = await Promise.all([
        supabase.from('viagens_extras').select('*').order('data_viagem', { ascending: false }),
        supabase.from('clientes').select('*').order('nome'),
        supabase.from('linhas').select('*').order('codigo'),
        supabase.from('garagens').select('*').order('nome'),
        supabase.from('turnos').select('*').order('codigo'),
        supabase.from('sentidos').select('*').order('codigo'),
        supabase.from('tipos_veiculo').select('*').order('nome'),
      ]);

      setViagens(v.data || []);
      setClientes(c.data || []);
      setLinhas(l.data || []);
      setGaragens(g.data || []);
      setTurnos(t.data || []);
      setSentidos(s.data || []);
      setTiposVeiculo(tv.data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSalvarNovaViagem = async () => {
    if (!novaViagem.cliente_id || !novaViagem.data_viagem || !novaViagem.inicio || 
        !novaViagem.garagem_id || !novaViagem.tipo_veiculo_id || !novaViagem.sentido_id || !novaViagem.turno_codigo) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      setSaving(true);
      const cliNome = clientes.find(c => c.id === novaViagem.cliente_id)?.nome || '';
      const linCod = linhas.find(l => l.id === novaViagem.linha_id)?.codigo || '';

      const { error } = await supabase.from('viagens_extras').insert([{
        data_viagem: novaViagem.data_viagem,
        garagem_id: novaViagem.garagem_id,
        cliente_id: novaViagem.cliente_id,
        cliente: cliNome,
        linha_id: novaViagem.linha_id || null,
        linha: linCod,
        descricao: novaViagem.descricao || '',
        motivo_viagem: novaViagem.motivo_viagem || '',
        sentido_id: novaViagem.sentido_id,
        turno_codigo: novaViagem.turno_codigo,
        inicio: novaViagem.inicio,
        tipo_veiculo_id: novaViagem.tipo_veiculo_id,
        carro: novaViagem.carro || ''
      }]);

      if (error) throw error;
      toast.success("Viagem extra registrada!");
      setMostrarForm(false);
      setNovaViagem({ turno_codigo: 'Extra', linha_id: null });
      fetchDados();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const excluirViagem = async (id: string) => {
    if (!confirm("Deseja realmente excluir este registro?")) return;
    try {
      const { error } = await supabase.from('viagens_extras').delete().eq('id', id);
      if (error) throw error;
      toast.success("Registro removido!");
      fetchDados();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  const formatarDataSimples = (dataString: string) => {
    if (!dataString) return '';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  // Exportação ajustada conforme o modelo do arquivo enviado
  const exportarExcel = () => {
    if (viagens.length === 0) return;

    const datasUnicas = Array.from(new Set(viagens.map(v => v.data_viagem))).sort();
    const datasFormatadas = datasUnicas.map(d => formatarDataSimples(d));
    const consolidado: { [key: string]: any } = {};

    viagens.forEach(v => {
      const nomeCliente = v.cliente;
      const dataCol = formatarDataSimples(v.data_viagem);
      const nomeGaragem = garagens.find(g => g.id === v.garagem_id)?.nome || '';
      const nomeVeiculo = tiposVeiculo.find(tv => tv.id === v.tipo_veiculo_id)?.nome || '';
      const nomeSentido = sentidos.find(s => s.id === v.sentido_id)?.codigo || '';
      
      const chave = `${nomeGaragem}|${nomeCliente}|${nomeSentido}|${v.linha}|${v.turno_codigo}|${v.motivo_viagem}|${v.descricao}|${nomeVeiculo}`;
      
      if (!consolidado[chave]) {
        // Ordem das colunas conforme o seu arquivo CSV
        consolidado[chave] = { 
          Garagem: nomeGaragem,
          Cliente: nomeCliente, 
          Sentido: nomeSentido,
          Linha: v.linha,
          Turno: v.turno_codigo,
          Motivo: v.motivo_viagem || '',
          Descrição: v.descricao,
          Veiculo: nomeVeiculo 
        };
        // Inicializa as colunas de data
        datasFormatadas.forEach(df => consolidado[chave][df] = 0);
      }
      consolidado[chave][dataCol] += 1;
    });

    const ws = XLSX.utils.json_to_sheet(Object.values(consolidado));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório Geral");
    XLSX.writeFile(wb, "Escala_Viagens_Extras.xlsx");
    toast.success("Excel gerado no padrão solicitado!");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[98%] mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BusFront className="text-orange-600 size-7" /> Viagens Extras
          </h1>
          <div className="flex gap-2">
            <Button onClick={exportarExcel} variant="outline" className="border-green-600 text-green-700 hover:bg-green-50 bg-white shadow-sm">
              <FileDown className="size-4 mr-2" /> Exportar Excel
            </Button>
            <Button variant="outline" onClick={onBack} className="bg-white border-slate-300">
              <ArrowLeft className="size-4 mr-2" /> Voltar
            </Button>
          </div>
        </header>

        {mostrarForm && (
          <Card className="mb-8 border-orange-200 bg-orange-50/40 shadow-sm">
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Data</label>
                  <Input type="date" value={novaViagem.data_viagem} onChange={e => setNovaViagem({...novaViagem, data_viagem: e.target.value})} className="bg-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Garagem</label>
                  <Select value={novaViagem.garagem_id} onValueChange={val => setNovaViagem({...novaViagem, garagem_id: val})}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {garagens.map(g => <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Cliente</label>
                  <Select value={novaViagem.cliente_id} onValueChange={val => setNovaViagem({...novaViagem, cliente_id: val, linha_id: null})}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Linha (Opcional)</label>
                  <Select 
                    value={novaViagem.linha_id || 'none'} 
                    onValueChange={val => {
                      const id = val === 'none' ? null : val;
                      const linhaObj = linhas.find(l => l.id === id);
                      setNovaViagem({...novaViagem, linha_id: id, descricao: linhaObj?.nome || novaViagem.descricao});
                    }}
                    disabled={!novaViagem.cliente_id}
                  >
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Cod." /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="none">Nenhuma / Manual</SelectItem>
                      {linhas.filter(l => l.cliente_id === novaViagem.cliente_id).map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.codigo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Descrição (Manual)</label>
                  <Input 
                    value={novaViagem.descricao} 
                    onChange={e => setNovaViagem({...novaViagem, descricao: e.target.value})} 
                    className="bg-white" 
                    placeholder="Descrição da rota..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-end">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Motivo da Viagem</label>
                  <Input 
                    value={novaViagem.motivo_viagem} 
                    onChange={e => setNovaViagem({...novaViagem, motivo_viagem: e.target.value})} 
                    placeholder="Ex: Carro quebrou, Solicitação cliente..."
                    className="bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Horário</label>
                  <Input type="time" value={novaViagem.inicio} onChange={e => setNovaViagem({...novaViagem, inicio: e.target.value})} className="bg-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Turno</label>
                  <Select value={novaViagem.turno_codigo} onValueChange={val => setNovaViagem({...novaViagem, turno_codigo: val})}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {turnos.map(t => <SelectItem key={t.id} value={t.codigo}>{t.codigo}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Veículo</label>
                  <Select value={novaViagem.tipo_veiculo_id} onValueChange={val => setNovaViagem({...novaViagem, tipo_veiculo_id: val})}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Tipo..." /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {tiposVeiculo.map(tv => <SelectItem key={tv.id} value={tv.id}>{tv.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Sentido</label>
                  <Select value={novaViagem.sentido_id} onValueChange={val => setNovaViagem({...novaViagem, sentido_id: val})}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Sentido" /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {sentidos.map(s => <SelectItem key={s.id} value={s.id}>{s.codigo}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={handleSalvarNovaViagem} 
                    disabled={saving}
                    className="bg-orange-600 hover:bg-orange-700 text-white flex-1 font-bold h-10"
                  >
                    {saving ? <Loader2 className="animate-spin" /> : "Salvar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg border-slate-200 overflow-hidden">
          <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input placeholder="Filtrar por cliente ou garagem..." className="pl-10 h-10" value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
            {!mostrarForm && (
              <Button onClick={() => setMostrarForm(true)} className="bg-orange-600 hover:bg-orange-700 text-white font-bold h-10 px-6">
                <Plus className="size-4 mr-2" /> Adicionar Viagem Extra
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-orange-600" /></div> : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="text-sm uppercase font-black text-slate-700">
                    <TableHead className="px-6 py-5">Data / Garagem</TableHead>
                    <TableHead>Cliente / Descrição</TableHead>
                    <TableHead>Motivo da Viagem</TableHead>
                    <TableHead className="text-center">Turno / Sentido</TableHead>
                    <TableHead className="text-center">Início</TableHead>
                    <TableHead className="text-center">Veículo</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white">
                  {viagens.filter(v => 
                    v.cliente.toLowerCase().includes(busca.toLowerCase()) || 
                    garagens.find(g => g.id === v.garagem_id)?.nome.toLowerCase().includes(busca.toLowerCase())
                  ).map((v) => (
                    <TableRow key={v.id} className="hover:bg-slate-50 border-b last:border-none transition-colors">
                      <TableCell className="px-6 py-4">
                        <span className="text-base font-black text-slate-800">{formatarDataSimples(v.data_viagem)}</span>
                        <div className="text-[11px] text-orange-600 font-black uppercase tracking-wider mt-1">
                          {garagens.find(g => g.id === v.garagem_id)?.nome}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="text-base font-black text-blue-800 uppercase tracking-tight leading-none">{v.cliente}</span>
                          <span className="text-sm text-slate-600 font-bold mt-1 italic">{v.descricao}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded border border-slate-200">
                          {v.motivo_viagem || "Não informado"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-slate-800">{v.turno_codigo}</span>
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 rounded-full border border-blue-100 uppercase">
                             {sentidos.find(s => s.id === v.sentido_id)?.codigo}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <span className="text-lg font-black text-slate-900 bg-yellow-50 px-3 py-1 rounded-md border border-yellow-200">
                          {v.inicio?.slice(0,5)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <span className="text-xs font-black text-slate-500 uppercase">
                          {tiposVeiculo.find(tv => tv.id === v.tipo_veiculo_id)?.nome}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => excluirViagem(v.id)} className="text-slate-300 hover:text-red-600 hover:bg-red-50 transition-all">
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