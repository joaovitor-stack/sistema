import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Save, Plus, Trash2, Search, FileDown, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { exportarParaPDF, exportarParaExcel } from '../utils/exportUtils';

interface LinhaEscala {
  id: string;
  nomeMotorista: string;
  cliente: string;
  sentido: string;
  turno: string;
  inicio: string;
  descricao: string;
  fim: string;
  linha: string;
  tipo: string;
  carro: string;
  deslocamentoInicial: string;
  deslocamentoFinal: string;
  numeroRegistro: string;
}

interface CriarNovaEscalaProps {
  onSave: (linhas: LinhaEscala[]) => void;
  onCancel: () => void;
}

// Mapeamento de motoristas para números de registro
const motoristaParaRegistro: Record<string, string> = {
  'João Silva': '001',
  'Maria Santos': '002',
  'Pedro Oliveira': '003',
  'Ana Costa': '004',
  'Carlos Souza': '005',
  'Juliana Lima': '006',
  'Roberto Alves': '007',
  'Fernanda Rocha': '008',
};

export function CriarNovaEscala({ onSave, onCancel }: CriarNovaEscalaProps) {
  const [linhas, setLinhas] = useState<LinhaEscala[]>([
    {
      id: '1',
      nomeMotorista: '',
      cliente: '',
      sentido: '',
      turno: '',
      inicio: '',
      descricao: '',
      fim: '',
      linha: '',
      tipo: '',
      carro: '',
      deslocamentoInicial: '',
      deslocamentoFinal: '',
      numeroRegistro: ''
    }
  ]);

  // Informações da escala (da tela de lançamento)
  const [dataLancamento, setDataLancamento] = useState('');
  const [garagem, setGaragem] = useState('');
  const [escalaDoDia, setEscalaDoDia] = useState('');
  const [qualDia, setQualDia] = useState('');
  const [termoPesquisaLinhas, setTermoPesquisaLinhas] = useState('');

  const handleExportarPDF = () => {
    exportarParaPDF(linhasFiltradas, 'nova_escala.pdf');
    toast.success('Escala exportada para PDF com sucesso!');
  };

  const handleExportarExcel = () => {
    exportarParaExcel(linhasFiltradas, 'nova_escala.xlsx');
    toast.success('Escala exportada para Excel com sucesso!');
  };

  // Função para calcular o dia da semana baseado na data
  const calcularDiaDaSemana = (dataString: string): string => {
    if (!dataString) return '';
    
    const data = new Date(dataString + 'T00:00:00');
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return diasSemana[data.getDay()];
  };

  // Atualizar "Qual Dia" quando "Escala do Dia" mudar
  const handleEscalaDoDiaChange = (novaData: string) => {
    setEscalaDoDia(novaData);
    setQualDia(calcularDiaDaSemana(novaData));
  };

  const handleAddLinha = () => {
    const novaLinha: LinhaEscala = {
      id: Date.now().toString(),
      nomeMotorista: '',
      cliente: '',
      sentido: '',
      turno: '',
      inicio: '',
      descricao: '',
      fim: '',
      linha: '',
      tipo: '',
      carro: '',
      deslocamentoInicial: '',
      deslocamentoFinal: '',
      numeroRegistro: ''
    };
    setLinhas([...linhas, novaLinha]);
  };

  const handleRemoveLinha = (id: string) => {
    if (linhas.length === 1) {
      toast.error('Deve haver pelo menos uma linha');
      return;
    }
    setLinhas(linhas.filter(linha => linha.id !== id));
  };

  const handleUpdateLinha = (id: string, campo: keyof LinhaEscala, valor: string) => {
    setLinhas(linhas.map(linha => {
      if (linha.id === id) {
        const linhaAtualizada = { ...linha, [campo]: valor };
        
        // Se o campo alterado for nomeMotorista, atualizar o número de registro
        if (campo === 'nomeMotorista') {
          const registro = motoristaParaRegistro[valor];
          if (registro) {
            linhaAtualizada.numeroRegistro = registro;
          }
        }
        
        return linhaAtualizada;
      }
      return linha;
    }));
  };

  // Função para calcular a duração entre dois horários
  const calcularDuracao = (inicio: string, fim: string): string => {
    if (!inicio || !fim) return '';
    
    const [horaInicio, minutoInicio] = inicio.split(':').map(Number);
    const [horaFim, minutoFim] = fim.split(':').map(Number);
    
    let minutosTotais = (horaFim * 60 + minutoFim) - (horaInicio * 60 + minutoInicio);
    
    // Se o horário de fim for menor que o de início, assumir que passou da meia-noite
    if (minutosTotais < 0) {
      minutosTotais += 24 * 60;
    }
    
    const horas = Math.floor(minutosTotais / 60);
    const minutos = minutosTotais % 60;
    
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
  };

  const handleSave = () => {
    // Validar se há pelo menos um campo preenchido
    const temDados = linhas.some(linha => 
      linha.nomeMotorista || linha.cliente || linha.sentido || linha.turno
    );

    if (!temDados) {
      toast.error('Preencha pelo menos uma linha da escala');
      return;
    }

    onSave(linhas);
    toast.success('Escala salva com sucesso!');
  };

  // Filtrar linhas com base no termo de pesquisa
  const linhasFiltradas = linhas.filter(linha =>
    linha.nomeMotorista.toLowerCase().includes(termoPesquisaLinhas.toLowerCase()) ||
    linha.cliente.toLowerCase().includes(termoPesquisaLinhas.toLowerCase()) ||
    linha.sentido.toLowerCase().includes(termoPesquisaLinhas.toLowerCase()) ||
    linha.turno.toLowerCase().includes(termoPesquisaLinhas.toLowerCase()) ||
    linha.descricao.toLowerCase().includes(termoPesquisaLinhas.toLowerCase()) ||
    linha.linha.toLowerCase().includes(termoPesquisaLinhas.toLowerCase()) ||
    linha.tipo.toLowerCase().includes(termoPesquisaLinhas.toLowerCase()) ||
    linha.carro.toLowerCase().includes(termoPesquisaLinhas.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <CardTitle>Criar Nova Escala</CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleExportarPDF} variant="outline" className="gap-2">
              <FileDown className="size-4" />
              PDF
            </Button>
            <Button onClick={handleExportarExcel} variant="outline" className="gap-2">
              <FileSpreadsheet className="size-4" />
              Excel
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="size-4" />
              Salvar Escala
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Informações da Escala</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleAddLinha} variant="outline" size="sm" className="gap-2">
                <Plus className="size-4" />
                Adicionar Linha
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm mb-2">Data de Lançamento</label>
                <Input
                  type="date"
                  value={dataLancamento}
                  onChange={(e) => setDataLancamento(e.target.value)}
                  placeholder="Data de Lançamento"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Garagem</label>
                <Select value={garagem} onValueChange={setGaragem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a garagem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Extrema">Extrema</SelectItem>
                    <SelectItem value="Bragança Paulista">Bragança Paulista</SelectItem>
                    <SelectItem value="Cambuí - Camanducaia">Cambuí - Camanducaia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm mb-2">Escala do Dia</label>
                <Input
                  type="date"
                  value={escalaDoDia}
                  onChange={(e) => handleEscalaDoDiaChange(e.target.value)}
                  placeholder="Escala do Dia"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Qual Dia</label>
                <Input
                  value={qualDia}
                  readOnly
                  placeholder="Dia da semana"
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2">
              <Search className="size-4 text-gray-500" />
              <Input
                placeholder="Pesquisar linhas..."
                value={termoPesquisaLinhas}
                onChange={(e) => setTermoPesquisaLinhas(e.target.value)}
                className="max-w-md"
              />
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Nome do Motorista</TableHead>
                    <TableHead className="min-w-[150px]">Cliente</TableHead>
                    <TableHead className="min-w-[100px]">Sentido</TableHead>
                    <TableHead className="min-w-[100px]">Turno</TableHead>
                    <TableHead className="min-w-[100px]">Início</TableHead>
                    <TableHead className="min-w-[200px]">Descrição</TableHead>
                    <TableHead className="min-w-[100px]">Fim</TableHead>
                    <TableHead className="min-w-[100px]">Duração</TableHead>
                    <TableHead className="min-w-[100px]">Linha</TableHead>
                    <TableHead className="min-w-[100px]">Tipo</TableHead>
                    <TableHead className="min-w-[100px]">Carro</TableHead>
                    <TableHead className="min-w-[150px]">Deslocamento Inicial</TableHead>
                    <TableHead className="min-w-[150px]">Deslocamento Final</TableHead>
                    <TableHead className="min-w-[150px]">Número de Registro</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={15} className="text-center text-gray-500">
                        {termoPesquisaLinhas ? 'Nenhuma linha encontrada' : 'Adicione uma linha'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    linhasFiltradas.map((linha) => (
                    <TableRow key={linha.id}>
                      <TableCell>
                        <Input
                          value={linha.nomeMotorista}
                          onChange={(e) => handleUpdateLinha(linha.id, 'nomeMotorista', e.target.value)}
                          placeholder="Nome"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={linha.cliente}
                          onChange={(e) => handleUpdateLinha(linha.id, 'cliente', e.target.value)}
                          placeholder="Cliente"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={linha.sentido}
                          onChange={(e) => handleUpdateLinha(linha.id, 'sentido', e.target.value)}
                          placeholder="Sentido"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={linha.turno}
                          onChange={(e) => handleUpdateLinha(linha.id, 'turno', e.target.value)}
                          placeholder="Turno"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="time"
                          value={linha.inicio}
                          onChange={(e) => handleUpdateLinha(linha.id, 'inicio', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={linha.descricao}
                          onChange={(e) => handleUpdateLinha(linha.id, 'descricao', e.target.value)}
                          placeholder="Descrição"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="time"
                          value={linha.fim}
                          onChange={(e) => handleUpdateLinha(linha.id, 'fim', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        {calcularDuracao(linha.inicio, linha.fim)}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={linha.linha}
                          onChange={(e) => handleUpdateLinha(linha.id, 'linha', e.target.value)}
                          placeholder="Linha"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={linha.tipo}
                          onChange={(e) => handleUpdateLinha(linha.id, 'tipo', e.target.value)}
                          placeholder="Tipo"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={linha.carro}
                          onChange={(e) => handleUpdateLinha(linha.id, 'carro', e.target.value)}
                          placeholder="Carro"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="time"
                          value={linha.deslocamentoInicial}
                          onChange={(e) => handleUpdateLinha(linha.id, 'deslocamentoInicial', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="time"
                          value={linha.deslocamentoFinal}
                          onChange={(e) => handleUpdateLinha(linha.id, 'deslocamentoFinal', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={linha.numeroRegistro}
                          onChange={(e) => handleUpdateLinha(linha.id, 'numeroRegistro', e.target.value)}
                          placeholder="Nº Registro"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLinha(linha.id)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}