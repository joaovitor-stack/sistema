import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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

// Função para calcular duração
const calcularDuracao = (inicio: string, fim: string): string => {
  if (!inicio || !fim) return '';
  
  const [horaInicio, minutoInicio] = inicio.split(':').map(Number);
  const [horaFim, minutoFim] = fim.split(':').map(Number);
  
  let minutosTotais = (horaFim * 60 + minutoFim) - (horaInicio * 60 + minutoInicio);
  
  if (minutosTotais < 0) {
    minutosTotais += 24 * 60;
  }
  
  const horas = Math.floor(minutosTotais / 60);
  const minutos = minutosTotais % 60;
  
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
};

// Exportar para PDF
export const exportarParaPDF = (
  linhas: LinhaEscala[],
  nomeArquivo: string = 'escala.pdf'
) => {
  const doc = new jsPDF('landscape');
  
  // Título
  doc.setFontSize(16);
  doc.text('Sistema de Escala Max Tour', 14, 15);
  doc.setFontSize(10);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);
  
  // Preparar dados para a tabela
  const tableData = linhas.map(linha => [
    linha.nomeMotorista,
    linha.cliente,
    linha.sentido,
    linha.turno,
    linha.inicio,
    linha.descricao,
    linha.fim,
    calcularDuracao(linha.inicio, linha.fim),
    linha.linha,
    linha.tipo,
    linha.carro,
    linha.deslocamentoInicial,
    linha.deslocamentoFinal,
    linha.numeroRegistro
  ]);
  
  // Criar tabela
  autoTable(doc, {
    head: [[
      'Motorista',
      'Cliente',
      'Sentido',
      'Turno',
      'Início',
      'Descrição',
      'Fim',
      'Duração',
      'Linha',
      'Tipo',
      'Carro',
      'Desl. Inicial',
      'Desl. Final',
      'Nº Registro'
    ]],
    body: tableData,
    startY: 28,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });
  
  // Salvar PDF
  doc.save(nomeArquivo);
};

// Exportar para Excel
export const exportarParaExcel = (
  linhas: LinhaEscala[],
  nomeArquivo: string = 'escala.xlsx'
) => {
  // Preparar dados para o Excel
  const dadosExcel = linhas.map(linha => ({
    'Motorista': linha.nomeMotorista,
    'Cliente': linha.cliente,
    'Sentido': linha.sentido,
    'Turno': linha.turno,
    'Início': linha.inicio,
    'Descrição': linha.descricao,
    'Fim': linha.fim,
    'Duração': calcularDuracao(linha.inicio, linha.fim),
    'Linha': linha.linha,
    'Tipo': linha.tipo,
    'Carro': linha.carro,
    'Deslocamento Inicial': linha.deslocamentoInicial,
    'Deslocamento Final': linha.deslocamentoFinal,
    'Nº Registro': linha.numeroRegistro
  }));
  
  // Criar workbook e worksheet
  const ws = XLSX.utils.json_to_sheet(dadosExcel);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Escala');
  
  // Ajustar largura das colunas
  const colWidths = [
    { wch: 20 }, // Motorista
    { wch: 20 }, // Cliente
    { wch: 10 }, // Sentido
    { wch: 10 }, // Turno
    { wch: 8 },  // Início
    { wch: 30 }, // Descrição
    { wch: 8 },  // Fim
    { wch: 10 }, // Duração
    { wch: 10 }, // Linha
    { wch: 12 }, // Tipo
    { wch: 10 }, // Carro
    { wch: 12 }, // Desl. Inicial
    { wch: 12 }, // Desl. Final
    { wch: 12 }  // Nº Registro
  ];
  ws['!cols'] = colWidths;
  
  // Salvar arquivo
  XLSX.writeFile(wb, nomeArquivo);
};
