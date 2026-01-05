import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, Line, ComposedChart 
} from 'recharts';
import { 
  Bus, PlusCircle, MapPinned, ArrowLeft, 
  Edit3, Calendar as CalendarIcon, Filter, Loader2, TrendingUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  onBack: () => void;
}

const CORES_PIZZA = ['#2563eb', '#f59e0b', '#10b981', '#a855f7', '#ef4444', '#06b6d4'];

export function TelaDashboard({ onBack }: DashboardProps) {
  const [abaAtiva, setAbaAtiva] = useState<'GERAL' | 'CLIENTES'>('GERAL');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [garagemFiltro, setGaragemFiltro] = useState('TODAS');
  const [visao, setVisao] = useState<'DIARIO' | 'MENSAL'>('DIARIO');
  const [loading, setLoading] = useState(true);
  
  const [listaGaragens, setListaGaragens] = useState<string[]>(['TODAS']);
  const [stats, setStats] = useState<any[]>([]);
  const [pizzaData, setPieData] = useState<any[]>([]);
  const [clientesData, setClientesData] = useState<any[]>([]);
  const [totais, setTotais] = useState({ viagens: 0, extras: 0, itinerarios: 0, atualizados: 0 });

  useEffect(() => {
    async function buscarGaragens() {
      const { data } = await supabase.from('garagens').select('nome').order('nome');
      if (data) setListaGaragens(['TODAS', ...data.map(g => g.nome)]);
    }
    buscarGaragens();
  }, []);

  useEffect(() => {
    carregarDados();
  }, [dataInicio, dataFim, garagemFiltro, visao]);

  const formatarDataBR = (dataISO: string) => {
    if (!dataISO) return '';
    const partes = dataISO.split('-');
    if (visao === 'MENSAL') return `${partes[1]}/${partes[0]}`;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      // 1. QUERY ESCALAS (CORRIGIDA: Removemos o aninhamento que causava erro 400)
      let queryEscalas = supabase.from('escalas').select(`
        data_escala,
        garagens!inner(nome),
        escala_viagens(id, cliente)
      `);

      // 2. QUERY EXTRAS
      let queryExtras = supabase.from('viagens_extras').select(`
        data_viagem,
        garagens!inner(nome),
        cliente
      `);

      // 3. QUERY ITINERÁRIOS (Corrigida para buscar criação e atualização por Garagem)
      let queryItinerarios = supabase.from('itinerarios').select(`
        data_ultima_atualizacao,
        created_at,
        garagens!inner(nome)
      `);

      // Filtros de Data (Aplicados apenas às viagens, pois itinerários checamos no loop)
      if (dataInicio) {
        queryEscalas = queryEscalas.gte('data_escala', dataInicio);
        queryExtras = queryExtras.gte('data_viagem', dataInicio);
      }
      if (dataFim) {
        queryEscalas = queryEscalas.lte('data_escala', dataFim);
        queryExtras = queryExtras.lte('data_viagem', dataFim);
      }

      // Filtro de Garagem (Aplicado a todas as queries)
      if (garagemFiltro !== 'TODAS') {
        queryEscalas = queryEscalas.eq('garagens.nome', garagemFiltro);
        queryExtras = queryExtras.eq('garagens.nome', garagemFiltro);
        queryItinerarios = queryItinerarios.eq('garagens.nome', garagemFiltro);
      }

      const [resEscalas, resExtras, resItin] = await Promise.all([
        queryEscalas, queryExtras, queryItinerarios
      ]);

      if (resEscalas.error) throw resEscalas.error;
      if (resExtras.error) throw resExtras.error;
      if (resItin.error) throw resItin.error;

      const resumo: any = {};
      const porGaragem: any = {};
      const porCliente: any = {};
      let tViagens = 0;
      let tExtras = 0;
      let tMovimentacoesItinerario = 0; // Soma de criados + atualizados

      listaGaragens.filter(g => g !== 'TODAS').forEach(g => porGaragem[g] = 0);

      // --- PROCESSAR ESCALAS FIXAS ---
      resEscalas.data?.forEach((esc: any) => {
        const dataISO = esc.data_escala;
        const gNome = esc.garagens.nome;
        const chave = visao === 'DIARIO' ? dataISO : dataISO.substring(0, 7);
        
        if (!resumo[chave]) resumo[chave] = { data: chave, viagens: 0, extras: 0, atualizados: 0 };
        
        (esc.escala_viagens || []).forEach((v: any) => {
          resumo[chave].viagens += 1;
          tViagens += 1;
          if (porGaragem[gNome] !== undefined) porGaragem[gNome] += 1;
          
          const cNome = v.cliente || 'N/I';
          if (!porCliente[cNome]) porCliente[cNome] = { name: cNome, fixas: 0, extras: 0, total: 0 };
          porCliente[cNome].fixas += 1;
          porCliente[cNome].total += 1;
        });
      });

      // --- PROCESSAR VIAGENS EXTRAS ---
      resExtras.data?.forEach((ext: any) => {
        const dataISO = ext.data_viagem;
        const gNome = ext.garagens.nome;
        const chave = visao === 'DIARIO' ? dataISO : dataISO.substring(0, 7);
        const cNome = ext.cliente || 'N/I';
        
        if (!resumo[chave]) resumo[chave] = { data: chave, viagens: 0, extras: 0, atualizados: 0 };
        resumo[chave].extras += 1;
        tExtras += 1;
        
        if (porGaragem[gNome] !== undefined) porGaragem[gNome] += 1;
        if (!porCliente[cNome]) porCliente[cNome] = { name: cNome, fixas: 0, extras: 0, total: 0 };
        porCliente[cNome].extras += 1;
        porCliente[cNome].total += 1;
      });

      // --- PROCESSAR ITINERÁRIOS (CRIAÇÃO E ATUALIZAÇÃO) ---
      resItin.data?.forEach((itin: any) => {
        const dataAtualizacao = itin.data_ultima_atualizacao;
        const dataCriacao = itin.created_at ? itin.created_at.split('T')[0] : null;
        
        // Verifica se houve movimentação no período selecionado
        const atualizadoNoPeriodo = dataAtualizacao && 
          (!dataInicio || dataAtualizacao >= dataInicio) && 
          (!dataFim || dataAtualizacao <= dataFim);

        const criadoNoPeriodo = dataCriacao && 
          (!dataInicio || dataCriacao >= dataInicio) && 
          (!dataFim || dataCriacao <= dataFim);

        if (atualizadoNoPeriodo || criadoNoPeriodo) {
          // Usa a data relevante para o gráfico
          const dataRelevante = atualizadoNoPeriodo ? dataAtualizacao : dataCriacao;
          const chave = visao === 'DIARIO' ? dataRelevante : dataRelevante.substring(0, 7);
          
          if (!resumo[chave]) resumo[chave] = { data: chave, viagens: 0, extras: 0, atualizados: 0 };
          
          resumo[chave].atualizados += 1;
          tMovimentacoesItinerario += 1;
        }
      });

      setStats(Object.values(resumo).sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime()));
      setPieData(Object.keys(porGaragem).map(k => ({ name: k, value: porGaragem[k] })).filter(i => i.value > 0));
      setClientesData(Object.values(porCliente).sort((a: any, b: any) => b.total - a.total));
      
      setTotais({ 
        viagens: tViagens, 
        extras: tExtras, 
        atualizados: tMovimentacoesItinerario, 
        itinerarios: resItin.data?.length || 0 // Total Base da Garagem (sem filtro de data)
      });

    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
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
                <div className="flex gap-4 mt-1">
                  <button onClick={() => setAbaAtiva('GERAL')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${abaAtiva === 'GERAL' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>Indicadores Gerais</button>
                  <button onClick={() => setAbaAtiva('CLIENTES')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${abaAtiva === 'CLIENTES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>Visão por Clientes</button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><Filter size={10}/> Garagem</label>
                <Select value={garagemFiltro} onValueChange={setGaragemFiltro}>
                  <SelectTrigger className="w-40 h-9 bg-slate-50 font-bold text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white">{listaGaragens.map(g => <SelectItem key={g} value={g} className="text-xs font-bold">{g}</SelectItem>)}</SelectContent>
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
              <div className="bg-slate-100 p-1 rounded-lg flex gap-1 h-9 items-center">
                <Button variant={visao === 'DIARIO' ? 'default' : 'ghost'} size="sm" className={`h-7 text-[10px] font-bold ${visao === 'DIARIO' ? 'bg-slate-800 text-white' : ''}`} onClick={() => setVisao('DIARIO')}>DIÁRIO</Button>
                <Button variant={visao === 'MENSAL' ? 'default' : 'ghost'} size="sm" className={`h-7 text-[10px] font-bold ${visao === 'MENSAL' ? 'bg-slate-800 text-white' : ''}`} onClick={() => setVisao('MENSAL')}>MENSAL</Button>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-blue-600 size-10" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando Banco...</p>
          </div>
        ) : (
          <>
            {/* ABA 1: GERAL */}
            {abaAtiva === 'GERAL' && (
              <div className="animate-in fade-in duration-500 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Viagens Fixas', valor: totais.viagens, cor: 'border-l-blue-600', icon: <Bus className="size-8 text-blue-600 opacity-20"/> },
                    { label: 'Viagens Extras', valor: totais.extras, cor: 'border-l-amber-500', icon: <PlusCircle className="size-8 text-amber-600 opacity-20"/> },
                    { label: 'Base Itinerários', valor: totais.itinerarios, cor: 'border-l-emerald-500', icon: <MapPinned className="size-8 text-emerald-600 opacity-20"/> },
                    { label: 'Movimentações', valor: totais.atualizados, cor: 'border-l-purple-500', icon: <Edit3 className="size-8 text-purple-600 opacity-20"/> },
                  ].map((card, i) => (
                    <Card key={i} className={`border-l-4 ${card.cor} shadow-sm bg-white relative`}>
                      <CardContent className="pt-6 h-28 flex flex-col justify-between relative overflow-hidden">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                        <h3 className="text-4xl font-black text-slate-900">{card.valor}</h3>
                        <div className="absolute right-2 -bottom-2">{card.icon}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-sm border-none">
                    <CardHeader className="border-b border-slate-50"><CardTitle className="text-xs font-black text-slate-500 uppercase">Volume de Viagens ({visao})</CardTitle></CardHeader>
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
                    <CardHeader className="border-b border-slate-50"><CardTitle className="text-xs font-black text-slate-500 uppercase">Gestão de Itinerário (Criação/Atualização)</CardTitle></CardHeader>
                    <CardContent className="h-[350px] pt-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="data" fontSize={10} fontWeight="bold" tickFormatter={formatarDataBR} />
                          <YAxis fontSize={10} fontWeight="bold" />
                          <Tooltip labelFormatter={formatarDataBR} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                          <Bar dataKey="atualizados" name="Itinerários Movimentados" fill="#a855f7" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card className="shadow-sm border-none">
                  <CardHeader className="border-b border-slate-50"><CardTitle className="text-xs font-black text-slate-500 uppercase">Distribuição por Garagem</CardTitle></CardHeader>
                  <CardContent className="h-[400px] pt-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pizzaData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={8} dataKey="value" label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                          {pizzaData.map((_, index) => <Cell key={index} fill={CORES_PIZZA[index % CORES_PIZZA.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ABA 2: CLIENTES */}
            {abaAtiva === 'CLIENTES' && (
              <div className="animate-in fade-in duration-500 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-l-4 border-l-blue-600 shadow-sm bg-white relative">
                    <CardContent className="pt-6 h-32 flex flex-col justify-between relative overflow-hidden">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest z-10">Total Viagens Fixas</p>
                      <h3 className="text-4xl font-black text-slate-900 z-10">{totais.viagens}</h3>
                      <div className="absolute right-2 -bottom-2"><Bus className="size-10 text-blue-600 opacity-20"/></div>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-amber-500 shadow-sm bg-white relative">
                    <CardContent className="pt-6 h-32 flex flex-col justify-between relative overflow-hidden">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest z-10">Total Viagens Extras</p>
                      <h3 className="text-4xl font-black text-slate-900 z-10">{totais.extras}</h3>
                      <div className="absolute right-2 -bottom-2"><PlusCircle className="size-10 text-amber-500 opacity-20"/></div>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-emerald-600 shadow-sm bg-white relative">
                    <CardContent className="pt-6 h-32 flex flex-col justify-between relative overflow-hidden">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest z-10">Total Geral</p>
                      <h3 className="text-4xl font-black text-slate-900 z-10">{totais.viagens + totais.extras}</h3>
                      <div className="absolute right-2 -bottom-2"><TrendingUp className="size-10 text-emerald-600 opacity-20"/></div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="shadow-sm border-none">
                  <CardHeader className="border-b border-slate-50"><CardTitle className="text-xs font-black text-slate-500 uppercase">Viagens do Dia</CardTitle></CardHeader>
                  <CardContent className="h-[350px] pt-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={stats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="data" fontSize={10} fontWeight="bold" tickFormatter={formatarDataBR} />
                        <YAxis fontSize={10} fontWeight="bold" />
                        <Tooltip labelFormatter={formatarDataBR} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                        <Bar dataKey="viagens" name="Total Fixas" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
                        <Line type="monotone" dataKey="extras" name="Total Extras" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: '#f59e0b' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-sm border-none">
                    <CardHeader className="border-b border-slate-50"><CardTitle className="text-xs font-black text-slate-500 uppercase">Ranking Geral por Cliente</CardTitle></CardHeader>
                    <CardContent className="h-[500px] pt-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={clientesData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                          <XAxis type="number" fontSize={10} fontWeight="bold" />
                          <YAxis dataKey="name" type="category" fontSize={9} fontWeight="bold" width={100} />
                          <Tooltip cursor={{fill: '#f8fafc'}} />
                          <Bar dataKey="total" name="Total Viagens" fill="#10b981" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm border-none">
                    <CardHeader className="border-b border-slate-50"><CardTitle className="text-xs font-black text-slate-500 uppercase">Viagens Extras por Cliente</CardTitle></CardHeader>
                    <CardContent className="h-[500px] pt-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={clientesData.filter(c => c.extras > 0)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                          <XAxis type="number" fontSize={10} fontWeight="bold" />
                          <YAxis dataKey="name" type="category" fontSize={9} fontWeight="bold" width={100} />
                          <Tooltip cursor={{fill: '#f8fafc'}} />
                          <Bar dataKey="extras" name="Viagens Extras" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}