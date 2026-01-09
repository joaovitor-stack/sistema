import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Save, Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { LinhaEscala } from '../types';
import { supabase } from '../lib/supabase';

interface EditarEscalaProps {
  escalaOriginal: any;
  onBack: () => void;
}

export function EditarEscala({ escalaOriginal, onBack }: EditarEscalaProps) {
  const [loading, setLoading] = useState(true);
  
  // Estados de dados da Escala
  const [linhas, setLinhas] = useState<LinhaEscala[]>([]);
  const [garagemId, setGaragemId] = useState(escalaOriginal.garagem_id || '');
  const [dataEscala, setDataEscala] = useState(escalaOriginal.data_escala || '');
  const [diaSemana, setDiaSemana] = useState(escalaOriginal.dia_semana_texto || '');

  // Estados para dados vindos do Supabase
  const [clientesDB, setClientesDB] = useState<any[]>([]);
  const [todasLinhasDB, setTodasLinhasDB] = useState<any[]>([]);
  const [motoristasDB, setMotoristasDB] = useState<any[]>([]);
  const [garagensDB, setGaragensDB] = useState<any[]>([]);
  const [turnosDB, setTurnosDB] = useState<any[]>([]);
  const [tiposVeiculoDB, setTiposVeiculoDB] = useState<any[]>([]); // Tabela de Tipos (Van, Ônibus...)
  const [sentidosDB, setSentidosDB] = useState<any[]>([]);
  const [carrosDB, setCarrosDB] = useState<any[]>([]); // Tabela de Veículos Físicos (Prefixos)
  const [categoriasMotoristaDB, setCategoriasMotoristaDB] = useState<any[]>([]);

  // Constantes de controle
  const SEM_VEICULO_VALUE = '__SEM_VEICULO__';
  const SEM_CARRO_VALUE = '__SEM_CARRO__';

  // =========================
  // FUNÇÕES AUXILIARES (LÓGICA DE NEGÓCIO)
  // =========================
  const norm = (s: string = '') => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();

  const getCategoriaNomeDoMotorista = (nomeMotorista: string) => {
    if (!nomeMotorista) return '';
    const mot = motoristasDB.find((m) => m.nome === nomeMotorista);
    const cat = categoriasMotoristaDB.find((c) => c.id === mot?.categoria_id);
    return cat?.nome || '';
  };

  const tipoPermitido = (categoriaNome: string, tipoVeiculoNome: string) => {
    const cat = norm(categoriaNome);
    const tipo = norm(tipoVeiculoNome);

    const isOnibus = tipo.includes('ONIBUS') && !tipo.includes('MICRO');
    const isMicro = tipo.includes('MICRO');
    const isVan = tipo.includes('VAN');
    const isCarro = tipo.includes('CARRO');

    // MOTORISTA ÔNIBUS -> pode tudo
    if (cat.includes('MOTORISTA') && cat.includes('ONIBUS') && !cat.includes('MICRO')) return true;
    // MOTORISTA MICRO ÔNIBUS -> tudo menos ÔNIBUS
    if (cat.includes('MICRO')) return !isOnibus;
    // MOTORISTA VAN -> VAN e CARRO
    if (cat.includes('VAN')) return isVan || isCarro;
    // MOTORISTA CATEGORIA B -> só CARRO
    if (cat.includes('CATEGORIA B') || cat === 'B') return isCarro;

    return false;
  };

  const tiposVeiculoPermitidosParaMotorista = (nomeMotorista: string) => {
    const catNome = getCategoriaNomeDoMotorista(nomeMotorista);
    return tiposVeiculoDB.filter((v) => tipoPermitido(catNome, v.nome));
  };

  useEffect(() => {
    async function carregarDadosIniciais() {
      setLoading(true);
      try {
        // 1. Carrega tabelas de domínio
        const [cl, li, mo, ga, tu, ve, se, ca, cat] = await Promise.all([
          supabase.from('clientes').select('*').eq('status_id', 1).order('nome'),
          supabase.from('linhas').select('*').order('codigo'),
          supabase.from('motoristas').select('*').order('nome'),
          supabase.from('garagens').select('*').order('nome'),
          supabase.from('turnos').select('*').order('codigo'),
          supabase.from('tipos_veiculo').select('*').order('nome'),
          supabase.from('sentidos').select('*').order('descricao'),
          supabase.from('veiculos').select('id, prefixo, garagem_id, tipo_veiculo_id, ativo').order('prefixo'),
          supabase.from('categorias_motorista').select('*').order('nome'),
        ]);

        setClientesDB(cl.data || []);
        setTodasLinhasDB(li.data || []);
        setMotoristasDB(mo.data || []);
        setGaragensDB(ga.data || []);
        setTurnosDB(tu.data || []);
        setTiposVeiculoDB(ve.data || []);
        setSentidosDB(se.data || []);
        setCarrosDB(ca.data || []);
        setCategoriasMotoristaDB(cat.data || []);

        // 2. Carrega as viagens salvas no banco para esta escala
        // IMPORTANTE: Fazemos isso DEPOIS de carregar os domínios para garantir integridade se precisasse
        const { data: viagens } = await supabase
          .from('escala_viagens')
          .select('*')
          .eq('escala_id', escalaOriginal.id)
          .order('created_at', { ascending: true });

        // Mapeia as viagens do banco para o formato do Frontend (LinhaEscala)
        if (viagens) {
            // Precisamos dos tipos de veículo carregados para encontrar o NOME do tipo baseado no ID salvo
            const veiculosMap = ve.data || [];
            
            setLinhas(viagens.map(v => {
                const tipoObj = veiculosMap.find((t: any) => t.id === v.tipo_veiculo_id);
                
                return {
                    id: v.id,
                    nomeMotorista: v.motorista_nome_snapshot,
                    cliente: v.cliente_id || '',
                    linha: v.linha || '', // Código da linha
                    descricao: v.descricao || '',
                    sentido: v.sentido_id || '', // ID do sentido (UUID ou Codigo dependendo do banco, aqui assumindo UUID pelo Select abaixo)
                    turno: v.turno_codigo || '',
                    inicio: v.inicio?.slice(0, 5) || '',
                    fim: v.fim?.slice(0, 5) || '',
                    deslocamentoInicial: v.deslocamento_inicial?.slice(0, 5) || '',
                    deslocamentoFinal: v.deslocamento_final?.slice(0, 5) || '',
                    duracao: v.duracao || '',
                    tipo: tipoObj ? tipoObj.nome : '', // O frontend usa o NOME no value do Select
                    carro: v.carro || '',
                    numeroRegistro: v.motorista_re_snapshot || ''
                };
            }));
        }

      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar dados do banco.");
      } finally {
        setLoading(false);
      }
    }
    carregarDadosIniciais();
  }, [escalaOriginal.id]);

  const calcularDiaDaSemana = (dataString: string) => {
    if (!dataString) return '';
    const data = new Date(dataString + 'T00:00:00');
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return dias[data.getDay()];
  };

  const handleDataChange = (novaData: string) => {
    setDataEscala(novaData);
    setDiaSemana(calcularDiaDaSemana(novaData));
  };

  const calcularDuracao = (inicio: string, fim: string) => {
    if (!inicio || !fim) return '';
    try {
      const [h1, m1] = inicio.split(':').map(Number);
      const [h2, m2] = fim.split(':').map(Number);
      let total = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (total < 0) total += 1440;
      return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
    } catch { return ''; }
  };

  const handleAddLinha = () => {
    const nova: LinhaEscala = {
      id: crypto.randomUUID(),
      nomeMotorista: '', cliente: '', sentido: '', turno: '', inicio: '',
      descricao: '', fim: '', linha: '', tipo: '', carro: '',
      deslocamentoInicial: '', deslocamentoFinal: '', numeroRegistro: '', duracao: ''
    };
    setLinhas([...linhas, nova]);
  };

  const handleUpdateLinha = (id: string, field: keyof LinhaEscala, value: string) => {
    setLinhas(prev => prev.map(l => {
      if (l.id === id) {
        const up = { ...l, [field]: value };
        
        if (field === 'nomeMotorista') {
          const m = motoristasDB.find(mot => mot.nome === value);
          up.numeroRegistro = m ? m.numero_registro : '';
          
          // Validação de categoria ao trocar motorista
          const catNome = getCategoriaNomeDoMotorista(value);
          if (up.tipo && !tipoPermitido(catNome, up.tipo)) {
             up.tipo = '';
             up.carro = '';
          }
        }

        if (field === 'cliente') {
            up.linha = '';
            up.descricao = '';
        }

        if (field === 'linha') {
          const d = todasLinhasDB.find(ldb => ldb.codigo === value && ldb.cliente_id === l.cliente);
          up.descricao = d ? d.nome : '';
        }
        
        if (field === 'inicio' || field === 'fim') {
          up.duracao = calcularDuracao(field === 'inicio' ? value : l.inicio, field === 'fim' ? value : l.fim);
        }
        return up;
      }
      return l;
    }));
  };

  const salvarEdicao = async () => {
    if (!dataEscala || !garagemId) {
      toast.error("Data e Garagem são obrigatórias!");
      return;
    }

    setLoading(true);
    try {
      // 1. Update no cabeçalho
      const { error: errE } = await supabase
        .from('escalas')
        .update({ data_escala: dataEscala, garagem_id: garagemId, dia_semana_texto: diaSemana })
        .eq('id', escalaOriginal.id);
      if (errE) throw errE;

      // 2. Sincronização de Itens (Delete e Insert)
      // Removemos todas para recriar (estratégia simples para edição completa)
      await supabase.from('escala_viagens').delete().eq('escala_id', escalaOriginal.id);

      const viagensParaInserir = linhas.map(l => {
        // Encontra IDs relacionais
        const motoristaObj = motoristasDB.find(m => m.nome === l.nomeMotorista);
        const clienteObj = clientesDB.find(c => c.id === l.cliente);
        const veiculoObj = tiposVeiculoDB.find(v => v.nome === l.tipo);
        // O sentido salvo no state pode ser o codigo (se vindo do select) ou ID. 
        // Idealmente o select de Sentido deve usar o ID como value se o banco espera ID.
        // Assumindo que o banco espera UUID em 'sentido_id':
        const sentidoObj = sentidosDB.find(s => s.codigo === l.sentido || s.id === l.sentido);

        return {
            escala_id: escalaOriginal.id,
            motorista_id: motoristaObj?.id || null,
            motorista_nome_snapshot: l.nomeMotorista,
            motorista_re_snapshot: l.numeroRegistro,
            cliente_id: l.cliente || null,
            cliente: clienteObj?.nome || 'N/A',
            linha: l.linha,
            descricao: l.descricao,
            sentido_id: sentidoObj?.id || null, // Garante envio do UUID
            turno_codigo: l.turno || null,
            inicio: l.inicio || null,
            fim: l.fim || null,
            deslocamento_inicial: l.deslocamentoInicial || null,
            deslocamento_final: l.deslocamentoFinal || null,
            duracao: l.duracao,
            tipo_veiculo_id: veiculoObj?.id || null, // Salva o UUID do tipo
            carro: l.carro
        };
      });

      if (viagensParaInserir.length > 0) {
        const { error: errV } = await supabase.from('escala_viagens').insert(viagensParaInserir);
        if (errV) throw errV;
      }

      toast.success("Escala atualizada com sucesso!");
      onBack();
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin size-8 text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Editar Escala</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="bg-white"><ArrowLeft className="size-4 mr-2" /> Voltar</Button>
          <Button onClick={salvarEdicao} className="bg-blue-600 hover:bg-blue-700 text-white"><Save className="size-4 mr-2" /> Salvar Alterações</Button>
        </div>
      </div>

      <Card className="mb-6 shadow-sm border-blue-100">
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div>
            <label className="text-sm font-semibold mb-2 block">Data da Escala</label>
            <Input type="date" value={dataEscala} onChange={(e) => handleDataChange(e.target.value)} className="bg-white" />
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">Dia da Semana</label>
            <Input value={diaSemana} readOnly className="bg-gray-50 font-medium" />
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">Garagem</label>
            <Select value={garagemId} onValueChange={setGaragemId}>
              <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
              <SelectContent className="bg-white">
                {garagensDB.map(g => <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-white">
          <CardTitle className="text-lg text-blue-600">Itinerário de Viagens</CardTitle>
          <Button size="sm" onClick={handleAddLinha} className="bg-blue-600 text-white"><Plus className="size-4 mr-1" /> Adicionar Linha</Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="min-w-[180px]">Motorista</TableHead>
                <TableHead className="min-w-[150px]">Cliente</TableHead>
                <TableHead className="min-w-[120px]">Linha</TableHead>
                <TableHead className="min-w-[180px]">Descrição</TableHead>
                <TableHead className="min-w-[110px]">Sentido</TableHead>
                <TableHead className="min-w-[110px]">Turno</TableHead>
                <TableHead className="min-w-[110px]">D. Inicial</TableHead>
                <TableHead className="min-w-[110px]">Início</TableHead>
                <TableHead className="min-w-[110px]">Fim</TableHead>
                <TableHead className="min-w-[110px]">D. Final</TableHead>
                <TableHead className="min-w-[80px]">Duração</TableHead>
                <TableHead className="min-w-[140px]">Veículo</TableHead>
                <TableHead className="min-w-[90px]">Carro</TableHead>
                <TableHead className="min-w-[120px]">Nº Registro</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {linhas.map((linha) => (
                <TableRow key={linha.id}>
                  {/* MOTORISTA (Filtrado por Garagem da Escala) */}
                  <TableCell>
                    <Select value={linha.nomeMotorista} onValueChange={val => handleUpdateLinha(linha.id, 'nomeMotorista', val)}>
                      <SelectTrigger className="h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {motoristasDB
                            .filter(m => !garagemId || m.garagem_id === garagemId)
                            .map(m => <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>)
                        }
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell>
                    <Select value={linha.cliente} onValueChange={val => handleUpdateLinha(linha.id, 'cliente', val)}>
                      <SelectTrigger className="h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {clientesDB.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* LINHA (Filtrada por Cliente E Garagem da Escala) */}
                  <TableCell>
                    <Select value={linha.linha} onValueChange={val => handleUpdateLinha(linha.id, 'linha', val)} disabled={!linha.cliente}>
                      <SelectTrigger className="h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {todasLinhasDB
                            .filter(lc => lc.cliente_id === linha.cliente && lc.garagem_id === garagemId)
                            .map(lc => (
                                <SelectItem key={lc.id} value={lc.codigo}>{lc.codigo}</SelectItem>
                            ))
                        }
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell><Input value={linha.descricao} readOnly className="bg-gray-50 h-8 text-xs" /></TableCell>
                  
                  <TableCell>
                    <Select value={linha.sentido} onValueChange={val => handleUpdateLinha(linha.id, 'sentido', val)}>
                      <SelectTrigger className="h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {sentidosDB.map(s => <SelectItem key={s.id} value={s.id}>{s.descricao}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  <TableCell>
                    <Select value={linha.turno} onValueChange={val => handleUpdateLinha(linha.id, 'turno', val)}>
                      <SelectTrigger className="h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {turnosDB.map(t => <SelectItem key={t.id} value={t.codigo}>{t.descricao}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell><Input type="time" value={linha.deslocamentoInicial} onChange={e => handleUpdateLinha(linha.id, 'deslocamentoInicial', e.target.value)} className="h-8 text-xs border-orange-200" /></TableCell>
                  <TableCell><Input type="time" value={linha.inicio} onChange={e => handleUpdateLinha(linha.id, 'inicio', e.target.value)} className="h-8 text-xs" /></TableCell>
                  <TableCell><Input type="time" value={linha.fim} onChange={e => handleUpdateLinha(linha.id, 'fim', e.target.value)} className="h-8 text-xs" /></TableCell>
                  <TableCell><Input type="time" value={linha.deslocamentoFinal} onChange={e => handleUpdateLinha(linha.id, 'deslocamentoFinal', e.target.value)} className="h-8 text-xs border-orange-200" /></TableCell>
                  <TableCell><Input value={linha.duracao} readOnly className="bg-blue-50 font-bold h-8 text-xs text-blue-700" /></TableCell>
                  
                  {/* TIPO DE VEÍCULO (Filtrado por Categoria do Motorista) */}
                  <TableCell>
                    <Select 
                        value={linha.tipo || ''} 
                        onValueChange={(val) => {
                            if (val === SEM_VEICULO_VALUE) { handleUpdateLinha(linha.id, 'tipo', ''); return; }
                            handleUpdateLinha(linha.id, 'tipo', val);
                        }}
                        disabled={!linha.nomeMotorista}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder={linha.nomeMotorista ? 'Veículo' : '...'} /></SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value={SEM_VEICULO_VALUE}>Sem veículo</SelectItem>
                        {linha.nomeMotorista ? (
                            (() => {
                                const permitidos = tiposVeiculoPermitidosParaMotorista(linha.nomeMotorista);
                                if (permitidos.length === 0) return <SelectItem value="__none" disabled>Nenhum permitido</SelectItem>;
                                return permitidos.map(v => <SelectItem key={v.id} value={v.nome}>{v.nome}</SelectItem>);
                            })()
                        ) : <SelectItem value="__dis" disabled>Selecione motorista</SelectItem>}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* CARRO FÍSICO (Filtrado por Garagem e Tipo) */}
                  <TableCell>
                    <Select 
                        value={linha.carro || SEM_CARRO_VALUE} 
                        onValueChange={(val) => {
                             if (val === SEM_CARRO_VALUE) handleUpdateLinha(linha.id, 'carro', '');
                             else handleUpdateLinha(linha.id, 'carro', val);
                        }}
                        disabled={!linha.nomeMotorista}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder={linha.nomeMotorista ? 'Carro' : '...'} /></SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value={SEM_CARRO_VALUE}>Sem veículo</SelectItem>
                        {linha.nomeMotorista ? (
                            (() => {
                                const tiposPermitidos = tiposVeiculoPermitidosParaMotorista(linha.nomeMotorista);
                                const tipoSelecionadoId = tiposVeiculoDB.find(t => t.nome === linha.tipo)?.id;
                                
                                if (!tipoSelecionadoId || tiposPermitidos.length === 0) {
                                    return <SelectItem value="__none" disabled>Indisponível</SelectItem>;
                                }

                                const veiculosDisponiveis = carrosDB.filter(c => 
                                    c.garagem_id === garagemId && 
                                    c.tipo_veiculo_id === tipoSelecionadoId &&
                                    (c.ativo === null || c.ativo === true)
                                );

                                if (veiculosDisponiveis.length === 0) return <SelectItem value="__none" disabled>Sem carros</SelectItem>;

                                return veiculosDisponiveis.map(c => <SelectItem key={c.id} value={c.prefixo}>{c.prefixo}</SelectItem>);
                            })()
                        ) : <SelectItem value="__dis" disabled>Selecione motorista</SelectItem>}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell><Input value={linha.numeroRegistro} readOnly className="h-8 text-xs bg-gray-50 text-center" /></TableCell>
                  
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setLinhas(prev => prev.filter(l => l.id !== linha.id))}>
                      <Trash2 className="size-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}