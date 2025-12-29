import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { LinhaEscala } from './types';

interface EditarEscalaProps {
  escalaOriginal: any;
  onBack: () => void;
}

export function EditarEscala({ escalaOriginal, onBack }: EditarEscalaProps) {
  // Estados de dados da Escala (agora com cabeçalho editável)
  const [linhas, setLinhas] = useState<LinhaEscala[]>(escalaOriginal.linhas || []);
  const [garagem, setGaragem] = useState(escalaOriginal.garagem || '');
  const [dataEscala, setDataEscala] = useState(escalaOriginal.dataCriacao ? escalaOriginal.dataCriacao.split('/').reverse().join('-') : ''); 
  const [diaSemana, setDiaSemana] = useState(escalaOriginal.diaSemana || '');

  // Estados para cadastros do LocalStorage
  const [clientesDisponiveis, setClientesDisponiveis] = useState<any[]>([]);
  const [todasLinhasCadastradas, setTodasLinhasCadastradas] = useState<any[]>([]);
  const [motoristasCadastrados, setMotoristasCadastrados] = useState<any[]>([]);

  useEffect(() => {
    setClientesDisponiveis(JSON.parse(localStorage.getItem('maxtour_clientes') || '[]'));
    setTodasLinhasCadastradas(JSON.parse(localStorage.getItem('maxtour_linhas') || '[]'));
    setMotoristasCadastrados(JSON.parse(localStorage.getItem('maxtour_motoristas') || '[]'));
  }, []);

  // Lógica de dia da semana (idêntica à de criar)
  const calcularDiaDaSemana = (dataString: string) => {
    if (!dataString) return '';
    const data = new Date(dataString + 'T00:00:00');
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return diasSemana[data.getDay()];
  };

  const handleDataChange = (novaData: string) => {
    setDataEscala(novaData);
    setDiaSemana(calcularDiaDaSemana(novaData));
  };

  const calcularDuracao = (inicio: string, fim: string) => {
    if (!inicio || !fim) return '';
    try {
      const [h1, m1] = inicio.split(':').map(Number);
      const [h2, m2] = fim.split(':').map(Number);
      let totalMinutos = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (totalMinutos < 0) totalMinutos += 24 * 60;
      const horas = Math.floor(totalMinutos / 60);
      const minutos = totalMinutos % 60;
      return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
    } catch (e) { return ''; }
  };

  const handleAddLinha = () => {
    const novaLinha: LinhaEscala = {
      id: Math.random().toString(36).substr(2, 9),
      nomeMotorista: '', cliente: '', sentido: '', turno: '', inicio: '',
      descricao: '', fim: '', linha: '', tipo: '', carro: '',
      deslocamentoInicial: '', deslocamentoFinal: '', numeroRegistro: '', duracao: ''
    };
    setLinhas([...linhas, novaLinha]);
  };

  const handleUpdateLinha = (id: string, field: keyof LinhaEscala, value: string) => {
    const safeValue = value ?? '';
    setLinhas(prev => prev.map(l => {
      if (l.id === id) {
        const updatedRow = { ...l, [field]: safeValue };
        if (field === 'nomeMotorista') {
          const motorista = motoristasCadastrados.find(m => m.nome === safeValue);
          updatedRow.numeroRegistro = motorista ? motorista.numeroRegistro : '';
        }
        if (field === 'linha') {
          const dados = todasLinhasCadastradas.find(lc => lc.codigo === safeValue && lc.clienteId === l.cliente);
          updatedRow.descricao = dados ? dados.nome : '';
        }
        if (field === 'inicio' || field === 'fim') {
          updatedRow.duracao = calcularDuracao(field === 'inicio' ? safeValue : l.inicio, field === 'fim' ? safeValue : l.fim);
        }
        return updatedRow;
      }
      return l;
    }));
  };

  const salvarEdicao = () => {
    if (!dataEscala || !garagem) {
      toast.error("A Data e a Garagem são obrigatórias!");
      return;
    }

    try {
      const escalasSalvas = JSON.parse(localStorage.getItem('maxtour_escalas_gerais') || '[]');
      
      const dataFormatada = new Date(dataEscala + 'T00:00:00').toLocaleDateString('pt-BR');

      const novasEscalas = escalasSalvas.map((e: any) => 
        e.id === escalaOriginal.id 
          ? { 
              ...e, 
              dataCriacao: dataFormatada, 
              garagem, 
              diaSemana, 
              linhas 
            } 
          : e
      );

      localStorage.setItem('maxtour_escalas_gerais', JSON.stringify(novasEscalas));
      toast.success("Escala atualizada com sucesso!");
      onBack();
    } catch (error) {
      toast.error("Erro ao atualizar.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* HEADER SUPERIOR */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Editar Escala</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="bg-white">
            <ArrowLeft className="size-4 mr-2" /> Voltar
          </Button>
          <Button onClick={salvarEdicao} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="size-4 mr-2" /> Salvar Alterações
          </Button>
        </div>
      </div>

      {/* CABEÇALHO DE INFORMAÇÕES (LIBERADO PARA EDIÇÃO) */}
      <Card className="mb-6 shadow-sm border-blue-100">
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div>
            <label className="text-sm font-semibold mb-2 block">Data da Escala</label>
            <Input 
              type="date" 
              value={dataEscala} 
              onChange={(e) => handleDataChange(e.target.value)} 
              className="bg-white" 
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">Dia da Semana</label>
            <Input value={diaSemana} readOnly className="bg-gray-50 font-medium" />
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">Garagem</label>
            <Select value={garagem} onValueChange={setGaragem}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="Extrema">Extrema</SelectItem>
                <SelectItem value="Bragança Paulista">Bragança Paulista</SelectItem>
                <SelectItem value="Cambuí">Cambuí - Camanducaia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* TABELA DE ITINERÁRIO */}
      <Card className="shadow-md overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-white">
          <CardTitle className="text-lg text-blue-600">Itinerário de Viagens</CardTitle>
          <Button size="sm" onClick={handleAddLinha} className="bg-blue-600 text-white">
            <Plus className="size-4 mr-1" /> Adicionar Linha
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="min-w-[180px]">Motorista</TableHead>
                <TableHead className="min-w-[150px]">Cliente</TableHead>
                <TableHead className="min-w-[120px]">Linha</TableHead>
                <TableHead className="min-w-[180px]">Descrição</TableHead>
                <TableHead className="min-w-[110px]">Sentido</TableHead>
                <TableHead className="min-w-[110px]">Turno</TableHead>
                <TableHead className="min-w-[110px]">D. Inicial</TableHead>
                <TableHead className="min-w-[110px]">Início</TableHead>
                <TableHead className="min-w-[110px]">Fim</TableHead>
                <TableHead className="min-w-[110px]">D. Final</TableHead>
                <TableHead className="min-w-[80px]">Duração</TableHead>
                <TableHead className="min-w-[140px]">Veículo</TableHead>
                <TableHead className="min-w-[90px]">Carro</TableHead>
                <TableHead className="min-w-[120px]">Nº Registro</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {linhas.map((linha) => (
                <TableRow key={linha.id}>
                  <TableCell>
                    <Select value={linha.nomeMotorista || ''} onValueChange={val => handleUpdateLinha(linha.id, 'nomeMotorista', val)}>
                      <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder="Motorista" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {motoristasCadastrados.map(m => <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={linha.cliente || ''} onValueChange={val => handleUpdateLinha(linha.id, 'cliente', val)}>
                      <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder="Cliente" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {clientesDisponiveis.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={linha.linha || ''} onValueChange={val => handleUpdateLinha(linha.id, 'linha', val)} disabled={!linha.cliente}>
                      <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder="Linha" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {todasLinhasCadastradas.filter(lc => lc.clienteId === linha.cliente).map(lc => (
                          <SelectItem key={lc.id} value={lc.codigo}>{lc.codigo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input value={linha.descricao || ''} readOnly className="bg-gray-50 h-8 text-xs" /></TableCell>
                  <TableCell>
                    <Select value={linha.sentido || ''} onValueChange={val => handleUpdateLinha(linha.id, 'sentido', val)}>
                      <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder="Sentido" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="Entrada">Entrada</SelectItem>
                        <SelectItem value="Saida">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={linha.turno || ''} onValueChange={val => handleUpdateLinha(linha.id, 'turno', val)}>
                      <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder="Turno" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="Turno 1">Turno 1</SelectItem>
                        <SelectItem value="Turno 2">Turno 2</SelectItem>
                        <SelectItem value="Turno 3">Turno 3</SelectItem>
                        <SelectItem value="ADM">ADM</SelectItem>
                        <SelectItem value="Extra">Extra</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input type="time" value={linha.deslocamentoInicial || ''} onChange={e => handleUpdateLinha(linha.id, 'deslocamentoInicial', e.target.value)} className="h-8 text-xs" /></TableCell>
                  <TableCell><Input type="time" value={linha.inicio || ''} onChange={e => handleUpdateLinha(linha.id, 'inicio', e.target.value)} className="h-8 text-xs" /></TableCell>
                  <TableCell><Input type="time" value={linha.fim || ''} onChange={e => handleUpdateLinha(linha.id, 'fim', e.target.value)} className="h-8 text-xs" /></TableCell>
                  <TableCell><Input type="time" value={linha.deslocamentoFinal || ''} onChange={e => handleUpdateLinha(linha.id, 'deslocamentoFinal', e.target.value)} className="h-8 text-xs" /></TableCell>
                  <TableCell><Input value={linha.duracao || ''} readOnly className="bg-blue-50 font-bold h-8 text-xs text-blue-700" /></TableCell>
                  <TableCell>
                    <Select value={linha.tipo || ''} onValueChange={val => handleUpdateLinha(linha.id, 'tipo', val)}>
                      <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder="Tipo" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="Ônibus">Ônibus</SelectItem>
                        <SelectItem value="Micro Ônibus">Micro Ônibus</SelectItem>
                        <SelectItem value="Van">Van</SelectItem>
                        <SelectItem value="Carro Comum">Carro Comum</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input value={linha.carro || ''} onChange={e => handleUpdateLinha(linha.id, 'carro', e.target.value)} className="h-8 text-xs" /></TableCell>
                  <TableCell><Input value={linha.numeroRegistro || ''} readOnly className="h-8 text-xs bg-gray-50" /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setLinhas(prev => prev.filter(l => l.id !== linha.id))}>
                      <Trash2 className="size-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}