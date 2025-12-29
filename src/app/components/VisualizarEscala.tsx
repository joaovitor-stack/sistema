import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Search, ArrowLeft, FileDown, FileSpreadsheet } from 'lucide-react';
import { exportarParaPDF, exportarParaExcel } from '../utils/exportUtils';
import { toast } from 'sonner';

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

interface VisualizarEscalaProps {
  escalaId: string;
  onVoltar: () => void;
}

export function VisualizarEscala({ escalaId, onVoltar }: VisualizarEscalaProps) {
  const [linhas] = useState<LinhaEscala[]>([
    {
      id: '1',
      nomeMotorista: 'João Silva',
      cliente: 'Empresa XYZ',
      sentido: 'Ida',
      turno: 'Manhã',
      inicio: '08:00',
      descricao: 'Transporte de funcionários',
      fim: '12:00',
      linha: 'L1',
      tipo: 'Regular',
      carro: 'V001',
      deslocamentoInicial: '07:30',
      deslocamentoFinal: '12:30',
      numeroRegistro: '001'
    },
    {
      id: '2',
      nomeMotorista: 'Maria Santos',
      cliente: 'Empresa ABC',
      sentido: 'Volta',
      turno: 'Tarde',
      inicio: '14:00',
      descricao: 'Transporte executivo',
      fim: '18:00',
      linha: 'L2',
      tipo: 'Executivo',
      carro: 'V002',
      deslocamentoInicial: '13:30',
      deslocamentoFinal: '18:30',
      numeroRegistro: '002'
    }
  ]);

  const [termoPesquisaLinhas, setTermoPesquisaLinhas] = useState('');

  const handleExportarPDF = () => {
    exportarParaPDF(linhasFiltradas, `escala_${escalaId}.pdf`);
    toast.success('Escala exportada para PDF com sucesso!');
  };

  const handleExportarExcel = () => {
    exportarParaExcel(linhasFiltradas, `escala_${escalaId}.xlsx`);
    toast.success('Escala exportada para Excel com sucesso!');
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
          <CardTitle>Visualizar Escala</CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleExportarPDF} variant="outline" className="gap-2">
              <FileDown className="size-4" />
              Exportar PDF
            </Button>
            <Button onClick={handleExportarExcel} variant="outline" className="gap-2">
              <FileSpreadsheet className="size-4" />
              Exportar Excel
            </Button>
            <Button variant="outline" onClick={onVoltar} className="gap-2">
              <ArrowLeft className="size-4" />
              Voltar
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Linhas da Escala</CardTitle>
          </CardHeader>
          <CardContent>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={14} className="text-center text-gray-500">
                        {termoPesquisaLinhas ? 'Nenhuma linha encontrada' : 'Nenhuma linha cadastrada'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    linhasFiltradas.map((linha) => (
                      <TableRow key={linha.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{linha.nomeMotorista}</TableCell>
                        <TableCell>{linha.cliente}</TableCell>
                        <TableCell>{linha.sentido}</TableCell>
                        <TableCell>{linha.turno}</TableCell>
                        <TableCell>{linha.inicio}</TableCell>
                        <TableCell>{linha.descricao}</TableCell>
                        <TableCell>{linha.fim}</TableCell>
                        <TableCell className="font-medium">{calcularDuracao(linha.inicio, linha.fim)}</TableCell>
                        <TableCell>{linha.linha}</TableCell>
                        <TableCell>{linha.tipo}</TableCell>
                        <TableCell>{linha.carro}</TableCell>
                        <TableCell>{linha.deslocamentoInicial}</TableCell>
                        <TableCell>{linha.deslocamentoFinal}</TableCell>
                        <TableCell>{linha.numeroRegistro}</TableCell>
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