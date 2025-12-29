import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, Trash2, ArrowLeft, BusFront, Search, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ViagemExtra {
  id: string;
  cliente: string;
  linha: string;
  descricao: string;
  sentido: string;
  turno: string;
  inicio: string;
  tipoVeiculo: string;
  carro: string;
  dataViagem: string;
}

export function CriarViagemExtra({ onBack }: { onBack: () => void }) {
  const [viagens, setViagens] = useState<ViagemExtra[]>([]);
  const [clientesDisponiveis, setClientesDisponiveis] = useState<any[]>([]);
  const [todasLinhasCadastradas, setTodasLinhasCadastradas] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);

  const [novaViagem, setNovaViagem] = useState<Partial<ViagemExtra>>({
    cliente: '', linha: '', sentido: '', turno: 'Extra', dataViagem: '', inicio: '', carro: '', descricao: '', tipoVeiculo: 'Ônibus'
  });

  useEffect(() => {
    const clientes = JSON.parse(localStorage.getItem('maxtour_clientes') || '[]');
    const linhas = JSON.parse(localStorage.getItem('maxtour_linhas') || '[]');
    const extrasSalvas = JSON.parse(localStorage.getItem('maxtour_viagens_extras') || '[]');
    
    setClientesDisponiveis(clientes);
    setTodasLinhasCadastradas(linhas);
    setViagens(extrasSalvas);
  }, []);

  const formatarDataSimples = (dataString: string) => {
    if (!dataString) return '';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const handleSalvarNovaViagem = () => {
    if (!novaViagem.cliente || !novaViagem.dataViagem || !novaViagem.inicio || !novaViagem.sentido || !novaViagem.linha) {
      toast.error("Preencha todos os campos, incluindo a Linha.");
      return;
    }

    const registro: ViagemExtra = {
      ...novaViagem as ViagemExtra,
      id: Math.random().toString(36).substr(2, 9)
    };

    const novaLista = [registro, ...viagens];
    setViagens(novaLista);
    localStorage.setItem('maxtour_viagens_extras', JSON.stringify(novaLista));
    
    setNovaViagem({ cliente: '', linha: '', sentido: '', turno: 'Extra', dataViagem: '', inicio: '', carro: '', descricao: '', tipoVeiculo: 'Ônibus' });
    setMostrarForm(false);
    toast.success("Viagem extra registrada!");
  };

  const excluirViagem = (id: string) => {
    const novaLista = viagens.filter(v => v.id !== id);
    setViagens(novaLista);
    localStorage.setItem('maxtour_viagens_extras', JSON.stringify(novaLista));
    toast.success("Registro excluído.");
  };

  const exportarExcel = () => {
    if (viagens.length === 0) return;

    const datasUnicas = Array.from(new Set(viagens.map(v => v.dataViagem))).sort();
    const datasFormatadas = datasUnicas.map(d => formatarDataSimples(d));
    const consolidado: { [key: string]: any } = {};

    viagens.forEach(v => {
      const nomeCliente = clientesDisponiveis.find(c => c.id === v.cliente)?.nome || v.cliente;
      const dataCol = formatarDataSimples(v.dataViagem);
      
      // A Descrição foi adicionada à chave para garantir que linhas diferentes não sejam somadas juntas
      const chave = `${nomeCliente}|${v.linha}|${v.descricao}|${v.turno}|${v.sentido}|${v.tipoVeiculo}`;
      
      if (!consolidado[chave]) {
        consolidado[chave] = { 
          Cliente: nomeCliente, 
          Linha: v.linha,
          Descrição: v.descricao, // Campo mais importante adicionado aqui
          Turno: v.turno, 
          Sentido: v.sentido, 
          Veiculo: v.tipoVeiculo 
        };
        datasFormatadas.forEach(df => consolidado[chave][df] = 0);
      }
      consolidado[chave][dataCol] += 1;
    });

    const ws = XLSX.utils.json_to_sheet(Object.values(consolidado));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório Geral");
    XLSX.writeFile(wb, "Escala_Viagens_Extras.xlsx");
    toast.success("Excel gerado com sucesso!");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[98%] mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BusFront className="text-orange-600 size-7" /> Viagens Extras
          </h1>
          <div className="flex gap-2">
            <Button onClick={exportarExcel} variant="outline" className="border-green-600 text-green-700 hover:bg-green-50 bg-white">
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Data</label>
                  <Input type="date" value={novaViagem.dataViagem} onChange={e => setNovaViagem({...novaViagem, dataViagem: e.target.value})} className="bg-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Cliente</label>
                  <Select value={novaViagem.cliente} onValueChange={val => setNovaViagem({...novaViagem, cliente: val, linha: '', descricao: ''})}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {clientesDisponiveis.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Linha (Código)</label>
                  <Select 
                    value={novaViagem.linha} 
                    onValueChange={val => {
                      const linhaObj = todasLinhasCadastradas.find(l => l.codigo === val && l.clienteId === novaViagem.cliente);
                      setNovaViagem({...novaViagem, linha: val, descricao: linhaObj ? linhaObj.nome : ''});
                    }}
                    disabled={!novaViagem.cliente}
                  >
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Cod." /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {todasLinhasCadastradas.filter(l => l.clienteId === novaViagem.cliente).map(l => (
                        <SelectItem key={l.id} value={l.codigo}>{l.codigo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1 text-orange-600">Descrição (Importante)</label>
                  <Input value={novaViagem.descricao} readOnly className="bg-orange-50/50 border-orange-100 font-semibold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-end">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Horário</label>
                  <Input type="time" value={novaViagem.inicio} onChange={e => setNovaViagem({...novaViagem, inicio: e.target.value})} className="bg-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Turno</label>
                  <Select value={novaViagem.turno} onValueChange={val => setNovaViagem({...novaViagem, turno: val})}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Turno" /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="T1">T1</SelectItem>
                      <SelectItem value="T2">T2</SelectItem>
                      <SelectItem value="T3">T3</SelectItem>
                      <SelectItem value="ADM">ADM</SelectItem>
                      <SelectItem value="Extra">Extra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Veículo</label>
                  <Select value={novaViagem.tipoVeiculo} onValueChange={val => setNovaViagem({...novaViagem, tipoVeiculo: val})}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Tipo..." /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Ônibus">Ônibus</SelectItem>
                      <SelectItem value="Micro">Micro</SelectItem>
                      <SelectItem value="Van">Van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Sentido</label>
                  <Select value={novaViagem.sentido} onValueChange={val => setNovaViagem({...novaViagem, sentido: val})}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Sentido" /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Entrada">Entrada</SelectItem>
                      <SelectItem value="Saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 flex items-center gap-3">
                  <Button onClick={handleSalvarNovaViagem} className="bg-orange-600 hover:bg-orange-700 text-white flex-1 font-bold h-10 shadow-md">Salvar Viagem</Button>
                  <Button variant="ghost" onClick={() => setMostrarForm(false)} className="h-10 text-slate-500">Cancelar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg border-slate-200 overflow-hidden">
          <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input placeholder="Filtrar registros..." className="pl-10 h-10" value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
            {!mostrarForm && (
              <Button onClick={() => setMostrarForm(true)} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 h-10 shadow-md">
                <Plus className="size-4 mr-2" /> Adicionar Viagem Extra
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="text-[11px] uppercase font-bold text-slate-600">
                  <TableHead className="py-4 px-4">Data</TableHead>
                  <TableHead>Cliente / Linha / Descrição</TableHead>
                  <TableHead className="text-center">Sentido</TableHead>
                  <TableHead className="text-center">Turno</TableHead>
                  <TableHead className="text-center">Início</TableHead>
                  <TableHead className="text-center">Veículo</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {viagens.filter(v => v.dataViagem.includes(busca) || v.cliente.toLowerCase().includes(busca.toLowerCase())).map((v) => (
                  <TableRow key={v.id} className="hover:bg-slate-50 border-b last:border-none">
                    <TableCell className="font-bold text-slate-700 px-4">{formatarDataSimples(v.dataViagem)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-blue-700">{clientesDisponiveis.find(c => c.id === v.cliente)?.nome || v.cliente}</span>
                        <span className="text-[10px] text-slate-600 font-medium">COD: {v.linha}</span>
                        <span className="text-[11px] text-orange-600 font-bold italic uppercase">{v.descricao}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${v.sentido === 'Entrada' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {v.sentido?.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-semibold text-slate-600">{v.turno}</TableCell>
                    <TableCell className="text-center font-bold text-slate-800">{v.inicio}</TableCell>
                    <TableCell className="text-center text-xs text-slate-500">{v.tipoVeiculo}</TableCell>
                    <TableCell className="px-4">
                      <Button variant="ghost" size="sm" onClick={() => excluirViagem(v.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="size-4" /></Button>
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