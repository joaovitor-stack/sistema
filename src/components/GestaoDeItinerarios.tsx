import { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { MapPin, Plus, Trash2, ArrowLeft, Save, Printer, Building2, Search, FileDown, Edit2, X, Calendar, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

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
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFontSize(14);
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
    if (!novoItin.clienteId || !novoItin.linhaId) return toast.error("Preencha cliente e linha");
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
    setNovoItin({ id: '', clienteId: '', nomeCliente: '', linhaId: '', nomeLinha: '', turno: '', tipoVeiculo: '', diasSemana: [], paradas: [] });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* ... (Estilo Print e Área de Impressão iguais) */}

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
          /* FORMULÁRIO DE EDIÇÃO */
          <div className="space-y-6">
            <Card className="border-orange-200">
               <CardHeader className="bg-orange-50/50 py-3"><CardTitle className="text-xs font-bold uppercase text-orange-800">Configuração da Linha</CardTitle></CardHeader>
               <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                 {/* ... (Campos de Select iguais aos seus) */}
                 <div className="md:col-span-4 flex flex-wrap gap-2">
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
               <CardHeader className="bg-slate-50 py-3"><CardTitle className="text-xs font-bold uppercase text-slate-700">Paradas</CardTitle></CardHeader>
               <CardContent className="pt-6">
                 {/* ... (Inputs de Paradas iguais) */}
                 <div className="mt-6 flex justify-end">
                    <Button onClick={salvarItinerario} className="bg-green-600"><Save className="mr-2" /> Salvar</Button>
                 </div>
               </CardContent>
            </Card>
          </div>
        ) : (
          /* LISTAGEM DE CARDS */
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
                    </div>

                    {/* BOTÕES DE AÇÃO SEPARADOS NO RODAPÉ DO CARD */}
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

      {/* MODAL DE VISUALIZAÇÃO (DIÁLOGO) */}
      <Dialog open={!!visualizarItin} onOpenChange={() => setVisualizarItin(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="uppercase border-b pb-2">
                <span className="text-orange-600 block text-xs font-bold">{visualizarItin?.nomeCliente}</span>
                {visualizarItin?.nomeLinha}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex gap-4 text-[10px] font-bold uppercase text-slate-500">
                <span>Turno: <span className="text-slate-900">{visualizarItin?.turno}</span></span>
                <span>Veículo: <span className="text-slate-900">{visualizarItin?.tipoVeiculo}</span></span>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead className="h-8 text-[10px]">ORD</TableHead><TableHead className="h-8 text-[10px]">HORA</TableHead><TableHead className="h-8 text-[10px]">REFERÊNCIA</TableHead><TableHead className="h-8 text-[10px]">BAIRRO</TableHead></TableRow></TableHeader>
              <TableBody>
                {visualizarItin?.paradas.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="py-2 text-xs">{p.ordem}</TableCell>
                    <TableCell className="py-2 text-xs font-bold text-orange-600">{p.horario}</TableCell>
                    <TableCell className="py-2 text-[10px] uppercase">{p.referencia}</TableCell>
                    <TableCell className="py-2 text-[10px] uppercase">{p.bairro}</TableCell>
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