import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  Bus, PlusCircle, MapPinned, ArrowLeft, 
  Edit3, Calendar as CalendarIcon, Filter
} from 'lucide-react';

interface DashboardProps {
  onBack: () => void;
}

const CORES_PIZZA = ['#2563eb', '#f59e0b', '#10b981', '#a855f7'];

export function TelaDashboard({ onBack }: DashboardProps) {
  // --- ESTADOS DE FILTRO ---
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [garagemFiltro, setGaragemFiltro] = useState('TODAS');
  const [visao, setVisao] = useState<'DIARIO' | 'MENSAL'>('DIARIO');
  
  const [stats, setStats] = useState<any[]>([]);
  const [pizzaData, setPizzaData] = useState<any[]>([]);
  const [totais, setTotais] = useState({ viagens: 0, extras: 0, itinerarios: 0, atualizados: 0 });

  const garagens = ["TODAS", "Extrema", "Bragança Paulista", "Cambuí - Camanducaia"];

  useEffect(() => {
    carregarDados();
  }, [dataInicio, dataFim, garagemFiltro, visao]);

  const formatarDataBR = (dataISO: string) => {
    if (!dataISO) return '';
    if (visao === 'MENSAL') {
        const [ano, mes] = dataISO.split('-');
        return `${mes}/${ano}`;
    }
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const carregarDados = () => {
    try {
      const escalasSalvas = JSON.parse(localStorage.getItem('maxtour_escalas_gerais') || '[]');
      const extrasSalvas = JSON.parse(localStorage.getItem('maxtour_viagens_extras') || '[]');
      const itinerariosSalvos = JSON.parse(localStorage.getItem('maxtour_itinerarios') || '[]');
      
      const resumo: any = {};
      const porGaragem: any = {};
      let tViagens = 0;
      let tExtras = 0;
      let tAtualizados = 0;

      // Inicializa contadores das garagens
      garagens.filter(g => g !== 'TODAS').forEach(g => porGaragem[g] = 0);

      // 1. PROCESSAR ESCALAS FIXAS
      escalasSalvas.forEach((escala: any) => {
        const partes = escala.dataCriacao.split('/');
        const dataISO = `${partes[2]}-${partes[1]}-${partes[0]}`;
        if (dataInicio && dataISO < dataInicio) return;
        if (dataFim && dataISO > dataFim) return;

        const qtd = escala.linhas?.length || 0;

        // LÓGICA DE FILTRO DA PIZZA: 
        // Se for TODAS, soma tudo. Se for uma específica, só conta se bater.
        if (garagemFiltro === 'TODAS' || escala.garagem === garagemFiltro) {
            if (porGaragem[escala.garagem] !== undefined) {
                porGaragem[escala.garagem] += qtd;
            }
        }

        if (garagemFiltro !== 'TODAS' && escala.garagem !== garagemFiltro) return;

        const chave = visao === 'DIARIO' ? dataISO : dataISO.substring(0, 7);
        if (!resumo[chave]) resumo[chave] = { data: chave, viagens: 0, extras: 0, itinerarios: 0, atualizados: 0 };
        resumo[chave].viagens += qtd;
        tViagens += qtd;
      });

      // 2. PROCESSAR EXTRAS
      extrasSalvas.forEach((extra: any) => {
        const dataISO = extra.dataViagem;
        if (dataInicio && dataISO < dataInicio) return;
        if (dataFim && dataISO > dataFim) return;

        // FILTRO DA PIZZA PARA EXTRAS
        if (garagemFiltro === 'TODAS' || extra.garagem === garagemFiltro) {
            if (porGaragem[extra.garagem] !== undefined) {
                porGaragem[extra.garagem] += 1;
            }
        }

        if (garagemFiltro !== 'TODAS' && extra.garagem !== garagemFiltro) return;

        const chave = visao === 'DIARIO' ? dataISO : dataISO.substring(0, 7);
        if (!resumo[chave]) resumo[chave] = { data: chave, viagens: 0, extras: 0, itinerarios: 0, atualizados: 0 };
        resumo[chave].extras += 1;
        tExtras += 1;
      });

      // 3. PROCESSAR ITINERÁRIOS
      itinerariosSalvos.forEach((itin: any) => {
        if (garagemFiltro !== 'TODAS' && itin.garagem !== garagemFiltro) return;
        const dataUpdate = itin.dataUltimaAtualizacao || "";
        if (dataUpdate && (!dataInicio || dataUpdate >= dataInicio) && (!dataFim || dataUpdate <= dataFim)) {
            const chave = visao === 'DIARIO' ? dataUpdate : dataUpdate.substring(0, 7);
            if (!resumo[chave]) resumo[chave] = { data: chave, viagens: 0, extras: 0, itinerarios: 0, atualizados: 0 };
            resumo[chave].atualizados += 1;
            tAtualizados += 1;
        }
      });

      const chartData = Object.values(resumo).sort((a: any, b: any) => 
        new Date(a.data).getTime() - new Date(b.data).getTime()
      );

      // Prepara os dados da pizza apenas com o que foi filtrado e tem valor > 0
      const pizzaFormatado = Object.keys(porGaragem).map(key => ({
        name: key,
        value: porGaragem[key]
      })).filter(item => item.value > 0);

      setStats(chartData);
      setPizzaData(pizzaFormatado);
      setTotais({ 
        viagens: tViagens, 
        extras: tExtras, 
        atualizados: tAtualizados, 
        itinerarios: itinerariosSalvos.filter((i:any) => garagemFiltro === 'TODAS' || i.garagem === garagemFiltro).length 
      });

    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={onBack} size="icon" className="rounded-full"><ArrowLeft className="size-5" /></Button>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestão Maxtour</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Indicadores Operacionais</p>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><Filter size={10}/> Garagem</label>
                <Select value={garagemFiltro} onValueChange={setGaragemFiltro}>
                  <SelectTrigger className="w-48 h-9 bg-slate-50 font-bold text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white">
                    {garagens.map(g => <SelectItem key={g} value={g} className="text-xs font-bold">{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><CalendarIcon size={10}/> Início</label>
                <Input type="date" className="h-9 w-36 text-xs font-bold" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><CalendarIcon size={10}/> Fim</label>
                <Input type="date" className="h-9 w-36 text-xs font-bold" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>

              <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
                <Button variant={visao === 'DIARIO' ? 'default' : 'ghost'} size="sm" className={`h-7 text-[10px] font-bold ${visao === 'DIARIO' ? 'bg-slate-800 text-white' : ''}`} onClick={() => setVisao('DIARIO')}>DIÁRIO</Button>
                <Button variant={visao === 'MENSAL' ? 'default' : 'ghost'} size="sm" className={`h-7 text-[10px] font-bold ${visao === 'MENSAL' ? 'bg-slate-800 text-white' : ''}`} onClick={() => setVisao('MENSAL')}>MENSAL</Button>
              </div>
            </div>
          </div>
        </header>

        {/* CARDS INDICADORES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Viagens Fixas', valor: totais.viagens, cor: 'border-l-blue-600', icon: <Bus className="size-8 text-blue-600 opacity-20"/> },
            { label: 'Viagens Extras', valor: totais.extras, cor: 'border-l-amber-500', icon: <PlusCircle className="size-8 text-amber-600 opacity-20"/> },
            { label: 'Base Itinerários', valor: totais.itinerarios, cor: 'border-l-emerald-500', icon: <MapPinned className="size-8 text-emerald-600 opacity-20"/> },
            { label: 'Atualizações', valor: totais.atualizados, cor: 'border-l-purple-500', icon: <Edit3 className="size-8 text-purple-600 opacity-20"/> },
          ].map((card, i) => (
            <Card key={i} className={`border-l-4 ${card.cor} shadow-sm bg-white relative`}>
              <CardContent className="pt-6 h-32 flex flex-col justify-between relative overflow-hidden">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest z-10">{card.label}</p>
                <h3 className="text-4xl font-black text-slate-900 z-10">{card.valor}</h3>
                <div className="absolute right-2 -bottom-2">{card.icon}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* GRÁFICOS DE BARRA (SUPERIOR) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-sm border-none">
            <CardHeader className="border-b border-slate-50">
              <CardTitle className="text-xs font-black text-slate-500 uppercase">Volume de Viagens ({visao})</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="data" fontSize={10} fontWeight="bold" tickFormatter={formatarDataBR} />
                  <YAxis fontSize={10} fontWeight="bold" />
                  <Tooltip labelFormatter={formatarDataBR} cursor={{fill: '#f8fafc'}} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  <Bar dataKey="viagens" name="Escalas Fixas" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="extras" name="Viagens Extras" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none">
            <CardHeader className="border-b border-slate-50">
              <CardTitle className="text-xs font-black text-slate-500 uppercase">Gestão de Itinerário</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="data" fontSize={10} fontWeight="bold" tickFormatter={formatarDataBR} />
                  <YAxis fontSize={10} fontWeight="bold" />
                  <Tooltip labelFormatter={formatarDataBR} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  <Bar dataKey="atualizados" name="Itinerários Atualizados" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* GRÁFICO DE PIZZA (OCUPANDO TODA A PARTE DE BAIXO) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-sm border-none md:col-span-3">
                <CardHeader className="border-b border-slate-50">
                    <CardTitle className="text-xs font-black text-slate-500 uppercase">
                        Distribuição de Viagens: {garagemFiltro === 'TODAS' ? 'Todas as Garagens' : garagemFiltro}
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[400px] pt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pizzaData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={8}
                                dataKey="value"
                                label={({name, value, percent}) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                            >
                                {pizzaData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CORES_PIZZA[index % CORES_PIZZA.length]} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '20px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}