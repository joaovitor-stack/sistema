import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  ArrowLeft, 
  Printer, 
  Calendar, 
  FileSpreadsheet, 
  FileDown 
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface VisualizarEscalaProps {
  dados: any;
  onBack: () => void;
}

export function VisualizarEscala({ dados, onBack }: VisualizarEscalaProps) {
  
  const dataFormatadaArquivo = dados.dataCriacao.replace(/\//g, '-');

  // 1. EXPORTAR EXCEL
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(dados.linhas.map((l: any) => ({
      Motorista: l.nomeMotorista,
      RE: l.numeroRegistro,
      Cliente: l.cliente,
      Linha: l.linha,
      Descricao: l.descricao,
      "Desloc. Inicial": l.deslocamentoInicial,
      "Início Viagem": l.inicio,
      "Fim Viagem": l.fim,
      "Desloc. Final": l.deslocamentoFinal,
      Duracao: l.duracao,
      Sentido: l.sentido,
      Turno: l.turno,
      Carro: l.carro
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Escala RH");
    XLSX.writeFile(workbook, `Escala_RH_${dataFormatadaArquivo}.xlsx`);
  };

  // 2. GERAR PDF (Via função de impressão com título limpo)
  const handleExportPDF = () => {
    const originalTitle = document.title;
    document.title = `ESCALA_MAXTOUR_RH_${dataFormatadaArquivo}`;
    window.print();
    document.title = originalTitle;
  };

  // 3. IMPRIMIR DIRETO
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 print:p-0 print:bg-white">
      {/* ESTILO CSS PARA FORÇAR MODO RETRATO E CORES NA IMPRESSÃO */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { 
            size: portrait; 
            margin: 10mm; 
          }
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
          }
          .print-no-break {
            break-inside: avoid;
          }
        }
      `}} />

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* BARRA DE AÇÕES (BOTÕES SEPARADOS) */}
        <div className="flex items-center justify-between print:hidden bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <Button variant="ghost" onClick={onBack} size="sm">
            <ArrowLeft className="size-4 mr-2" /> Voltar
          </Button>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={exportToExcel} 
              className="border-green-600 text-green-700 hover:bg-green-50"
            >
              <FileSpreadsheet className="size-4 mr-2" /> Exporta Arquivo Excel
            </Button>

            <Button 
              variant="outline" 
              onClick={handleExportPDF} 
              className="border-red-600 text-red-700 hover:bg-red-50"
            >
              <FileDown className="size-4 mr-2" /> Gerar PDF
            </Button>

            <Button 
              onClick={handlePrint} 
              className="bg-slate-800 text-white hover:bg-slate-900"
            >
              <Printer className="size-4 mr-2" /> Imprimir
            </Button>
          </div>
        </div>

        {/* DOCUMENTO DA ESCALA */}
        <Card className="rounded-none border-2 border-slate-900 shadow-none bg-white">
          <CardContent className="p-8">
            
            {/* CABEÇALHO */}
            <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-6">
              <div>
                <h2 className="text-4xl font-black uppercase text-slate-900">Maxtour</h2>
                <p className="text-[10px] font-bold tracking-[0.3em] text-slate-500 uppercase">Fretamento & TURISMO</p>
              </div>
              
              <div className="text-right">
                <div className="bg-slate-900 text-white px-3 py-1 inline-flex items-center gap-2 font-bold text-sm mb-1">
                  <Calendar className="size-4" /> {dados.dataCriacao}
                </div>
                <h3 className="text-xl font-black text-blue-700 uppercase">{dados.diaSemana}</h3>
                <p className="text-xs font-bold text-slate-600">{dados.garagem}</p>
              </div>
            </div>

            {/* TABELA DE DADOS */}
            <div className="border border-slate-300">
              <Table>
                <TableHeader className="bg-slate-100 border-b-2 border-slate-900">
                  <TableRow>
                    <TableHead className="text-[9px] font-black text-slate-900 uppercase">Motorista (Chapa)</TableHead>
                    <TableHead className="text-[9px] font-black text-slate-900 uppercase">Cliente/Linha</TableHead>
                    <TableHead className="text-[9px] font-black text-orange-700 uppercase bg-orange-50/50">D. Inicial</TableHead>
                    <TableHead className="text-[9px] font-black text-slate-900 uppercase">Início</TableHead>
                    <TableHead className="text-[9px] font-black text-slate-900 uppercase">Fim</TableHead>
                    <TableHead className="text-[9px] font-black text-orange-700 uppercase bg-orange-50/50">D. Final</TableHead>
                    <TableHead className="text-[9px] font-black text-blue-800 uppercase bg-blue-50/50">Duração</TableHead>
                    <TableHead className="text-[9px] font-black text-slate-900 uppercase">Turno</TableHead>
                    <TableHead className="text-[9px] font-black text-slate-900 uppercase">Carro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dados.linhas?.map((linha: any) => (
                    <TableRow key={linha.id} className="border-b border-slate-200 text-[10px]">
                      <TableCell className="py-2 font-bold uppercase">
                        {linha.nomeMotorista} 
                        <span className="block text-[8px] text-slate-400 font-normal">RE: {linha.numeroRegistro}</span>
                      </TableCell>
                      <TableCell className="py-2">
                        <span className="font-bold text-blue-900 block">{linha.cliente}</span>
                        <span className="text-[9px]">{linha.linha}</span>
                      </TableCell>
                      <TableCell className="font-bold text-orange-700 bg-orange-50/20">{linha.deslocamentoInicial || '--:--'}</TableCell>
                      <TableCell className="font-bold text-slate-900">{linha.inicio}</TableCell>
                      <TableCell className="font-bold text-slate-900">{linha.fim}</TableCell>
                      <TableCell className="font-bold text-orange-700 bg-orange-50/20">{linha.deslocamentoFinal || '--:--'}</TableCell>
                      <TableCell className="font-black text-blue-700 bg-blue-50/30">{linha.duracao}</TableCell>
                      <TableCell className="font-bold text-slate-700 uppercase">{linha.turno}</TableCell>
                      <TableCell className="font-bold text-slate-700">{linha.carro}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* RODAPÉ */}
            <div className="mt-12 grid grid-cols-2 gap-20">
              <div className="border-t border-slate-400 pt-2">
                <p className="text-[8px] uppercase font-bold text-slate-500 text-center">Assinatura do Gestor</p>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <p className="text-[8px] uppercase font-bold text-slate-500 text-center">Conferência RH / Tráfego</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}