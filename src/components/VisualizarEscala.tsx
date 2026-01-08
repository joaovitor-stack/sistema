import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  ArrowLeft, 
  Printer, 
  Calendar, 
  FileSpreadsheet, 
  Loader2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { Badge } from './ui/badge';

interface VisualizarEscalaProps {
  dados: any; 
  onBack: () => void;
}

export function VisualizarEscala({ dados, onBack }: VisualizarEscalaProps) {
  const [loading, setLoading] = useState(true);
  const [escalaCompleta, setEscalaCompleta] = useState<any>(null);
  const [agora, setAgora] = useState(new Date());

  // Atualiza o relógio a cada minuto para re-ordenar a lista automaticamente
  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function carregarEscalaDoBanco() {
      if (!dados?.id) return;
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
        // Se existir turno na viagem, usa; senão, utiliza turno_codigo ou mantém '---'.
        if (data && data.escala_viagens) {
          data.escala_viagens = data.escala_viagens.map((v: any) => ({
            ...v,
            turno: v.turno || v.turno_codigo || '---'
          }));
        }
        setEscalaCompleta(data);
      } catch (error) {
        console.error("Erro ao carregar escala:", error);
      } finally {
        setLoading(false);
      }
    }
    carregarEscalaDoBanco();
  }, [dados?.id]);

  const estaProximo = (horarioStr: string) => {
    if (!horarioStr) return false;
    const [horas, minutos] = horarioStr.split(':').map(Number);
    const dataViagem = new Date(agora);
    dataViagem.setHours(horas, minutos, 0);
    const diffDiferenca = (dataViagem.getTime() - agora.getTime()) / (1000 * 60);
    return diffDiferenca > 0 && diffDiferenca <= 30;
  };

  // Ordem Inteligente: Futuro em cima, Passado embaixo
  const viagensOrdenadas = escalaCompleta?.escala_viagens?.sort((a: any, b: any) => {
    const horaAtualStr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const horaA = a.deslocamento_inicial || "00:00";
    const horaB = b.deslocamento_inicial || "00:00";
    const jaPassouA = horaA < horaAtualStr;
    const jaPassouB = horaB < horaAtualStr;

    if (jaPassouA && !jaPassouB) return 1;
    if (!jaPassouA && jaPassouB) return -1;
    return horaA.localeCompare(horaB);
  }) || [];

  const temViagemUrgente = viagensOrdenadas.some((v: any) => estaProximo(v.deslocamento_inicial));

  const exportToExcel = () => {
    if (!viagensOrdenadas.length) return;
    const worksheet = XLSX.utils.json_to_sheet(viagensOrdenadas.map((v: any) => ({
      Motorista: v.motorista_nome_snapshot,
      RE: v.motorista_re_snapshot,
      Cliente: v.cliente,
      Turno: v.turno || '---',
      Linha: v.linha,
      Desloc_Inicial: v.deslocamento_inicial,
      Inicio: v.inicio,
      Fim: v.fim,
      Desloc_Final: v.deslocamento_final,
      Duracao: v.duracao_hhmm || v.duracao,
      Carro: v.carro
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Escala");
    XLSX.writeFile(workbook, `Escala_${escalaCompleta.data_escala}.xlsx`);
  };

  if (loading || !escalaCompleta) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin size-8 text-blue-600 mr-3" />
        <p className="text-slate-500 font-medium">Carregando painel de controle...</p>
      </div>
    );
  }

  const dataFormatada = escalaCompleta.data_escala?.split('-').reverse().join('/') || '--/--/----';

  return (
    <div className="min-h-screen bg-slate-100 p-4 pb-10">
      <div className="max-w-[1600px] mx-auto space-y-4">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div>
            <Button variant="outline" onClick={onBack} size="sm" className="mb-2">
              <ArrowLeft className="size-4 mr-2" /> Voltar para Lista
            </Button>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Escala: {escalaCompleta.garagens?.nome} <Badge variant="outline">{dataFormatada}</Badge>
            </h2>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" onClick={exportToExcel} className="flex-1 md:flex-none text-green-700 border-green-200 hover:bg-green-50">
              <FileSpreadsheet className="size-4 mr-2" /> Excel
            </Button>
            <Button size="sm" onClick={() => window.print()} className="flex-1 md:flex-none bg-slate-900 text-white">
              <Printer className="size-4 mr-2" /> Imprimir
            </Button>
          </div>
        </div>

        {/* Alerta de Urgência */}
        {temViagemUrgente && (
          <div className="bg-red-600 text-white p-4 rounded-xl shadow-lg flex items-center gap-4 animate-pulse">
            <AlertTriangle className="size-8" />
            <div>
              <p className="font-black text-lg text-white">ATENÇÃO: VIAGENS PRÓXIMAS AO INÍCIO</p>
              <p className="text-sm opacity-90 text-white/90">Linhas Em Destaque Com inicio Previsto Para 30 Minutos.</p>
            </div>
          </div>
        )}

        {/* Tabela */}
        <Card className="shadow-md border-none overflow-hidden">
          <CardHeader className="bg-white border-b flex flex-row items-center justify-between py-4">
            <CardTitle className="text-slate-700 flex items-center gap-2 text-base font-bold">
              <Clock className="size-5 text-blue-500" /> 
              Monitoramento em Tempo Real
            </CardTitle>
            <div className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">
              Hora Atual: {agora.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[200px] font-bold text-slate-600">Motorista (RE)</TableHead>
                  <TableHead className="w-[180px] font-bold text-slate-600">Cliente / Linha</TableHead>
                  <TableHead className="w-[80px] font-bold text-slate-600">Turno</TableHead>
                  <TableHead className="text-center font-bold text-orange-600 bg-orange-50/30">Desloc. Inicial</TableHead>
                  <TableHead className="text-center font-bold text-slate-600">Início Linha</TableHead>
                  <TableHead className="text-center font-bold text-slate-600">Fim</TableHead>
                  <TableHead className="text-center font-bold text-orange-600 bg-orange-50/30">Desloc. Final</TableHead>
                  <TableHead className="text-center font-bold text-blue-700 bg-blue-50/30">Duração</TableHead>
                  <TableHead className="text-center font-bold text-slate-600">Carro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {viagensOrdenadas.map((v: any, idx: number) => {
                  const urgente = estaProximo(v.deslocamento_inicial);
                  const horaFormatada = agora.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
                  const jaPassou = (v.deslocamento_inicial || "00:00") < horaFormatada;
                  
                  return (
                    <TableRow 
                      key={v.id || idx} 
                      className={`transition-all duration-500 border-b ${
                        urgente 
                        ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-600' 
                        : jaPassou 
                          ? 'opacity-50 grayscale-[0.5] bg-slate-50/50' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <TableCell>
                        <div className={`font-bold text-sm ${urgente ? 'text-red-700' : 'text-slate-900'}`}>
                          {v.motorista_nome_snapshot}
                        </div>
                        <div className="text-[10px] text-slate-500">RE: {v.motorista_re_snapshot}</div>
                      </TableCell>

                      <TableCell>
                        <div className="font-semibold text-xs text-blue-900 uppercase">{v.cliente}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[150px]">{v.linha}</div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 font-bold text-[10px] uppercase">
                          {v.turno || '---'}
                        </Badge>
                      </TableCell>

                      {/* MOVIMENTO SOMENTE AQUI NO DESLOCAMENTO INICIAL */}
                      <TableCell className={`text-center font-black text-sm relative ${
                        urgente 
                        ? 'text-red-600 animate-pulse scale-110' // Movimento de pulsação e destaque no horário
                        : jaPassou ? 'text-slate-400' : 'text-orange-600'
                      }`}>
                        {v.deslocamento_inicial?.slice(0, 5) || '--:--'}
                      </TableCell>

                      <TableCell className="text-center font-medium text-slate-700">
                        {v.inicio?.slice(0, 5) || '--:--'}
                      </TableCell>

                      <TableCell className="text-center font-medium text-slate-700">
                        {v.fim?.slice(0, 5) || '--:--'}
                      </TableCell>

                      <TableCell className={`text-center font-medium text-sm ${jaPassou ? 'text-slate-400' : 'text-orange-600'}`}>
                        {v.deslocamento_final?.slice(0, 5) || '--:--'}
                      </TableCell>

                      <TableCell className="text-center font-bold text-blue-700 bg-blue-50/10">
                        {v.duracao_hhmm || v.duracao || '--:--'}
                      </TableCell>

                      <TableCell className="text-center font-bold text-slate-900">
                        {v.carro || '---'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Rodapé */}
        <div className="mt-8 flex flex-col items-center justify-center border-t border-slate-200 pt-6 pb-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} SISTEMA DE GESTÃO MAXTOUR - TODOS OS DIREITOS RESERVADOS (JOÃO VITOR SILVA FERREIRA)
          </p>
          <p className="text-[9px] text-slate-400 mt-1 uppercase">
            Escala elaborada por: {escalaCompleta.perfis_usuarios?.nome || 'SISTEMA'}
          </p>
        </div>
      </div>
    </div>
  );
}