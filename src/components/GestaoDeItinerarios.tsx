import { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { MapPin, Plus, Trash2, ArrowLeft, Save, Printer, Search, FileDown, Edit2, X, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { supabase } from '../lib/supabase';

// --- INTERFACES ---
interface Parada {
  id: string;
  ordem: number;
  horario: string;
  referencia: string;
  endereco: string;
  bairro: string;
}

interface Itinerario {
  id: string;
  clienteId: string;
  nomeCliente: string;
  linhaId: string;
  nomeLinha: string;
  garagem: string; // No código trataremos como o ID da garagem para o banco
  turno: string;
  tipoVeiculo: string; // No código trataremos como o ID do tipo para o banco
  diasSemana: string[];
  paradas: Parada[];
  dataUltimaAtualizacao?: string;
  // Campos auxiliares para exibição
  garagem_nome?: string; 
}

const DIAS_OPCOES = [
  { id: 'SEG', label: 'Seg', dbId: 2 }, 
  { id: 'TER', label: 'Ter', dbId: 3 }, 
  { id: 'QUA', label: 'Qua', dbId: 4 },
  { id: 'QUI', label: 'Qui', dbId: 5 }, 
  { id: 'SEX', label: 'Sex', dbId: 6 }, 
  { id: 'SAB', label: 'Sáb', dbId: 7 },
  { id: 'DOM', label: 'Dom', dbId: 1 }
];

export function GestaoItinerarios({ onBack }: { onBack: () => void }) {
  const [clientes, setClientes] = useState<any[]>([]);
  const [linhasExistentes, setLinhasExistentes] = useState<any[]>([]);
  const [itinerarios, setItinerarios] = useState<Itinerario[]>([]);
  
  // NOVOS ESTADOS PARA RESOLVER O ERRO DE FK
  const [garagensLista, setGaragensLista] = useState<any[]>([]);
  const [tiposVeiculoLista, setTiposVeiculoLista] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [busca, setBusca] = useState('');
  const [itemParaImpressao, setItemParaImpressao] = useState<Itinerario | null>(null);
  const [visualizarItin, setVisualizarItin] = useState<Itinerario | null>(null);

  const [novoItin, setNovoItin] = useState<Partial<Itinerario>>({
    id: '', clienteId: '', nomeCliente: '', linhaId: '', nomeLinha: '', garagem: '', turno: '', tipoVeiculo: '', diasSemana: [], paradas: []
  });

  const [novaParada, setNovaParada] = useState<Partial<Parada>>({
    horario: '', referencia: '', endereco: '', bairro: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      // Carrega dados de apoio
      const { data: clis } = await supabase.from('clientes').select('*').order('nome');
      const { data: lins } = await supabase.from('linhas').select('id, nome, cliente_id').order('nome');
      
      // AJUSTE: Buscar garagens e tipos de veículos reais do banco
      const { data: gars } = await supabase.from('garagens').select('*').order('nome');
      const { data: tpsV } = await supabase.from('tipos_veiculo').select('*').order('nome');
      
      setGaragensLista(gars || []);
      setTiposVeiculoLista(tpsV || []);

      const { data: itins, error } = await supabase
        .from('itinerarios')
        .select(`
          *,
          garagens(nome),
          itinerarios_dias(dia_id, dias_semana(codigo)),
          itinerario_paradas(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const itinsMapped = (itins || []).map(i => ({
        id: i.id,
        clienteId: i.cliente_id,
        nomeCliente: i.nome_cliente_snapshot,
        linhaId: i.linha_id,
        nomeLinha: i.nome_linha_snapshot,
        garagem: i.garagem_id, // Guardamos o UUID
        garagem_nome: i.garagens?.nome, // Para exibição amigável
        turno: i.turno_codigo,
        tipoVeiculo: i.tipo_veiculo_id,
        dataUltimaAtualizacao: i.data_ultima_atualizacao,
        diasSemana: i.itinerarios_dias?.map((d: any) => d.dias_semana.codigo) || [],
        paradas: i.itinerario_paradas?.sort((a: any, b: any) => a.ordem - b.ordem) || []
      }));

      setClientes(clis || []);
      setLinhasExistentes(lins || []);
      setItinerarios(itinsMapped);
    } catch (error: any) {
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const salvarItinerario = async () => {
    if (!novoItin.clienteId || !novoItin.linhaId || !novoItin.garagem) return toast.error("Preencha cliente, linha e garagem");
    
    try {
      setLoading(true);
      const dataHoje = new Date().toISOString().split('T')[0];
      
      const payloadItin = {
        id: novoItin.id || undefined,
        cliente_id: novoItin.clienteId,
        linha_id: novoItin.linhaId,
        nome_cliente_snapshot: novoItin.nomeCliente,
        nome_linha_snapshot: novoItin.nomeLinha,
        garagem_id: novoItin.garagem, // Aqui agora vai o UUID do Select
        turno_codigo: novoItin.turno,
        tipo_veiculo_id: novoItin.tipoVeiculo, // Aqui agora vai o UUID do Select
        data_ultima_atualizacao: dataHoje
      };

      const { data: itinSalvo, error: errorItin } = await supabase
        .from('itinerarios')
        .upsert(payloadItin)
        .select()
        .single();

      if (errorItin) throw errorItin;

      const currentItinId = itinSalvo.id;

      // Salvar Dias
      await supabase.from('itinerarios_dias').delete().eq('itinerario_id', currentItinId);
      if (novoItin.diasSemana && novoItin.diasSemana.length > 0) {
        const diasData = novoItin.diasSemana.map(cod => ({
          itinerario_id: currentItinId,
          dia_id: DIAS_OPCOES.find(d => d.id === cod)?.dbId
        }));
        await supabase.from('itinerarios_dias').insert(diasData);
      }

      // Salvar Paradas
      await supabase.from('itinerario_paradas').delete().eq('itinerario_id', currentItinId);
      if (novoItin.paradas && novoItin.paradas.length > 0) {
        const paradasData = novoItin.paradas.map(p => ({
          itinerario_id: currentItinId,
          ordem: p.ordem,
          horario: p.horario,
          referencia: p.referencia,
          bairro: p.bairro,
          endereco: p.endereco
        }));
        await supabase.from('itinerario_paradas').insert(paradasData);
      }

      toast.success("Itinerário salvo com sucesso!");
      setModoEdicao(false);
      setNovoItin({ id: '', clienteId: '', nomeCliente: '', linhaId: '', nomeLinha: '', garagem: '', turno: '', tipoVeiculo: '', diasSemana: [], paradas: [] });
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const itinerariosFiltrados = useMemo(() => {
    return itinerarios.filter(itin => 
      itin.nomeCliente?.toLowerCase().includes(busca.toLowerCase()) ||
      itin.nomeLinha?.toLowerCase().includes(busca.toLowerCase()) ||
      itin.garagem_nome?.toLowerCase().includes(busca.toLowerCase())
    );
  }, [busca, itinerarios]);

  const linhasFiltradas = useMemo(() => {
    if (!novoItin.clienteId) return [];
    return linhasExistentes.filter(linha => linha.cliente_id === novoItin.clienteId);
  }, [novoItin.clienteId, linhasExistentes]);

  // --- FUNÇÕES DE EXPORTAÇÃO E IMPRESSÃO (PRESERVADAS) ---
  const handleExportarPDF = (itin: Itinerario) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFontSize(14);
    doc.text("MAXTOUR - FICHA DE ITINERÁRIO", 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`CLIENTE: ${itin.nomeCliente?.toUpperCase()}`, 14, 25);
    doc.text(`LINHA: ${itin.nomeLinha?.toUpperCase()}`, 14, 31);
    doc.text(`TURNO: ${itin.turno} | DIAS: ${itin.diasSemana?.join(', ')}`, 14, 37);

    const tableRows = itin.paradas?.map(p => [p.ordem, p.horario, p.referencia?.toUpperCase(), p.bairro?.toUpperCase()]) || [];
    autoTable(doc, {
      startY: 42,
      head: [['ORD', 'HORÁRIO', 'REFERÊNCIA / PONTO', 'BAIRRO']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255] },
    });
    doc.save(`ITIN_${itin.nomeLinha?.replace(/\s+/g, '_')}.pdf`);
  };

  const handleImprimir = (itin: Itinerario) => {
    setItemParaImpressao(itin);
    setTimeout(() => { window.print(); }, 300);
  };

  const handleEditar = (itin: Itinerario) => {
    setNovoItin({ ...itin });
    setModoEdicao(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const adicionarParada = () => {
    if (!novaParada.horario || !novaParada.referencia) return toast.error("Preencha horário e referência");
    const parada: Parada = {
      ...novaParada as Parada,
      id: Date.now().toString(),
      ordem: (novoItin.paradas?.length || 0) + 1
    };
    setNovoItin({ ...novoItin, paradas: [...(novoItin.paradas || []), parada] });
    setNovaParada({ horario: '', referencia: '', endereco: '', bairro: '' });
  };

  const excluirItinerario = async (id: string) => {
    if(!confirm("Deseja realmente excluir este itinerário?")) return;
    try {
      const { error } = await supabase.from('itinerarios').delete().eq('id', id);
      if (error) throw error;
      toast.success("Excluído com sucesso");
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* AREA DE IMPRESSAO (PRESERVADA) */}
      <div className="hidden print:block p-8 bg-white text-black">
        {itemParaImpressao && (
          <div className="border-2 border-black p-4">
            <h1 className="text-2xl font-bold text-center border-b-2 border-black mb-4 pb-2">MAXTOUR - FICHA DE ITINERÁRIO</h1>
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div><strong>CLIENTE:</strong> {itemParaImpressao.nomeCliente}</div>
              <div><strong>LINHA:</strong> {itemParaImpressao.nomeLinha}</div>
              <div><strong>DIAS:</strong> {itemParaImpressao.diasSemana?.join(', ')}</div>
            </div>
            <table className="w-full border-collapse border border-black">
              <thead>
                <tr className="bg-slate-100"><th className="border border-black p-1">ORD</th><th className="border border-black p-1">HORA</th><th className="border border-black p-1">REFERÊNCIA</th><th className="border border-black p-1">BAIRRO</th></tr>
              </thead>
              <tbody>
                {itemParaImpressao.paradas?.map(p => (
                  <tr key={p.id}><td className="border border-black p-1 text-center">{p.ordem}</td><td className="border border-black p-1 text-center font-bold">{p.horario}</td><td className="border border-black p-1 uppercase text-xs">{p.referencia}</td><td className="border border-black p-1 uppercase text-xs">{p.bairro}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto print:hidden">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><MapPin className="text-orange-600" /> Itinerários</h1>
            <p className="text-slate-500 text-xs">Gestão de rotas e pontos de parada</p>
          </div>
          <div className="flex gap-2">
             <Button onClick={() => setModoEdicao(!modoEdicao)} variant={modoEdicao ? "outline" : "default"} className={!modoEdicao ? "bg-orange-600 hover:bg-orange-700" : ""}>
                {modoEdicao ? <X className="size-4 mr-2" /> : <Plus className="size-4 mr-2" />}
                {modoEdicao ? "Cancelar" : "Novo Itinerário"}
             </Button>
             <Button variant="outline" onClick={onBack}><ArrowLeft className="size-4 mr-2" /> Voltar</Button>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mb-2" />
            <p>Processando...</p>
          </div>
        ) : modoEdicao ? (
          <div className="space-y-6">
            <Card className="border-orange-200">
                <CardHeader className="bg-orange-50/50 py-3"><CardTitle className="text-xs font-bold uppercase text-orange-800">Configuração da Linha</CardTitle></CardHeader>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                     <label className="text-[10px] font-bold uppercase text-slate-500">Garagem</label>
                     {/* AJUSTE: O valor agora é o ID da garagem vindo do banco */}
                     <Select value={novoItin.garagem} onValueChange={(v) => setNovoItin({...novoItin, garagem: v})}>
                         <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                         <SelectContent className="bg-white">
                             {garagensLista.map(g => (
                               <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
                             ))}
                         </SelectContent>
                     </Select>
                  </div>
                  <div>
                     <label className="text-[10px] font-bold uppercase text-slate-500">Cliente</label>
                     <Select value={novoItin.clienteId} onValueChange={(v) => {
                         const c = clientes.find(cl => cl.id === v);
                         setNovoItin({...novoItin, clienteId: v, nomeCliente: c?.nome, linhaId: '', nomeLinha: ''});
                     }}>
                         <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                         <SelectContent className="bg-white">
                             {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                         </SelectContent>
                     </Select>
                  </div>
                  <div>
                     <label className="text-[10px] font-bold uppercase text-slate-500">Linha</label>
                     <Select value={novoItin.linhaId} onValueChange={(v) => {
                         const l = linhasExistentes.find(lin => lin.id === v);
                         setNovoItin({...novoItin, linhaId: v, nomeLinha: l?.nome});
                     }} disabled={!novoItin.clienteId}>
                         <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                         <SelectContent className="bg-white">
                             {linhasFiltradas.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
                         </SelectContent>
                     </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                     <div>
                         <label className="text-[10px] font-bold uppercase text-slate-500">Turno</label>
                         <Select value={novoItin.turno} onValueChange={(v) => setNovoItin({...novoItin, turno: v})}>
                             <SelectTrigger className="bg-white"><SelectValue placeholder="Turno" /></SelectTrigger>
                             <SelectContent className="bg-white">
                                 <SelectItem value="T1">T1</SelectItem><SelectItem value="T2">T2</SelectItem><SelectItem value="T3">T3</SelectItem><SelectItem value="ADM">ADM</SelectItem>
                             </SelectContent>
                         </Select>
                     </div>
                     <div>
                         <label className="text-[10px] font-bold uppercase text-slate-500">Veículo</label>
                         {/* AJUSTE: O valor agora é o ID do tipo de veículo vindo do banco */}
                         <Select value={novoItin.tipoVeiculo} onValueChange={(v) => setNovoItin({...novoItin, tipoVeiculo: v})}>
                             <SelectTrigger className="bg-white"><SelectValue placeholder="Tipo" /></SelectTrigger>
                             <SelectContent className="bg-white">
                                 {tiposVeiculoLista.map(tv => (
                                   <SelectItem key={tv.id} value={tv.id}>{tv.nome}</SelectItem>
                                 ))}
                             </SelectContent>
                         </Select>
                     </div>
                  </div>
                  <div className="md:col-span-4 flex flex-wrap gap-2 pt-2">
                     {DIAS_OPCOES.map(dia => (
                       <Button key={dia.id} type="button" variant={novoItin.diasSemana?.includes(dia.id) ? "default" : "outline"} className="h-8 text-[10px]" onClick={() => {
                         const atuais = novoItin.diasSemana || [];
                         setNovoItin({...novoItin, diasSemana: atuais.includes(dia.id) ? atuais.filter(d => d !== dia.id) : [...atuais, dia.id]});
                       }}>{dia.id}</Button>
                     ))}
                  </div>
                </CardContent>
             </Card>

             <Card>
                <CardHeader className="bg-slate-50 py-3"><CardTitle className="text-xs font-bold uppercase text-slate-700">Adicionar Paradas</CardTitle></CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end mb-6">
                     <div className="md:col-span-1">
                         <label className="text-[10px] font-bold">Horário</label>
                         <Input type="time" value={novaParada.horario} onChange={e => setNovaParada({...novaParada, horario: e.target.value})} />
                     </div>
                     <div className="md:col-span-2">
                         <label className="text-[10px] font-bold">Referência / Ponto</label>
                         <Input value={novaParada.referencia} onChange={e => setNovaParada({...novaParada, referencia: e.target.value})} placeholder="Ex: Portaria 1" />
                     </div>
                     <div className="md:col-span-1">
                         <label className="text-[10px] font-bold">Bairro</label>
                         <Input value={novaParada.bairro} onChange={e => setNovaParada({...novaParada, bairro: e.target.value})} placeholder="Bairro" />
                     </div>
                     <Button onClick={adicionarParada} className="bg-orange-600"><Plus className="size-4 mr-2" /> Adicionar</Button>
                  </div>

                  <Table>
                     <TableHeader className="bg-slate-50"><TableRow><TableHead className="w-16">ORD</TableHead><TableHead>HORA</TableHead><TableHead>REFERÊNCIA</TableHead><TableHead>BAIRRO</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                     <TableBody>
                         {novoItin.paradas?.map((p, idx) => (
                             <TableRow key={p.id}><TableCell>{idx + 1}</TableCell><TableCell className="font-bold">{p.horario}</TableCell><TableCell className="uppercase text-xs">{p.referencia}</TableCell><TableCell className="uppercase text-xs">{p.bairro}</TableCell>
                             <TableCell><Button variant="ghost" size="icon" onClick={() => setNovoItin({...novoItin, paradas: novoItin.paradas?.filter(item => item.id !== p.id)})} className="text-red-500"><Trash2 size={14}/></Button></TableCell></TableRow>
                         ))}
                     </TableBody>
                  </Table>

                  <div className="mt-6 flex justify-end">
                     <Button onClick={salvarItinerario} className="bg-green-600"><Save className="mr-2" /> Salvar Itinerário</Button>
                  </div>
                </CardContent>
             </Card>
          </div>
        ) : (
          <>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input className="pl-10" placeholder="Buscar por cliente, linha ou garagem..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {itinerariosFiltrados.map(itin => (
                <Card key={itin.id} className="border-t-4 border-orange-500 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{itin.nomeCliente}</p>
                        <h3 className="font-bold text-sm uppercase leading-tight">{itin.nomeLinha}</h3>
                        <Badge variant="outline" className="text-[10px] mt-1">{itin.garagem_nome}</Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditar(itin)} className="size-8 text-blue-600"><Edit2 size={16} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => excluirItinerario(itin.id)} className="size-8 text-red-500"><Trash2 size={16} /></Button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                        {DIAS_OPCOES.map(dia => {
                          const ativo = itin.diasSemana?.includes(dia.id);
                          return (
                            <span key={dia.id} className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${ativo ? "bg-orange-100 border-orange-200 text-orange-700" : "bg-slate-50 border-slate-100 text-slate-300"}`}>
                              {dia.id}
                            </span>
                          );
                        })}
                    </div>

                    <div className="flex flex-wrap gap-1 mt-3">
                      <Badge variant="secondary" className="text-[9px] uppercase">{itin.turno}</Badge>
                      <Badge variant="outline" className="text-[9px] bg-slate-50">{itin.paradas?.length || 0} Paradas</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t">
                      <Button variant="outline" size="sm" onClick={() => setVisualizarItin(itin)} className="text-[9px] font-bold flex flex-col items-center gap-1 h-auto py-2">
                        <Eye size={14} className="text-slate-500" /> VER
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleImprimir(itin)} className="text-[9px] font-bold flex flex-col items-center gap-1 h-auto py-2">
                        <Printer size={14} className="text-slate-500" /> FICHA
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleExportarPDF(itin)} className="text-[9px] font-bold text-blue-600 border-blue-200 flex flex-col items-center gap-1 h-auto py-2">
                        <FileDown size={14} /> PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* DIALOG DE VISUALIZAÇÃO (PRESERVADO) */}
      <Dialog open={!!visualizarItin} onOpenChange={() => setVisualizarItin(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="uppercase border-b pb-2">
                <span className="text-orange-600 block text-xs font-bold">{visualizarItin?.nomeCliente}</span>
                {visualizarItin?.nomeLinha}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex gap-4 text-[10px] font-bold uppercase text-slate-500 bg-slate-50 p-2 rounded">
                <span>Turno: <span className="text-slate-900">{visualizarItin?.turno}</span></span>
                <span>Garagem: <span className="text-slate-900">{visualizarItin?.garagem_nome}</span></span>
                <span>Dias: <span className="text-slate-900">{visualizarItin?.diasSemana?.join(', ')}</span></span>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead className="h-8 text-[10px]">ORD</TableHead><TableHead className="h-8 text-[10px]">HORA</TableHead><TableHead className="h-8 text-[10px]">REFERÊNCIA</TableHead><TableHead className="h-8 text-[10px]">BAIRRO</TableHead></TableRow></TableHeader>
              <TableBody>
                {visualizarItin?.paradas?.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="py-2 text-xs px-2">{p.ordem}</td>
                    <td className="py-2 text-xs font-bold text-orange-600 px-2">{p.horario}</td>
                    <td className="py-2 text-[10px] uppercase font-medium px-2">{p.referencia}</td>
                    <td className="py-2 text-[10px] uppercase text-slate-500 px-2">{p.bairro}</td>
                  </tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}