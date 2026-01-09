import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import {
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { LinhaEscala } from '../types';
import { supabase } from '../lib/supabase';

interface CriarNovaEscalaProps {
  userId: string;
  onSave: () => void;
  onBack: () => void;
}

export function CriarNovaEscala({
  userId,
  onSave,
  onBack,
}: CriarNovaEscalaProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [linhas, setLinhas] = useState<LinhaEscala[]>([]);
  const [clientesDisponiveis, setClientesDisponiveis] = useState<any[]>([]);
  const [todasLinhasCadastradas, setTodasLinhasCadastradas] = useState<any[]>([]);
  const [motoristasCadastrados, setMotoristasCadastrados] = useState<any[]>([]);
  const [garagensBanco, setGaragensBanco] = useState<any[]>([]);
  const [veiculosBanco, setVeiculosBanco] = useState<any[]>([]);
  // Lista de veículos físicos (prefixo, garagem_id, tipo_veiculo_id)
  const [carrosBanco, setCarrosBanco] = useState<any[]>([]);
  const [turnosBanco, setTurnosBanco] = useState<any[]>([]);
  const [sentidosBanco, setSentidosBanco] = useState<any[]>([]);
  const [categoriasMotoristaBanco, setCategoriasMotoristaBanco] = useState<any[]>([]);

  const [garagemId, setGaragemId] = useState('');
  const [dataEscala, setDataEscala] = useState('');
  const [diaSemana, setDiaSemana] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [linhasFaltantesParaExibir, setLinhasFaltantesParaExibir] = useState<any[]>([]);

  // =========================
  // REGRAS DE VEÍCULO POR CATEGORIA
  // =========================
  const SEM_VEICULO_VALUE = '__SEM_VEICULO__';
  const SEM_CARRO_VALUE = '__SEM_CARRO__';

  const norm = (s: string = '') =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .trim()
      .toUpperCase();

  const getCategoriaNomeDoMotorista = (nomeMotorista: string) => {
    if (!nomeMotorista) return '';
    const mot = motoristasCadastrados.find((m) => m.nome === nomeMotorista);
    const cat = categoriasMotoristaBanco.find((c) => c.id === mot?.categoria_id);
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

    // Fallback seguro: se não reconhecer, não libera nada
    return false;
  };

  const tiposVeiculoPermitidosParaMotorista = (nomeMotorista: string) => {
    const catNome = getCategoriaNomeDoMotorista(nomeMotorista);
    return veiculosBanco.filter((v) => tipoPermitido(catNome, v.nome));
  };

  useEffect(() => {
    async function carregarDadosIniciais() {
      try {
        const [
          { data: clie },
          { data: lBd },
          { data: mot },
          { data: gar },
          { data: vei },
          { data: tur },
          { data: sen },
          { data: cat },
          { data: car },
        ] = await Promise.all([
          supabase.from('clientes').select('*').order('nome'),
          supabase.from('linhas').select('*').order('codigo'),
          supabase.from('motoristas').select('*').order('nome'),
          supabase.from('garagens').select('*').order('nome'),
          supabase.from('tipos_veiculo').select('*').order('nome'),
          supabase.from('turnos').select('*').order('descricao'),
          supabase.from('sentidos').select('*').order('descricao'),
          supabase.from('categorias_motorista').select('*').order('nome'),
          supabase
            .from('veiculos')
            .select('id, prefixo, garagem_id, tipo_veiculo_id, ativo')
            .order('prefixo'),
        ]);

        setClientesDisponiveis(clie || []);
        setTodasLinhasCadastradas(lBd || []);
        setMotoristasCadastrados(mot || []);
        setGaragensBanco(gar || []);
        setVeiculosBanco(vei || []);
        setTurnosBanco(tur || []);
        setSentidosBanco(sen || []);
        setCategoriasMotoristaBanco(cat || []);
        setCarrosBanco(car || []);
      } catch (error) {
        console.error('Erro Supabase:', error);
        toast.error('Erro ao carregar dados do servidor.');
      }
    }
    carregarDadosIniciais();
  }, []);

  const calcularDiaDaSemana = (dataString: string) => {
    if (!dataString) return '';
    const data = new Date(dataString + 'T00:00:00');
    const diasSemana = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ];
    return diasSemana[data.getDay()];
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
      let totalMinutos = h2 * 60 + m2 - (h1 * 60 + m1);
      if (totalMinutos < 0) totalMinutos += 24 * 60;
      const horas = Math.floor(totalMinutos / 60);
      const minutos = totalMinutos % 60;
      return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
    } catch (e) {
      return '';
    }
  };

  const handleAddLinha = () => {
    const novaLinha: LinhaEscala = {
      id: crypto.randomUUID(),
      nomeMotorista: '',
      cliente: '',
      sentido: '',
      turno: '',
      inicio: '',
      descricao: '',
      fim: '',
      linha: '',
      tipo: '',
      carro: '',
      deslocamentoInicial: '',
      deslocamentoFinal: '',
      numeroRegistro: '',
      duracao: '',
    };
    setLinhas([...linhas, novaLinha]);
  };

  const handleUpdateLinha = (
    id: string,
    field: keyof LinhaEscala,
    value: string
  ) => {
    const safeValue = value ?? '';
    setLinhas((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const updatedRow = { ...l, [field]: safeValue };

          if (field === 'nomeMotorista') {
            const motorista = motoristasCadastrados.find(
              (m) => m.nome === safeValue
            );
            updatedRow.numeroRegistro = motorista ? motorista.numero_registro : '';

            // Se já havia veículo selecionado e não é permitido para a nova categoria, limpa
            const catNome = getCategoriaNomeDoMotorista(safeValue);
            if (updatedRow.tipo && !tipoPermitido(catNome, updatedRow.tipo)) {
              updatedRow.tipo = '';
              updatedRow.carro = '';
            }
          }

          if (field === 'cliente') {
            updatedRow.linha = '';
            updatedRow.descricao = '';
          }

          if (field === 'linha') {
            const dados = todasLinhasCadastradas.find(
              (lc) => lc.codigo === safeValue && lc.cliente_id === l.cliente
            );
            updatedRow.descricao = dados ? dados.nome : '';
          }

          if (field === 'inicio' || field === 'fim') {
            updatedRow.duracao = calcularDuracao(
              field === 'inicio' ? safeValue : l.inicio,
              field === 'fim' ? safeValue : l.fim
            );
          }

          return updatedRow;
        }
        return l;
      })
    );
  };

  const executarSalvarFinal = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userUUID = session?.user?.id || userId;

      if (!userUUID) throw new Error('Usuário não identificado.');

      const { data: novaEscala, error: errorEscala } = await supabase
        .from('escalas')
        .insert([
          {
            data_escala: dataEscala,
            dia_semana_texto: diaSemana,
            garagem_id: garagemId,
            criado_por: userUUID,
            hora_criacao: new Date().toLocaleTimeString('pt-BR', {
              hour12: false,
            }),
          },
        ])
        .select()
        .single();

      if (errorEscala) throw errorEscala;

      if (linhas.length > 0) {
        const viagensParaInserir = linhas.map((l) => {
          const motoristaObj = motoristasCadastrados.find(
            (m) => m.nome === l.nomeMotorista
          );
          const clienteObj = clientesDisponiveis.find((c) => c.id === l.cliente);
          const linhaObj = todasLinhasCadastradas.find(
            (line) => line.codigo === l.linha && line.cliente_id === l.cliente
          );
          const sentidoObj = sentidosBanco.find((s) => s.codigo === l.sentido);
          const veiculoObj = veiculosBanco.find((v) => v.nome === l.tipo);

          return {
            escala_id: novaEscala.id,
            motorista_id: motoristaObj?.id || null,
            motorista_nome_snapshot: l.nomeMotorista,
            motorista_re_snapshot: l.numeroRegistro,
            cliente_id: l.cliente || null,
            cliente: clienteObj?.nome || '',
            linha_id: linhaObj?.id || null,
            linha: l.linha,
            descricao: l.descricao,
            sentido_id: sentidoObj?.id || null,
            turno_codigo: l.turno,
            inicio: l.inicio || null,
            fim: l.fim || null,
            deslocamento_inicial: l.deslocamentoInicial || null,
            deslocamento_final: l.deslocamentoFinal || null,
            duracao: l.duracao,
            tipo_veiculo_id: veiculoObj?.id || null,
            carro: l.carro,
          };
        });

        const { error: errorViagens } = await supabase
          .from('escala_viagens')
          .insert(viagensParaInserir);

        if (errorViagens) throw errorViagens;
      }

      toast.success('Escala salva com sucesso!');
      setShowConfirmModal(false);
      onSave();
    } catch (error: any) {
      console.error('Erro ao salvar escala:', error);
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // AJUSTE 1: Validação da Garagem
  // ==========================================
  const validarAntesDeSalvar = () => {
    if (!dataEscala || !garagemId) {
      toast.error('Preencha a Data e a Garagem!');
      return;
    }
    const codigosNaEscala = linhas.map((l) => l.linha);
    
    // Filtra primeiro as linhas que pertencem à garagem selecionada
    // Se garagem_id for null no banco, assumimos que não deve ser validado ou ajusta conforme regra
    const linhasDaGaragem = todasLinhasCadastradas.filter(
        (lc) => lc.garagem_id === garagemId
    );

    // Agora verifica quais dessas estão faltando
    const faltantes = linhasDaGaragem.filter(
      (lc) => !codigosNaEscala.includes(lc.codigo)
    );

    setLinhasFaltantesParaExibir(faltantes);
    setShowConfirmModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Info className="size-5" /> Confirmar Escala
            </DialogTitle>
            <DialogDescription className="pt-4 text-slate-700">
              {linhasFaltantesParaExibir.length > 0 ? (
                <div>
                  <p className="font-bold text-orange-600 mb-2 flex items-center gap-1">
                    <AlertTriangle className="size-4" /> Linhas desta garagem ausentes:
                  </p>
                  <div className="max-h-40 overflow-y-auto bg-slate-50 p-2 rounded border border-slate-200">
                    {linhasFaltantesParaExibir.map((lf, idx) => {
                      const cliente = clientesDisponiveis.find(
                        (c) => c.id === lf.cliente_id
                      );
                      return (
                        <div
                          key={idx}
                          className="text-xs py-1 border-b last:border-0 flex justify-between"
                        >
                          <span className="font-semibold">
                            {cliente?.nome || 'Cliente'}
                          </span>
                          <span className="text-blue-600 font-bold">{lf.codigo}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="font-medium text-lg text-green-700 text-center">
                  Deseja salvar a escala agora?
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
            >
              Voltar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={executarSalvarFinal}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="animate-spin size-4 mr-2" />
              ) : (
                <Save className="size-4 mr-2" />
              )}
              Sim, Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Criar Nova Escala</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="bg-white">
            <ArrowLeft className="size-4 mr-2" /> Voltar
          </Button>
          <Button
            onClick={validarAntesDeSalvar}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Save className="size-4 mr-2" /> Salvar Escala
          </Button>
        </div>
      </div>

      <Card className="mb-6 shadow-sm border-blue-100">
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-slate-700">
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Data da Escala
            </label>
            <Input
              type="date"
              value={dataEscala}
              onChange={(e) => handleDataChange(e.target.value)}
              className="bg-white"
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Dia da Semana
            </label>
            <Input
              value={diaSemana}
              readOnly
              className="bg-gray-50 font-bold text-blue-700"
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">Garagem</label>
            <Select value={garagemId} onValueChange={setGaragemId}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {garagensBanco.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-white p-4">
          <CardTitle className="text-lg text-blue-600">
            Itinerário de Viagens
          </CardTitle>
          <Button
            size="sm"
            onClick={handleAddLinha}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="size-4 mr-1" /> Adicionar Linha
          </Button>
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
                <TableHead className="min-w-[100px] text-orange-600">
                  D. Inicial
                </TableHead>
                <TableHead className="min-w-[100px]">Início</TableHead>
                <TableHead className="min-w-[100px]">Fim</TableHead>
                <TableHead className="min-w-[100px] text-orange-600">
                  D. Final
                </TableHead>
                <TableHead className="min-w-[80px]">Duração</TableHead>
                <TableHead className="min-w-[140px]">Veículo</TableHead>
                <TableHead className="min-w-[90px]">Carro</TableHead>
                <TableHead className="min-w-[120px]">Nº Registro</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {linhas.map((linha) => (
                <TableRow key={linha.id} className="hover:bg-slate-50">
                  <TableCell>
                    <Select
                      value={linha.nomeMotorista || ''}
                      onValueChange={(val) =>
                        handleUpdateLinha(linha.id, 'nomeMotorista', val)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                        <SelectValue placeholder="Motorista" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {motoristasCadastrados
                          .filter((m) => !garagemId || m.garagem_id === garagemId)
                          .map((m) => (
                            <SelectItem key={m.id} value={m.nome}>
                              {m.nome}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={linha.cliente || ''}
                      onValueChange={(val) =>
                        handleUpdateLinha(linha.id, 'cliente', val)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                        <SelectValue placeholder="Cliente" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {clientesDisponiveis.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  {/* ========================================== */}
                  {/* AJUSTE 2: Filtragem de Linhas por Garagem  */}
                  {/* ========================================== */}
                  <TableCell>
                    <Select
                      value={linha.linha || ''}
                      onValueChange={(val) =>
                        handleUpdateLinha(linha.id, 'linha', val)
                      }
                      disabled={!linha.cliente}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                        <SelectValue placeholder="Linha" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {todasLinhasCadastradas
                          .filter(
                            (lc) => 
                                lc.cliente_id === linha.cliente && 
                                lc.garagem_id === garagemId // FILTRO NOVO AQUI
                          )
                          .map((lc) => (
                            <SelectItem key={lc.id} value={lc.codigo}>
                              {lc.codigo}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell>
                    <Input
                      value={linha.descricao || ''}
                      readOnly
                      className="bg-gray-50 h-8 text-xs border-slate-200"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={linha.sentido || ''}
                      onValueChange={(val) =>
                        handleUpdateLinha(linha.id, 'sentido', val)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                        <SelectValue placeholder="Sentido" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {sentidosBanco.map((s) => (
                          <SelectItem key={s.id} value={s.codigo}>
                            {s.descricao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={linha.turno || ''}
                      onValueChange={(val) =>
                        handleUpdateLinha(linha.id, 'turno', val)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                        <SelectValue placeholder="Turno" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {turnosBanco.map((t) => (
                          <SelectItem key={t.id} value={t.codigo}>
                            {t.descricao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={linha.deslocamentoInicial || ''}
                      onChange={(e) =>
                        handleUpdateLinha(
                          linha.id,
                          'deslocamentoInicial',
                          e.target.value
                        )
                      }
                      className="h-8 text-xs border-orange-200 focus:border-orange-400"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={linha.inicio || ''}
                      onChange={(e) =>
                        handleUpdateLinha(linha.id, 'inicio', e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={linha.fim || ''}
                      onChange={(e) =>
                        handleUpdateLinha(linha.id, 'fim', e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={linha.deslocamentoFinal || ''}
                      onChange={(e) =>
                        handleUpdateLinha(
                          linha.id,
                          'deslocamentoFinal',
                          e.target.value
                        )
                      }
                      className="h-8 text-xs border-orange-200 focus:border-orange-400"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={linha.duracao || ''}
                      readOnly
                      className="bg-blue-50 font-bold h-8 text-xs text-blue-700 border-blue-200"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={linha.tipo || ''}
                      onValueChange={(val) => {
                        if (val === SEM_VEICULO_VALUE) {
                          handleUpdateLinha(linha.id, 'tipo', '');
                          return;
                        }
                        handleUpdateLinha(linha.id, 'tipo', val);
                      }}
                      disabled={!linha.nomeMotorista}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                        <SelectValue
                          placeholder={
                            linha.nomeMotorista ? 'Veículo' : 'Selecione motorista'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value={SEM_VEICULO_VALUE}>Sem veículo</SelectItem>
                        {linha.nomeMotorista ? (
                          (() => {
                            const permitidos = tiposVeiculoPermitidosParaMotorista(
                              linha.nomeMotorista
                            );
                            if (permitidos.length === 0) {
                              return (
                                <SelectItem value="__none" disabled>
                                  Nenhum veículo permitido
                                </SelectItem>
                              );
                            }
                            return permitidos.map((v) => (
                              <SelectItem key={v.id} value={v.nome}>
                                {v.nome}
                              </SelectItem>
                            ));
                          })()
                        ) : (
                          <SelectItem value="__disabled" disabled>
                            Selecione um motorista primeiro
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={linha.carro || SEM_CARRO_VALUE}
                      onValueChange={(val) => {
                        if (val === SEM_CARRO_VALUE) {
                          handleUpdateLinha(linha.id, 'carro', '');
                        } else {
                          handleUpdateLinha(linha.id, 'carro', val);
                        }
                      }}
                      disabled={!linha.nomeMotorista}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                        <SelectValue
                          placeholder={
                            linha.nomeMotorista ? 'Carro' : 'Selecione um motorista'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value={SEM_CARRO_VALUE}>Sem veículo</SelectItem>
                        {linha.nomeMotorista ? (
                          (() => {
                            const tiposPermitidos = tiposVeiculoPermitidosParaMotorista(
                              linha.nomeMotorista
                            );
                            const tipoSelecionadoId = veiculosBanco.find(
                              (t) => t.nome === linha.tipo
                            )?.id;

                            if (!tipoSelecionadoId || tiposPermitidos.length === 0) {
                              return (
                                <SelectItem value="__none" disabled>
                                  Nenhum veículo disponível
                                </SelectItem>
                              );
                            }
                            const veiculosDisponiveis = carrosBanco.filter(
                              (c) =>
                                c.garagem_id === garagemId &&
                                c.tipo_veiculo_id === tipoSelecionadoId &&
                                (c.ativo === null || c.ativo === true)
                            );
                            if (veiculosDisponiveis.length === 0) {
                              return (
                                <SelectItem value="__none" disabled>
                                  Nenhum veículo disponível
                                </SelectItem>
                              );
                            }
                            return veiculosDisponiveis.map((c) => (
                              <SelectItem key={c.id} value={c.prefixo}>
                                {c.prefixo}
                              </SelectItem>
                            ));
                          })()
                        ) : (
                          <SelectItem value="__disabled" disabled>
                            Selecione um motorista primeiro
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={linha.numeroRegistro || ''}
                      readOnly
                      className="h-8 text-xs bg-gray-50 text-center"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const novaLista = linhas.filter((li) => li.id !== linha.id);
                        setLinhas(novaLista);
                      }}
                    >
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