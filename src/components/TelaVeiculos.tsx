import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Bus, Plus, Search, Trash2, Edit,
  Filter, Loader2, Car, ArrowLeft, X, Save
} from 'lucide-react';

// Se você tiver proxy no front (Vite/CRA), pode trocar para: const API_BASE = '/api';
const API_BASE = 'http://localhost:3333/api';

// --- INTERFACES ---
interface Veiculo {
  id: string;
  prefixo: string;
  placa: string;
  ano: number | null;
  tipo_veiculo_id: string | null;
  garagem_id: string | null;
  categoria_cnh_id: string | null;
  ativo: boolean;
  created_at?: string;

  tipos_veiculo: { nome: string } | null;
  garagens: { nome: string } | null;
  categorias_motorista: { nome: string } | null;
}

interface OpcaoFiltro {
  id: string;
  nome: string;
}

interface TelaVeiculosProps {
  onBack: () => void;
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!resp.ok) {
    let msg = 'Erro na requisição';
    try {
      const body = await resp.json();
      msg = body?.message || body?.error || msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  if (resp.status === 204) return undefined as T;
  return resp.json() as Promise<T>;
}

export function TelaVeiculos({ onBack }: TelaVeiculosProps) {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);

  // Auxiliares
  const [garagens, setGaragens] = useState<OpcaoFiltro[]>([]);
  const [tipos, setTipos] = useState<OpcaoFiltro[]>([]);
  const [categorias, setCategorias] = useState<OpcaoFiltro[]>([]);

  // Filtros (agora por ID, mais robusto)
  const [filtroGaragemId, setFiltroGaragemId] = useState('TODAS');
  const [filtroTipoId, setFiltroTipoId] = useState('TODOS');
  const [busca, setBusca] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [veiculoEditando, setVeiculoEditando] = useState<Partial<Veiculo> | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [resumo, setResumo] = useState({ total: 0, onibus: 0, micro: 0, van: 0, outros: 0 });

  useEffect(() => {
    fetchDados();
    fetchAuxiliares();
  }, []);

  // FILTRO
  const veiculosFiltrados = veiculos.filter(v => {
    const matchGaragem = filtroGaragemId === 'TODAS' || (v.garagem_id ?? '') === filtroGaragemId;
    const matchTipo = filtroTipoId === 'TODOS' || (v.tipo_veiculo_id ?? '') === filtroTipoId;

    const prefixo = (v.prefixo ?? '').toLowerCase();
    const placa = (v.placa ?? '').toLowerCase();
    const termo = busca.toLowerCase();

    const matchBusca = prefixo.includes(termo) || placa.includes(termo);

    return matchGaragem && matchTipo && matchBusca;
  });

  // CARDS DE RESUMO
  useEffect(() => {
    const r = {
      total: veiculosFiltrados.length,
      onibus: veiculosFiltrados.filter(v => v.tipos_veiculo?.nome === 'Ônibus').length,
      micro: veiculosFiltrados.filter(v => v.tipos_veiculo?.nome?.toLowerCase().includes('micro')).length,
      van: veiculosFiltrados.filter(v => v.tipos_veiculo?.nome === 'Van').length,
      outros: 0
    };
    r.outros = r.total - (r.onibus + r.micro + r.van);
    setResumo(r);
  }, [veiculosFiltrados]);

  async function fetchAuxiliares() {
    try {
      const [g, t, c] = await Promise.all([
        apiRequest<OpcaoFiltro[]>('/garagens'),
        apiRequest<OpcaoFiltro[]>('/tipos-veiculo'),
        apiRequest<OpcaoFiltro[]>('/categorias-motorista'),
      ]);

      setGaragens(g || []);
      setTipos(t || []);
      setCategorias(c || []);
    } catch (err) {
      console.error(err);
      alert((err as Error).message || 'Erro ao carregar auxiliares');
    }
  }

  async function fetchDados() {
    setLoading(true);
    try {
      const dataV = await apiRequest<Veiculo[]>('/veiculos');
      setVeiculos(dataV || []);
    } catch (err) {
      console.error(err);
      alert((err as Error).message || 'Erro ao carregar veículos');
    } finally {
      setLoading(false);
    }
  }

  const abrirNovo = () => {
    setVeiculoEditando({
      prefixo: '',
      placa: '',
      ano: new Date().getFullYear(),
      tipo_veiculo_id: null,
      garagem_id: null,
      categoria_cnh_id: null,
      ativo: true,
    });
    setIsModalOpen(true);
  };

  const abrirEdicao = (v: Veiculo) => {
    setVeiculoEditando(v);
    setIsModalOpen(true);
  };

  async function handleSalvar() {
    if (!veiculoEditando?.prefixo || !veiculoEditando?.placa) {
      return alert('Preencha os campos básicos');
    }
    setSalvando(true);

    const dadosParaSalvar = {
      prefixo: veiculoEditando.prefixo,
      placa: veiculoEditando.placa,
      ano: veiculoEditando.ano ?? null,
      tipo_veiculo_id: veiculoEditando.tipo_veiculo_id || null,
      garagem_id: veiculoEditando.garagem_id || null,
      categoria_cnh_id: veiculoEditando.categoria_cnh_id || null,
      ativo: veiculoEditando.ativo ?? true,
    };

    try {
      if (veiculoEditando.id) {
        await apiRequest(`/veiculos/${veiculoEditando.id}`, {
          method: 'PUT',
          body: JSON.stringify(dadosParaSalvar),
        });
      } else {
        await apiRequest(`/veiculos`, {
          method: 'POST',
          body: JSON.stringify(dadosParaSalvar),
        });
      }

      setIsModalOpen(false);
      await fetchDados();
    } catch (err) {
      console.error(err);
      alert((err as Error).message || 'Erro ao salvar veículo');
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(id: string) {
    if (!confirm('Deseja realmente excluir este veículo?')) return;

    try {
      await apiRequest(`/veiculos/${id}`, { method: 'DELETE' });
      await fetchDados();
    } catch (err) {
      console.error(err);
      alert((err as Error).message || 'Erro ao excluir veículo');
    }
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen relative">
      {/* CABEÇALHO */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack} className="bg-white">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bus className="w-8 h-8 text-blue-600" /> Gestão de Frota
          </h1>
        </div>
        <Button onClick={abrirNovo} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Adicionar Veículo
        </Button>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <CardResumo titulo="Total Filtrado" valor={resumo.total} icone={<Bus />} cor="text-blue-600" />
        <CardResumo titulo="Ônibus" valor={resumo.onibus} icone={<Bus />} cor="text-emerald-600" />
        <CardResumo titulo="Micros" valor={resumo.micro} icone={<Bus />} cor="text-amber-600" />
        <CardResumo titulo="Vans" valor={resumo.van} icone={<Bus />} cor="text-purple-600" />
        <CardResumo titulo="Carro Comum" valor={resumo.outros} icone={<Car />} cor="text-slate-600" />
      </div>

      {/* FILTROS */}
      <Card className="mb-6 border-none shadow-sm">
        <CardContent className="pt-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Prefixo ou placa..."
                className="pl-10"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>

          <Select value={filtroTipoId} onValueChange={setFiltroTipoId}>
            <SelectTrigger className="w-[180px]">
              <Bus className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os Tipos</SelectItem>
              {tipos.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroGaragemId} onValueChange={setFiltroGaragemId}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Garagem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todas Garagens</SelectItem>
              {garagens.map(g => (
                <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* TABELA */}
      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin w-10 h-10 text-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-slate-600 text-xs">PREFIXO</th>
                <th className="p-4 font-semibold text-slate-600 text-xs">PLACA</th>
                <th className="p-4 font-semibold text-slate-600 text-xs">TIPO / ANO</th>
                <th className="p-4 font-semibold text-slate-600 text-xs">GARAGEM</th>
                <th className="p-4 font-semibold text-slate-600 text-xs text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {veiculosFiltrados.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-blue-700">{v.prefixo}</td>
                  <td className="p-4 text-slate-700 font-medium">{v.placa}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">{v.tipos_veiculo?.nome}</span>
                      <span className="text-[10px] text-slate-400">Ano: {v.ano ?? '-'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 text-sm">{v.garagens?.nome}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => abrirEdicao(v)}
                        className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleExcluir(v.id)}
                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col animate-in slide-in-from-right">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {veiculoEditando?.id ? <Edit className="text-blue-600" /> : <Plus className="text-green-600" />}
                {veiculoEditando?.id ? 'Editar Veículo' : 'Novo Veículo'}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}><X /></Button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">PREFIXO</label>
                  <Input
                    value={veiculoEditando?.prefixo ?? ''}
                    onChange={e => setVeiculoEditando({ ...veiculoEditando, prefixo: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">PLACA</label>
                  <Input
                    value={veiculoEditando?.placa ?? ''}
                    onChange={e => setVeiculoEditando({ ...veiculoEditando, placa: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">TIPO DE VEÍCULO</label>
                <Select
                  value={veiculoEditando?.tipo_veiculo_id ?? ''}
                  onValueChange={val => setVeiculoEditando({ ...veiculoEditando, tipo_veiculo_id: val })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent>
                    {tipos.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">GARAGEM</label>
                <Select
                  value={veiculoEditando?.garagem_id ?? ''}
                  onValueChange={val => setVeiculoEditando({ ...veiculoEditando, garagem_id: val })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione a garagem" /></SelectTrigger>
                  <SelectContent>
                    {garagens.map(g => <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">CATEGORIA DE CNH</label>
                <Select
                  value={veiculoEditando?.categoria_cnh_id ?? ''}
                  onValueChange={val => setVeiculoEditando({ ...veiculoEditando, categoria_cnh_id: val })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                  <SelectContent>
                    {categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">ANO</label>
                <Input
                  type="number"
                  value={veiculoEditando?.ano ?? ''}
                  onChange={e => {
                    const val = e.target.value;
                    setVeiculoEditando({ ...veiculoEditando, ano: val === '' ? null : Number(val) });
                  }}
                />
              </div>
            </div>

            <Button
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 h-12 gap-2"
              onClick={handleSalvar}
              disabled={salvando}
            >
              {salvando ? <Loader2 className="animate-spin" /> : <Save className="w-4 h-4" />}
              {veiculoEditando?.id ? 'Salvar Alterações' : 'Cadastrar Veículo'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CardResumo({ titulo, valor, icone, cor }: any) {
  return (
    <Card className="border-none shadow-md">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{titulo}</p>
            <h3 className={`text-2xl font-black ${cor}`}>{valor}</h3>
          </div>
          <div className={`p-2 bg-slate-50 rounded-lg ${cor} opacity-80`}>{icone}</div>
        </div>
      </CardContent>
    </Card>
  );
}
