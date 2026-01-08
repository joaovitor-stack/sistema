import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Save, Plus, Trash2, ArrowLeft, UserPlus, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// --- INTERFACES ---
interface Motorista {
  id: string;
  nome: string;
  numeroRegistro: string; // CamelCase para uso interno no React
  categoria_id: string;
  garagem_id: string;
}

interface ItemDominio {
  id: string;
  nome: string;
}

interface GestaoMotoristasProps {
  onBack: () => void;
}

export function GestaoMotoristas({ onBack }: GestaoMotoristasProps) {
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [garagens, setGaragens] = useState<ItemDominio[]>([]);
  const [categorias, setCategorias] = useState<ItemDominio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // CORREÇÃO: Porta atualizada para 3333 conforme seu ajuste no backend
  const API_URL = 'http://localhost:3333'; 

  useEffect(() => {
    fetchDadosIniciais();
  }, []);

  async function fetchDadosIniciais() {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/motoristas/dados-completos`);
      
      if (!response.ok) {
        throw new Error("Não foi possível obter dados do servidor.");
      }
      
      const data = await response.json();

      setGaragens(data.garagens || []);
      setCategorias(data.categorias || []);

      // CORREÇÃO: Mapeamento explícito de numero_registro (DB) para numeroRegistro (React)
      // Isso garante que os motoristas cadastrados apareçam na tabela
      const motoristasFormatados = (data.motoristas || []).map((m: any) => ({
        id: m.id,
        nome: m.nome,
        numeroRegistro: m.numero_registro || '', 
        categoria_id: m.categoria_id,
        garagem_id: m.garagem_id
      }));

      setMotoristas(motoristasFormatados);
    } catch (error: any) {
      console.error("Erro no fetch inicial:", error);
      toast.error("Erro de conexão: Verifique se o backend está rodando na porta 3333.");
    } finally {
      setLoading(false);
    }
  }

  const handleAddMotorista = () => {
    const novoIDTemporario = `temp-${Math.random().toString(36).substr(2, 9)}`;
    const novo: Motorista = {
      id: novoIDTemporario,
      nome: '',
      numeroRegistro: '',
      categoria_id: '',
      garagem_id: ''
    };
    setMotoristas([...motoristas, novo]);
  };

  const handleUpdate = (id: string, field: keyof Motorista, value: string) => {
    setMotoristas(prev => prev.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const handleRemove = async (id: string) => {
    if (id.startsWith('temp-')) {
      setMotoristas(prev => prev.filter(m => m.id !== id));
      return;
    }

    if (!confirm("Esta ação excluirá o motorista permanentemente. Confirmar?")) return;

    try {
      const response = await fetch(`${API_URL}/motoristas/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error("Erro ao excluir no servidor.");
      
      setMotoristas(prev => prev.filter(m => m.id !== id));
      toast.success("Motorista removido com sucesso.");
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  const salvarAlteracoes = async () => {
    const temCamposVazios = motoristas.some(
      m => !m.nome.trim() || !m.numeroRegistro.trim() || !m.categoria_id || !m.garagem_id
    );

    if (temCamposVazios) {
      return toast.error("Todos os campos são obrigatórios.");
    }

    try {
      setSaving(true);
      
      // CORREÇÃO: Enviamos 'numero_registro' (snake_case) para o backend processar no Supabase
      const payload = motoristas.map(m => ({
        id: m.id, 
        nome: m.nome,
        numero_registro: m.numeroRegistro, 
        categoria_id: m.categoria_id,
        garagem_id: m.garagem_id
      }));

      const response = await fetch(`${API_URL}/motoristas/salvar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar no servidor.");
      }

      toast.success("Alterações sincronizadas com sucesso!");
      
      // Recarrega para obter os IDs reais gerados pelo banco
      await fetchDadosIniciais();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="bg-white border-slate-200">
            <ArrowLeft className="size-4 mr-2" /> Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <UserPlus className="text-blue-600" /> Gestão de Motoristas
            </h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Cadastro de Colaboradores</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchDadosIniciais} disabled={loading || saving} className="bg-white">
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={salvarAlteracoes} disabled={saving || loading} className="bg-green-600 hover:bg-green-700 text-white min-w-[180px] shadow-md">
            {saving ? <><Loader2 className="size-4 mr-2 animate-spin" /> Salvando...</> : <><Save className="size-4 mr-2" /> Salvar Alterações</>}
          </Button>
        </div>
      </div>

      <Card className="max-w-7xl mx-auto shadow-xl border-slate-200 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-white py-4">
          <CardTitle className="text-sm font-bold uppercase text-slate-600">Listagem de Motoristas</CardTitle>
          <Button size="sm" onClick={handleAddMotorista} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
            <Plus className="size-4 mr-1" /> Adicionar Novo
          </Button>
        </CardHeader>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <Loader2 className="size-8 animate-spin mb-4 text-blue-500" />
              <p className="font-medium">Carregando dados do servidor...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-100/80">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700">NOME COMPLETO</TableHead>
                    <TableHead className="w-[140px] font-bold text-slate-700">RE / REGISTRO</TableHead>
                    <TableHead className="w-[220px] font-bold text-slate-700">GARAGEM</TableHead>
                    <TableHead className="w-[240px] font-bold text-slate-700">CATEGORIA CNH</TableHead>
                    <TableHead className="w-[80px] text-center font-bold text-slate-700">AÇÕES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white">
                  {motoristas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20 text-slate-400">
                        Nenhum motorista encontrado. Clique em "Adicionar Novo".
                      </TableCell>
                    </TableRow>
                  ) : (
                    motoristas.map((m) => (
                      <TableRow key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell>
                          <Input value={m.nome} onChange={e => handleUpdate(m.id, 'nome', e.target.value)} placeholder="Nome" className="h-9" />
                        </TableCell>
                        <TableCell>
                          <Input value={m.numeroRegistro} onChange={e => handleUpdate(m.id, 'numeroRegistro', e.target.value)} placeholder="Registro" className="h-9" />
                        </TableCell>
                        <TableCell>
                          <Select value={m.garagem_id} onValueChange={val => handleUpdate(m.id, 'garagem_id', val)}>
                            <SelectTrigger className="h-9 bg-white border-slate-200">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              {garagens.map(g => <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={m.categoria_id} onValueChange={val => handleUpdate(m.id, 'categoria_id', val)}>
                            <SelectTrigger className="h-9 bg-white border-slate-200">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              {categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" onClick={() => handleRemove(m.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="max-w-7xl mx-auto mt-4 px-2 text-right">
        <p className="text-[10px] text-slate-400 uppercase font-bold italic">
          Total de Colaboradores: {motoristas.length}
        </p>
      </div>
    </div>
  );
}