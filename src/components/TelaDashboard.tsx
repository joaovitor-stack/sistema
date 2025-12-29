import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Bus, PlusCircle, MapPinned, ArrowLeft, 
  Edit3 
} from 'lucide-react';

interface DashboardProps {
  onBack: () => void;
}

export function TelaDashboard({ onBack }: DashboardProps) {
  const [dataFiltro, setDataFiltro] = useState('');
  const [stats, setStats] = useState<any[]>([]);
  const [totais, setTotais] = useState({ viagens: 0, extras: 0, itinerarios: 0, atualizados: 0 });

  const formatarDataBR = (dataISO: string) => {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  useEffect(() => {
    carregarDados();
  }, [dataFiltro]);

  const carregarDados = () => {
    try {
      const escalasSalvas = JSON.parse(localStorage.getItem('maxtour_escalas_gerais') || '[]');
      const extrasSalvas = JSON.parse(localStorage.getItem('maxtour_viagens_extras') || '[]');
      const itinerariosSalvos = JSON.parse(localStorage.getItem('maxtour_itinerarios') || '[]');
      
      const resumoDiario: any = {};
      let tViagens = 0;
      let tExtras = 0;
      let tAtualizados = 0;

      escalasSalvas.forEach((escala: any) => {
        const data = escala.dataCriacao;
        if (!data || (dataFiltro && data !== dataFiltro)) return;
        if (!resumoDiario[data]) resumoDiario[data] = { data, viagens: 0, extras: 0, itinerarios: 0, atualizados: 0 };
        const qtd = escala.linhas?.length || 0;
        resumoDiario[data].viagens += qtd;
        tViagens += qtd;
      });

      extrasSalvas.forEach((extra: any) => {
        const data = extra.dataViagem;
        if (!data || (dataFiltro && data !== dataFiltro)) return;
        if (!resumoDiario[data]) resumoDiario[data] = { data, viagens: 0, extras: 0, itinerarios: 0, atualizados: 0 };
        resumoDiario[data].extras += 1;
        tExtras += 1;
      });

      itinerariosSalvos.forEach((itin: any) => {
        const dataCriacao = !isNaN(Number(itin.id)) ? new Date(Number(itin.id)).toISOString().split('T')[0] : "";
        const dataUpdate = itin.dataUltimaAtualizacao || "";

        if (dataCriacao && (!dataFiltro || dataCriacao === dataFiltro)) {
          if (!resumoDiario[dataCriacao]) resumoDiario[dataCriacao] = { data: dataCriacao, viagens: 0, extras: 0, itinerarios: 0, atualizados: 0 };
          resumoDiario[dataCriacao].itinerarios += 1;
        }

        if (dataUpdate) {
            tAtualizados += 1;
            if (!dataFiltro || dataUpdate === dataFiltro) {
                if (!resumoDiario[dataUpdate]) resumoDiario[dataUpdate] = { data: dataUpdate, viagens: 0, extras: 0, itinerarios: 0, atualizados: 0 };
                resumoDiario[dataUpdate].atualizados += 1;
            }
        }
      });

      const chartData = Object.values(resumoDiario).sort((a: any, b: any) => 
        new Date(a.data).getTime() - new Date(b.data).getTime()
      );

      setStats(chartData);
      setTotais({ 
        viagens: tViagens, 
        extras: tExtras, 
        itinerarios: itinerariosSalvos.length,
        atualizados: tAtualizados
      });

    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} size="icon"><ArrowLeft className="size-5" /></Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Dashboard de Operações</h1>
              <p className="text-sm text-slate-500">Indicadores consolidados</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Data de Referência</label>
            <Input 
              type="date" 
              className="w-44 bg-slate-50" 
              value={dataFiltro} 
              onChange={(e) => setDataFiltro(e.target.value)} 
            />
          </div>
        </header>

        {/* CARDS CENTRALIZADOS COM ÍCONES MANTIDOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Viagens Fixas', valor: totais.viagens, cor: 'border-l-blue-600', icon: <Bus className="size-8 text-blue-600 opacity-20"/> },
            { label: 'Viagens Extras', valor: totais.extras, cor: 'border-l-amber-500', icon: <PlusCircle className="size-8 text-amber-600 opacity-20"/> },
            { label: 'Itinerários Criados', valor: totais.itinerarios, cor: 'border-l-emerald-500', icon: <MapPinned className="size-8 text-emerald-600 opacity-20"/> },
            { label: 'Itinerários Atualizados', valor: totais.atualizados, cor: 'border-l-purple-500', icon: <Edit3 className="size-8 text-purple-600 opacity-20"/> },
          ].map((card, i) => (
            <Card key={i} className={`border-l-4 ${card.cor} shadow-sm bg-white relative`}>
              <CardContent className="pt-6 h-32 flex flex-col justify-between items-center relative">
                {/* Título à esquerda no topo */}
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider self-start">
                  {card.label}
                </p>
                
                {/* Valor Centralizado */}
                <h3 className="text-4xl font-black text-slate-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-2">
                  {card.valor}
                </h3>

                {/* Ícone à Direita (Mantido como na sua imagem) */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {card.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="text-sm font-bold text-slate-700 uppercase">Volume de Viagens</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="data" 
                    fontSize={10} 
                    tickFormatter={(v) => formatarDataBR(v)} 
                  />
                  <YAxis fontSize={10} />
                  <Tooltip labelFormatter={(v) => `Data: ${formatarDataBR(v)}`} />
                  <Legend />
                  <Bar dataKey="viagens" name="Fixas" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="extras" name="Extras" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="text-sm font-bold text-slate-700 uppercase">Gestão de Itinerários</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="data" 
                    fontSize={10} 
                    tickFormatter={(v) => formatarDataBR(v)} 
                  />
                  <YAxis fontSize={10} />
                  <Tooltip labelFormatter={(v) => `Data: ${formatarDataBR(v)}`} />
                  <Legend />
                  <Bar dataKey="itinerarios" name="Criados" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="atualizados" name="Atualizados" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}