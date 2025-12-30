import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Save, Plus, Trash2, ArrowLeft, UserPlus, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

// --- INTERFACES ---
interface Motorista {
  id: string;
  nome: string;
  numeroRegistro: string;
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
  // Estados para dados
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [garagens, setGaragens] = useState<ItemDominio[]>([]);
  const [categorias, setCategorias] = useState<ItemDominio[]>([]);
  
  // Estados de controle
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchDadosIniciais();
  }, []);

  async function fetchDadosIniciais() {
    try {
      setLoading(true);
      
      // 1. Busca Tabelas de Domínio (Garagens e Categorias conforme seu SQL)
      const { data: dataGaragens, error: errGaragens } = await supabase
        .from('garagens')
        .select('id, nome')
        .order('nome');
      
      const { data: dataCategorias, error: errCategorias } = await supabase
        .from('categorias_motorista')
        .select('id, nome')
        .order('nome');

      if (errGaragens || errCategorias) throw new Error("Erro ao carregar tabelas de apoio.");

      setGaragens(dataGaragens || []);
      setCategorias(dataCategorias || []);

      // 2. Busca Motoristas cadastrados
      const { data: dataMotoristas, error: errMotoristas } = await supabase
        .from('motoristas')
        .select(`
          id, 
          nome, 
          numero_registro, 
          categoria_id, 
          garagem_id
        `)
        .order('nome');

      if (errMotoristas) throw errMotoristas;

      // Mapeia os nomes das colunas do banco (snake_case) para o estado (camelCase)
      const motoristasFormatados = (dataMotoristas || []).map(m => ({
        id: m.id,
        nome: m.nome,
        numeroRegistro: m.numero_registro,
        categoria_id: m.categoria_id,
        garagem_id: m.garagem_id
      }));

      setMotoristas(motoristasFormatados);
    } catch (error: any) {
      console.error("Erro no fetch:", error);
      toast.error("Erro ao carregar dados: " + error.message);
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
    // Se for um item que ainda não foi salvo no banco (ID temporário)
    if (id.startsWith('temp-')) {
      setMotoristas(prev => prev.filter(m => m.id !== id));
      return;
    }

    // Se já estiver no banco, confirma a exclusão real
    if (!confirm("Esta ação excluirá o motorista permanentemente do banco de dados. Confirmar?")) return;

    try {
      const { error } = await supabase
        .from('motoristas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setMotoristas(prev => prev.filter(m => m.id !== id));
      toast.success("Motorista removido com sucesso.");
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  const salvarAlteracoes = async () => {
    // Validação de campos obrigatórios
    const temCamposVazios = motoristas.some(
      m => !m.nome.trim() || !m.numeroRegistro.trim() || !m.categoria_id || !m.garagem_id
    );

    if (temCamposVazios) {
      return toast.error("Todos os campos (Nome, RE, Garagem e Categoria) são obrigatórios.");
    }

    try {
      setSaving(true);
      
      // PREPARAÇÃO DO PAYLOAD PARA RESOLVER O ERRO DE "NULL VALUE IN COLUMN ID"
      const payload = motoristas.map(m => {
        // Criamos um objeto base com as colunas do banco
        const registro: any = {
          nome: m.nome,
          numero_registro: m.numeroRegistro,
          categoria_id: m.categoria_id,
          garagem_id: m.garagem_id
        };

        // Regra de Ouro:
        // Se o ID NÃO for temporário, incluímos ele para o Supabase fazer UPDATE.
        // Se o ID FOR temporário, NÃO enviamos a chave 'id', permitindo que o 
        // Postgres gere o UUID automaticamente via DEFAULT gen_random_uuid().
        if (!m.id.startsWith('temp-')) {
          registro.id = m.id;
        }

        return registro;
      });

      const { error } = await supabase
        .from('motoristas')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;

      toast.success("Alterações salvas no banco de dados!");
      
      // Recarrega para obter os IDs oficiais gerados pelo banco para os novos registros
      await fetchDadosIniciais();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar: " + (error.message || "Erro desconhecido"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* HEADER FIXO */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={onBack} 
            className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
          >
            <ArrowLeft className="size-4 mr-2" /> Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <UserPlus className="text-blue-600" /> Gestão de Motoristas
            </h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Cadastro e Manutenção de Colaboradores
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchDadosIniciais} 
            disabled={loading || saving}
            className="bg-white"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            onClick={salvarAlteracoes} 
            disabled={saving || loading}
            className="bg-green-600 hover:bg-green-700 text-white shadow-md min-w-[180px]"
          >
            {saving ? (
              <><Loader2 className="size-4 mr-2 animate-spin" /> Salvando...</>
            ) : (
              <><Save className="size-4 mr-2" /> Salvar Alterações</>
            )}
          </Button>
        </div>
      </div>

      <Card className="max-w-7xl mx-auto shadow-xl border-slate-200 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-white py-4">
          <CardTitle className="text-sm font-bold uppercase text-slate-600 tracking-tight">
            Listagem de Motoristas Ativos
          </CardTitle>
          <Button 
            size="sm" 
            onClick={handleAddMotorista} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            <Plus className="size-4 mr-1" /> Adicionar Novo
          </Button>
        </CardHeader>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <Loader2 className="size-8 animate-spin mb-4 text-blue-500" />
              <p className="font-medium">Carregando dados do banco...</p>
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
                      <TableCell colSpan={5} className="text-center py-20">
                        <div className="flex flex-col items-center text-slate-400">
                          <UserPlus size={40} className="mb-2 opacity-20" />
                          <p>Nenhum motorista encontrado.</p>
                          <p className="text-xs">Clique em "Adicionar Novo" para começar.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    motoristas.map((m) => (
                      <TableRow key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell>
                          <Input 
                            value={m.nome} 
                            onChange={e => handleUpdate(m.id, 'nome', e.target.value)}
                            placeholder="Nome Completo"
                            className="h-9 border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            value={m.numeroRegistro} 
                            onChange={e => handleUpdate(m.id, 'numeroRegistro', e.target.value)}
                            placeholder="Ex: 00123"
                            className="h-9 border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={m.garagem_id} 
                            onValueChange={val => handleUpdate(m.id, 'garagem_id', val)}
                          >
                            <SelectTrigger className="h-9 bg-white border-slate-200">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              {garagens.map(g => (
                                <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={m.categoria_id} 
                            onValueChange={val => handleUpdate(m.id, 'categoria_id', val)}
                          >
                            <SelectTrigger className="h-9 bg-white border-slate-200">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              {categorias.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemove(m.id)}
                            className="hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          >
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
      
      {/* RODAPÉ INFORMATIVO */}
      <div className="max-w-7xl mx-auto mt-4 px-2">
        <p className="text-[10px] text-slate-400 uppercase font-bold text-right italic">
          Total de Colaboradores: {motoristas.length}
        </p>
      </div>
    </div>
  );
}