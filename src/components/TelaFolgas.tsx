import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./ui/select"; 
import { ArrowLeft, Search, CalendarDays, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '../types';

interface TelaFolgasProps {
  onVoltar: () => void;
  userRole: UserRole;
}

interface RegistroFolga {
  id: string;
  motoristaNome: string;
  motoristaRE: string;
  dataFolga: string;
}

export function TelaFolgas({ onVoltar, userRole }: TelaFolgasProps) {
  const [motoristasCadastrados, setMotoristasCadastrados] = useState<any[]>([]);
  const [folgasLancadas, setFolgasLancadas] = useState<RegistroFolga[]>([]);
  const [busca, setBusca] = useState('');
  
  const [motoristaSelecionadoRE, setMotoristaSelecionadoRE] = useState<string>("");
  const [nomeSelecionado, setNomeSelecionado] = useState<string>("");
  const [novaData, setNovaData] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);

  const podeEditar = userRole === 'admin' || userRole === 'escalante';

  useEffect(() => {
    const dadosMotoristas = JSON.parse(localStorage.getItem('maxtour_motoristas') || '[]');
    const dadosFolgas = JSON.parse(localStorage.getItem('maxtour_folgas_lista') || '[]');
    
    setMotoristasCadastrados(dadosMotoristas);
    setFolgasLancadas(dadosFolgas);
  }, []);

  const handleSelecionarMotorista = (registroRecebido: string) => {
    const motorista = motoristasCadastrados.find(m => String(m.numeroRegistro) === String(registroRecebido));
    if (motorista) {
      setMotoristaSelecionadoRE(String(motorista.numeroRegistro));
      setNomeSelecionado(motorista.nome);
    }
  };

  const handleAdicionarFolga = () => {
    if (!motoristaSelecionadoRE || !novaData) {
      toast.error("Selecione um motorista e a data da folga.");
      return;
    }

    // --- NOVA VALIDAÇÃO DE DUPLICIDADE ---
    const jaExiste = folgasLancadas.some(
      f => f.motoristaRE === motoristaSelecionadoRE && f.dataFolga === novaData
    );

    if (jaExiste) {
      toast.error("Este motorista já possui uma folga registrada para este dia!");
      return;
    }
    // -------------------------------------

    const novoRegistro: RegistroFolga = {
      id: Math.random().toString(36).substr(2, 9),
      motoristaNome: nomeSelecionado,
      motoristaRE: motoristaSelecionadoRE,
      dataFolga: novaData
    };

    const novaLista = [...folgasLancadas, novoRegistro];
    setFolgasLancadas(novaLista);
    localStorage.setItem('maxtour_folgas_lista', JSON.stringify(novaLista));
    
    setMotoristaSelecionadoRE("");
    setNomeSelecionado("");
    setNovaData('');
    setMostrarForm(false);
    toast.success("Folga registrada com sucesso!");
  };

  const handleExcluirFolga = (id: string) => {
    const novaLista = folgasLancadas.filter(f => f.id !== id);
    setFolgasLancadas(novaLista);
    localStorage.setItem('maxtour_folgas_lista', JSON.stringify(novaLista));
    toast.success("Registro removido.");
  };

  const filtrados = folgasLancadas.filter(f => 
    f.motoristaNome.toLowerCase().includes(busca.toLowerCase()) || f.motoristaRE.includes(busca)
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="text-red-600" /> Gestão de Folgas
          </h1>
          <Button variant="outline" onClick={onVoltar} className="bg-white">
            <ArrowLeft className="size-4 mr-2" /> Voltar ao Menu
          </Button>
        </header>

        {mostrarForm && (
          <Card className="mb-6 border-blue-200 bg-blue-50/50 animate-in fade-in zoom-in-95 duration-200">
            <CardContent className="pt-6 flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[280px]">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">Nome do Motorista</label>
                <Select value={motoristaSelecionadoRE} onValueChange={handleSelecionarMotorista}>
                  <SelectTrigger className="bg-white border-slate-300">
                    <SelectValue placeholder="Selecione um motorista..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {motoristasCadastrados.map((m) => (
                      <SelectItem key={m.id} value={String(m.numeroRegistro)}>{m.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-32">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">RE</label>
                <Input value={motoristaSelecionadoRE} disabled className="bg-slate-100 border-slate-300 font-mono text-center" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">Data</label>
                <Input type="date" className="bg-white border-slate-300 w-44" value={novaData} onChange={(e) => setNovaData(e.target.value)} />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAdicionarFolga} className="bg-blue-600">Salvar Folga</Button>
                <Button variant="ghost" onClick={() => setMostrarForm(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-white border-b flex flex-row items-center justify-between">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input placeholder="Pesquisar..." className="pl-10" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            {podeEditar && !mostrarForm && (
              <Button onClick={() => setMostrarForm(true)} className="bg-blue-600">
                <Plus className="size-4 mr-2" /> Adicionar Folga
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Registro (RE)</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.motoristaNome}</TableCell>
                    <TableCell className="font-mono">{f.motoristaRE}</TableCell>
                    <TableCell>{new Date(f.dataFolga + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleExcluirFolga(f.id)} className="text-slate-400 hover:text-red-600">
                        <Trash2 className="size-4" />
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