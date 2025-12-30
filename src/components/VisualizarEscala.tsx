import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  ArrowLeft, 
  Printer, 
  Calendar, 
  FileSpreadsheet, 
  User,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

interface VisualizarEscalaProps {
  dados: any; 
  onBack: () => void;
}

export function VisualizarEscala({ dados, onBack }: VisualizarEscalaProps) {
  const [loading, setLoading] = useState(true);
  const [escalaCompleta, setEscalaCompleta] = useState<any>(null);

  useEffect(() => {
    async function carregarEscalaDoBanco() {
      // CORREÇÃO DO ERRO 400: Se o ID não existir, interrompe imediatamente
      if (!dados?.id) {
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('escalas')
          .select(`
            *,
            garagens(nome),
            perfis_usuarios(nome),
            escala_viagens(*)
          `)
          .eq('id', dados.id)
          .single();

        if (error) throw error;
        setEscalaCompleta(data);
      } catch (error) {
        console.error("Erro ao carregar escala:", error);
      } finally {
        setLoading(false);
      }
    }
    carregarEscalaDoBanco();
  }, [dados?.id]);

  const exportToExcel = () => {
    if (!escalaCompleta?.escala_viagens) return;
    const worksheet = XLSX.utils.json_to_sheet(escalaCompleta.escala_viagens.map((v: any) => ({
      Motorista: v.motorista_nome_snapshot,
      RE: v.motorista_re_snapshot,
      Cliente: v.cliente,
      Linha: v.linha,
      Duração: v.duracao_hhmm || v.duracao
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Escala");
    XLSX.writeFile(workbook, `Escala_${escalaCompleta.data_escala}.xlsx`);
  };

  // CORREÇÃO DO TYPEERROR: 
  // Enquanto estiver carregando ou se escalaCompleta for nulo, 
  // o React NÃO PODE prosseguir para o return principal.
  if (loading || !escalaCompleta) {
    return (
      <div className="flex h-64 w-full items-center justify-center bg-white rounded-lg border border-slate-200">
        <Loader2 className="animate-spin size-8 text-blue-600 mr-3" />
        <p className="text-slate-500 font-medium">Carregando dados...</p>
      </div>
    );
  }

  // A partir daqui, o TypeScript e o React sabem que escalaCompleta NÃO é nula.
  const viagens = escalaCompleta.escala_viagens || [];
  const dataFormatada = escalaCompleta.data_escala?.split('-').reverse().join('/') || '--/--/----';

  return (
    <div className="min-h-screen bg-slate-50 p-4 print:p-0 print:bg-white">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: portrait; margin: 10mm; }
          .no-print { display: none !important; }
        }
      `}} />

      <div className="max-w-6xl mx-auto space-y-4">
        
        <div className="no-print flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-slate-200">
          <Button variant="ghost" onClick={onBack} size="sm">
            <ArrowLeft className="size-4 mr-2" /> Voltar
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToExcel} className="text-green-700 border-green-200 hover:bg-green-50">
              <FileSpreadsheet className="size-4 mr-2" /> Exportar Excel
            </Button>
            <Button size="sm" onClick={() => window.print()} className="bg-slate-900 text-white hover:bg-black">
              <Printer className="size-4 mr-2" /> Imprimir / PDF
            </Button>
          </div>
        </div>

        <Card className="rounded-none shadow-none border-2 border-slate-900 bg-white">
          <CardContent className="p-8">
            
            <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-6">
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">MAXTOUR</h1>
                <p className="text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Fretamento & Turismo</p>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase">
                  <User className="size-3 text-slate-400" /> 
                  {/* CORREÇÃO: Usando Optional Chaining para perfis_usuarios */}
                  Elaborado por: {escalaCompleta.perfis_usuarios?.nome || 'SISTEMA'}
                </div>
              </div>

              <div className="text-right">
                <div className="bg-slate-900 text-white px-4 py-1.5 inline-flex items-center gap-2 text-sm font-bold rounded-sm mb-2">
                  <Calendar className="size-4" /> {dataFormatada}
                </div>
                <h2 className="text-2xl font-black text-blue-700 uppercase">
                  {escalaCompleta.dia_semana_texto || '---'}
                </h2>
                <p className="text-xs font-bold text-slate-500 uppercase">
                  Unidade: {escalaCompleta.garagens?.nome || 'Extrema'}
                </p>
              </div>
            </div>

            <div className="border border-slate-300">
              <Table>
                <TableHeader className="bg-slate-100 border-b-2 border-slate-900">
                  <TableRow>
                    <TableHead className="text-[10px] font-black text-slate-900 py-3 uppercase">Motorista (RE)</TableHead>
                    <TableHead className="text-[10px] font-black text-slate-900 uppercase">Cliente / Linha</TableHead>
                    <TableHead className="text-[10px] font-black text-orange-600 text-center uppercase">D. Inicial</TableHead>
                    <TableHead className="text-[10px] font-black text-slate-900 text-center uppercase">Início</TableHead>
                    <TableHead className="text-[10px] font-black text-slate-900 text-center uppercase">Fim</TableHead>
                    <TableHead className="text-[10px] font-black text-orange-600 text-center uppercase">D. Final</TableHead>
                    <TableHead className="text-[10px] font-black text-blue-800 bg-blue-50 text-center uppercase">Duração</TableHead>
                    <TableHead className="text-[10px] font-black text-slate-900 text-center uppercase">Turno</TableHead>
                    <TableHead className="text-[10px] font-black text-slate-900 text-center uppercase">Carro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viagens.map((v: any, idx: number) => (
                    <TableRow key={v.id || idx} className="border-b border-slate-200">
                      <TableCell className="py-3">
                        <div className="font-bold text-[11px] uppercase leading-none">{v.motorista_nome_snapshot}</div>
                        <div className="text-[8px] text-slate-400 mt-1">RE: {v.motorista_re_snapshot}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-[10px] text-blue-900 uppercase">{v.cliente}</div>
                        <div className="text-[9px] text-slate-500 italic leading-tight">{v.linha}</div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-orange-600 text-[10px]">{v.deslocamento_inicial?.slice(0,5) || '--:--'}</TableCell>
                      <TableCell className="text-center font-bold text-slate-900 text-[10px]">{v.inicio?.slice(0,5) || '--:--'}</TableCell>
                      <TableCell className="text-center font-bold text-slate-900 text-[10px]">{v.fim?.slice(0,5) || '--:--'}</TableCell>
                      <TableCell className="text-center font-bold text-orange-600 text-[10px]">{v.deslocamento_final?.slice(0,5) || '--:--'}</TableCell>
                      <TableCell className="text-center font-black text-blue-700 bg-blue-50/50 text-[10px]">{v.duracao_hhmm || v.duracao || '--:--'}</TableCell>
                      <TableCell className="text-center font-bold text-slate-600 text-[10px] uppercase">{v.turno_codigo}</TableCell>
                      <TableCell className="text-center font-bold text-slate-900 text-[10px]">{v.carro || '---'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-16 grid grid-cols-2 gap-20">
              <div className="border-t-2 border-slate-900 pt-2 text-center">
                <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Assinatura do Gestor</p>
              </div>
              <div className="border-t-2 border-slate-900 pt-2 text-center">
                <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Conferência RH / Tráfego</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}