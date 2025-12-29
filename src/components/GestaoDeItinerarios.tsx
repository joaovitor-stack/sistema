import { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { MapPin, Plus, Trash2, ArrowLeft, Save, Printer, Building2, Search, FileDown, Edit2, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Solução para o erro da linha 12: Função cn local para evitar erro de alias @/lib/utils
const cn = (...inputs: any[]) => inputs.filter(Boolean).join(" ");

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
  turno: string;
  tipoVeiculo: string;
  diasSemana: string[];
  paradas: Parada[];
  dataUltimaAtualizacao?: string; // Campo para o Dashboard
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

  const [novoItin, setNovoItin] = useState<Partial<Itinerario>>({
    id: '', clienteId: '', nomeCliente: '', linhaId: '', nomeLinha: '', turno: '', tipoVeiculo: '', diasSemana: [], paradas: []
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
      itin.nomeLinha.toLowerCase().includes(busca.toLowerCase())
    );
  }, [busca, itinerarios]);

  const linhasFiltradas = useMemo(() => {
    if (!novoItin.clienteId) return [];
    return linhasExistentes.filter(linha => linha.clienteId === novoItin.clienteId);
  }, [novoItin.clienteId, linhasExistentes]);

  // --- FUNÇÕES DE EXPORTAÇÃO ---

  const handleExportarPDF = (itin: Itinerario) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text("MAXTOUR - FICHA DE ITINERÁRIO", 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`CLIENTE: ${itin.nomeCliente.toUpperCase()}`, 14, 25);
    doc.text(`LINHA: ${itin.nomeLinha.toUpperCase()}`, 14, 31);
    doc.text(`TURNO: ${itin.turno} | VEÍCULO: ${itin.tipoVeiculo} | DIAS: ${itin.diasSemana.join(', ')}`, 14, 37);

    const tableRows = itin.paradas.map(p => [p.ordem, p.horario, p.referencia.toUpperCase(), p.bairro.toUpperCase()]);

    autoTable(doc, {
      startY: 43,
      head: [['ORD', 'HORÁRIO', 'REFERÊNCIA / PONTO', 'BAIRRO']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
    });

    doc.save(`ITIN_${itin.nomeLinha.replace(/\s+/g, '_')}.pdf`);
    toast.success("Arquivo PDF gerado com sucesso.");
  };

  const handleImprimir = (itin: Itinerario) => {
    setItemParaImpressao(itin);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // --- FUNÇÕES DE MANIPULAÇÃO ---

  const toggleDia = (diaId: string) => {
    const diasAtuais = novoItin.diasSemana || [];
    const novosDias = diasAtuais.includes(diaId)
      ? diasAtuais.filter(d => d !== diaId)
      : [...diasAtuais, diaId];
    setNovoItin({ ...novoItin, diasSemana: novosDias });
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
    if (!novoItin.clienteId || !novoItin.linhaId) return toast.error("Preencha cliente e linha");

    let novaLista;
    const dataHoje = new Date().toISOString().split('T')[0]; // Captura data do ajuste

    if (novoItin.id) {
      // AJUSTE REALIZADO AQUI: Adicionado dataUltimaAtualizacao para o Dashboard
      novaLista = itinerarios.map(i => i.id === novoItin.id ? { ...novoItin as Itinerario, dataUltimaAtualizacao: dataHoje } : i);
      toast.success("Itinerário atualizado!");
    } else {
      const novoRegistro = { ...novoItin, id: Date.now().toString() } as Itinerario;
      novaLista = [...itinerarios, novoRegistro];
      toast.success("Novo itinerário salvo!");
    }

    setItinerarios(novaLista);
    localStorage.setItem('maxtour_itinerarios', JSON.stringify(novaLista));
    setModoEdicao(false);
    setNovoItin({ id: '', clienteId: '', nomeCliente: '', linhaId: '', nomeLinha: '', turno: '', tipoVeiculo: '', diasSemana: [], paradas: [] });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: portrait; margin: 10mm; }
          body { background: white !important; font-size: 12pt; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
      `}} />

      {/* ÁREA DE IMPRESSÃO */}
      <div className="hidden print:block bg-white">
        {itemParaImpressao && (
          <div className="p-4 border border-slate-800">
            <div className="text-center border-b-2 border-slate-800 pb-4 mb-4">
              <h1 className="text-2xl font-bold uppercase">Maxtour - Itinerário de Transporte</h1>
              <p className="text-sm font-medium">{itemParaImpressao.nomeCliente} | {itemParaImpressao.nomeLinha}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <p><strong>TURNO:</strong> {itemParaImpressao.turno}</p>
              <p><strong>VEÍCULO:</strong> {itemParaImpressao.tipoVeiculo}</p>
              <p className="col-span-2"><strong>DIAS:</strong> {itemParaImpressao.diasSemana.join(', ')}</p>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-800 p-2 text-left w-12">ORD</th>
                  <th className="border border-slate-800 p-2 text-left w-24">HORA</th>
                  <th className="border border-slate-800 p-2 text-left">REFERÊNCIA / PONTO</th>
                  <th className="border border-slate-800 p-2 text-left">BAIRRO</th>
                </tr>
              </thead>
              <tbody>
                {itemParaImpressao.paradas.map(p => (
                  <tr key={p.id}>
                    <td className="border border-slate-800 p-2">{p.ordem}</td>
                    <td className="border border-slate-800 p-2 font-bold">{p.horario}</td>
                    <td className="border border-slate-800 p-2 uppercase text-xs">{p.referencia}</td>
                    <td className="border border-slate-800 p-2 uppercase text-xs">{p.bairro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INTERFACE DO USUÁRIO */}
      <div className="max-w-7xl mx-auto print:hidden">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="text-orange-600" /> Itinerários
            </h1>
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
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="border-orange-200">
              <CardHeader className="bg-orange-50/50 py-3"><CardTitle className="text-xs font-bold uppercase text-orange-800">Configuração da Linha</CardTitle></CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Cliente</label>
                  <Select value={novoItin.clienteId} onValueChange={(v) => {
                    const c = clientes.find(x => x.id === v);
                    setNovoItin({...novoItin, clienteId: v, nomeCliente: c?.nome, linhaId: '', nomeLinha: ''});
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Linha</label>
                  <Select value={novoItin.linhaId} onValueChange={(v) => {
                    const l = linhasExistentes.find(x => x.id === v);
                    setNovoItin({...novoItin, linhaId: v, nomeLinha: l?.nome || l?.codigo});
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {linhasFiltradas.map(l => <SelectItem key={l.id} value={l.id}>{l.codigo} - {l.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Turno</label>
                  <Select value={novoItin.turno} onValueChange={(v) => setNovoItin({...novoItin, turno: v})}>
                    <SelectTrigger><SelectValue placeholder="Turno" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADM">ADM</SelectItem><SelectItem value="TURNO 1">TURNO 1</SelectItem><SelectItem value="TURNO 2">TURNO 2</SelectItem><SelectItem value="TURNO 3">3 TURNO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Veículo</label>
                  <Select value={novoItin.tipoVeiculo} onValueChange={(v) => setNovoItin({...novoItin, tipoVeiculo: v})}>
                    <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SPIN">SPIN</SelectItem>
                      <SelectItem value="VAN">VAN</SelectItem>
                      <SelectItem value="MICRO">MICRO</SelectItem>
                      <SelectItem value="ÔNIBUS">ÔNIBUS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-4 space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-2"><Calendar size={12}/> Dias de Operação</label>
                  <div className="flex flex-wrap gap-2">
                    {DIAS_OPCOES.map(dia => (
                      <Button
                        key={dia.id}
                        type="button"
                        variant={novoItin.diasSemana?.includes(dia.id) ? "default" : "outline"}
                        className={cn(
                          "h-8 text-[10px] font-bold",
                          novoItin.diasSemana?.includes(dia.id) ? "bg-orange-600 hover:bg-orange-700 text-white" : "text-orange-600 border-orange-200 bg-orange-50/50"
                        )}
                        onClick={() => toggleDia(dia.id)}
                      >
                        {dia.id}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-slate-50 py-3"><CardTitle className="text-xs font-bold uppercase text-slate-700">Paradas</CardTitle></CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-4">
                  <div className="md:col-span-2"><Input type="time" value={novaParada.horario} onChange={e => setNovaParada({...novaParada, horario: e.target.value})} /></div>
                  <div className="md:col-span-6"><Input placeholder="Ponto / Referência" value={novaParada.referencia} onChange={e => setNovaParada({...novaParada, referencia: e.target.value})} /></div>
                  <div className="md:col-span-3"><Input placeholder="Bairro" value={novaParada.bairro} onChange={e => setNovaParada({...novaParada, bairro: e.target.value})} /></div>
                  <div className="md:col-span-1"><Button onClick={adicionarParada} className="w-full bg-blue-600"><Plus size={16}/></Button></div>
                </div>

                <Table>
                  <TableHeader><TableRow><TableHead>ORD</TableHead><TableHead>HORA</TableHead><TableHead>REF</TableHead><TableHead>BAIRRO</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {novoItin.paradas?.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>{p.ordem}</TableCell>
                        <TableCell className="font-bold">{p.horario}</TableCell>
                        <TableCell className="text-xs">{p.referencia}</TableCell>
                        <TableCell className="text-xs">{p.bairro}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => setNovoItin({...novoItin, paradas: novoItin.paradas?.filter(x => x.id !== p.id)})}><Trash2 size={14}/></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="mt-6 flex justify-end">
                  <Button onClick={salvarItinerario} className="bg-green-600 hover:bg-green-700">
                    <Save className="mr-2" /> {novoItin.id ? "Salvar Alterações" : "Criar Itinerário"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input className="pl-10" placeholder="Buscar itinerário..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {itinerariosFiltrados.map(itin => (
                <Card key={itin.id} className="border-t-4 border-orange-500 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{itin.nomeCliente}</p>
                        <h3 className="font-bold text-sm uppercase leading-tight">{itin.nomeLinha}</h3>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditar(itin)} className="size-8 text-blue-600"><Edit2 size={16} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => {
                          if(confirm("Deseja excluir este itinerário?")) {
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
                      <div className="w-full flex flex-wrap gap-1 mt-2">
                        {itin.diasSemana?.map(d => (
                          <span key={d} className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100 uppercase">{d}</span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t">
                      <Button variant="outline" size="sm" onClick={() => handleImprimir(itin)} className="text-[10px] font-bold flex gap-2">
                        <Printer size={14} /> FICHA
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleExportarPDF(itin)} className="text-[10px] font-bold text-blue-600 border-blue-200 flex gap-2">
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
    </div>
  );
}