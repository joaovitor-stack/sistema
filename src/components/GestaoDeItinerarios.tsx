import { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { MapPin, Plus, Trash2, ArrowLeft, Save, Printer, Building2, Search, FileDown, Edit2, X, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

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
  garagem: string; // Adicionado
  turno: string;
  tipoVeiculo: string;
  diasSemana: string[];
  paradas: Parada[];
  dataUltimaAtualizacao?: string;
}

const DIAS_OPCOES = [
  { id: 'SEG', label: 'Seg' }, { id: 'TER', label: 'Ter' }, { id: 'QUA', label: 'Qua' },
  { id: 'QUI', label: 'Qui' }, { id: 'SEX', label: 'Sex' }, { id: 'SAB', label: 'Sáb' },
  { id: 'DOM', label: 'Dom' }
];

export function GestaoItinerarios({ onBack }: { onBack: () => void }) {
  const [clientes, setClientes] = useState<any[]>([]);
  const [linhasExistentes, setLinhasExistentes] = useState<any[]>([]);
  const [itinerarios, setItinerarios] = useState<Itinerario[]>([]);
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
    const clientesSalvos = JSON.parse(localStorage.getItem('maxtour_clientes') || '[]');
    const linhasSalvas = JSON.parse(localStorage.getItem('maxtour_linhas') || '[]');
    const itinerariosSalvos = JSON.parse(localStorage.getItem('maxtour_itinerarios') || '[]');
    setClientes(clientesSalvos);
    setLinhasExistentes(linhasSalvas);
    setItinerarios(itinerariosSalvos);
  }, []);

  const itinerariosFiltrados = useMemo(() => {
    return itinerarios.filter(itin => 
      itin.nomeCliente.toLowerCase().includes(busca.toLowerCase()) ||
      itin.nomeLinha.toLowerCase().includes(busca.toLowerCase()) ||
      itin.garagem?.toLowerCase().includes(busca.toLowerCase())
    );
  }, [busca, itinerarios]);

  const linhasFiltradas = useMemo(() => {
    if (!novoItin.clienteId) return [];
    return linhasExistentes.filter(linha => linha.clienteId === novoItin.clienteId);
  }, [novoItin.clienteId, linhasExistentes]);

  // --- FUNÇÕES ---
  const handleExportarPDF = (itin: Itinerario) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFontSize(14);
    doc.text("MAXTOUR - FICHA DE ITINERÁRIO", 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`GARAGEM: ${itin.garagem.toUpperCase()}`, 14, 25);
    doc.text(`CLIENTE: ${itin.nomeCliente.toUpperCase()}`, 14, 31);
    doc.text(`LINHA: ${itin.nomeLinha.toUpperCase()}`, 14, 37);
    doc.text(`TURNO: ${itin.turno} | VEÍCULO: ${itin.tipoVeiculo} | DIAS: ${itin.diasSemana.join(', ')}`, 14, 43);

    const tableRows = itin.paradas.map(p => [p.ordem, p.horario, p.referencia.toUpperCase(), p.bairro.toUpperCase()]);
    autoTable(doc, {
      startY: 48,
      head: [['ORD', 'HORÁRIO', 'REFERÊNCIA / PONTO', 'BAIRRO']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255] },
    });
    doc.save(`ITIN_${itin.nomeLinha.replace(/\s+/g, '_')}.pdf`);
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

  const salvarItinerario = () => {
    if (!novoItin.clienteId || !novoItin.linhaId || !novoItin.garagem) return toast.error("Preencha cliente, linha e garagem");
    let novaLista;
    const dataHoje = new Date().toISOString().split('T')[0];

    if (novoItin.id) {
      novaLista = itinerarios.map(i => i.id === novoItin.id ? { ...novoItin as Itinerario, dataUltimaAtualizacao: dataHoje } : i);
      toast.success("Itinerário atualizado!");
    } else {
      const novoRegistro = { ...novoItin, id: Date.now().toString(), dataUltimaAtualizacao: dataHoje } as Itinerario;
      novaLista = [...itinerarios, novoRegistro];
      toast.success("Novo itinerário salvo!");
    }
    setItinerarios(novaLista);
    localStorage.setItem('maxtour_itinerarios', JSON.stringify(novaLista));
    setModoEdicao(false);
    setNovoItin({ id: '', clienteId: '', nomeCliente: '', linhaId: '', nomeLinha: '', garagem: '', turno: '', tipoVeiculo: '', diasSemana: [], paradas: [] });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
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

        {modoEdicao ? (
          <div className="space-y-6">
            <Card className="border-orange-200">
               <CardHeader className="bg-orange-50/50 py-3"><CardTitle className="text-xs font-bold uppercase text-orange-800">Configuração da Linha</CardTitle></CardHeader>
               <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500">Garagem</label>
                    <Select value={novoItin.garagem} onValueChange={(v) => setNovoItin({...novoItin, garagem: v})}>
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value="Extrema">Extrema</SelectItem>
                            <SelectItem value="Bragança Paulista">Bragança Paulista</SelectItem>
                            <SelectItem value="Cambuí - Camanducaia">Cambuí - Camanducaia</SelectItem>
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
                        <Select value={novoItin.tipoVeiculo} onValueChange={(v) => setNovoItin({...novoItin, tipoVeiculo: v})}>
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Tipo" /></SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="Ônibus">Ônibus</SelectItem><SelectItem value="Micro">Micro</SelectItem><SelectItem value="Van">Van</SelectItem>
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
                    <Button onClick={salvarItinerario} className="bg-green-600"><Save className="mr-2" /> Salvar Itinerário Completo</Button>
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
                        <p className="text-[9px] text-orange-600 font-bold mt-1 uppercase">📍 {itin.garagem}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditar(itin)} className="size-8 text-blue-600"><Edit2 size={16} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => {
                          if(confirm("Deseja excluir?")) {
                            const n = itinerarios.filter(i => i.id !== itin.id);
                            setItinerarios(n);
                            localStorage.setItem('maxtour_itinerarios', JSON.stringify(n));
                          }
                        }} className="size-8 text-red-500"><Trash2 size={16} /></Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-3">
                      <Badge variant="secondary" className="text-[9px] uppercase">{itin.turno}</Badge>
                      <Badge variant="outline" className="text-[9px] uppercase">{itin.tipoVeiculo}</Badge>
                      <Badge variant="outline" className="text-[9px] bg-slate-50">{itin.paradas.length} Paradas</Badge>
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

      {/* MODAL DE VISUALIZAÇÃO */}
      <Dialog open={!!visualizarItin} onOpenChange={() => setVisualizarItin(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="uppercase border-b pb-2">
                <span className="text-orange-600 block text-xs font-bold">{visualizarItin?.nomeCliente} | {visualizarItin?.garagem}</span>
                {visualizarItin?.nomeLinha}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex gap-4 text-[10px] font-bold uppercase text-slate-500 bg-slate-50 p-2 rounded">
                <span>Turno: <span className="text-slate-900">{visualizarItin?.turno}</span></span>
                <span>Veículo: <span className="text-slate-900">{visualizarItin?.tipoVeiculo}</span></span>
                <span>Dias: <span className="text-slate-900">{visualizarItin?.diasSemana.join(', ')}</span></span>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead className="h-8 text-[10px]">ORD</TableHead><TableHead className="h-8 text-[10px]">HORA</TableHead><TableHead className="h-8 text-[10px]">REFERÊNCIA</TableHead><TableHead className="h-8 text-[10px]">BAIRRO</TableHead></TableRow></TableHeader>
              <TableBody>
                {visualizarItin?.paradas.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="py-2 text-xs">{p.ordem}</TableCell>
                    <TableCell className="py-2 text-xs font-bold text-orange-600">{p.horario}</TableCell>
                    <TableCell className="py-2 text-[10px] uppercase font-medium">{p.referencia}</TableCell>
                    <TableCell className="py-2 text-[10px] uppercase text-slate-500">{p.bairro}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}