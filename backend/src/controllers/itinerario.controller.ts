import { Request, Response } from "express";
import { supabase } from "../services/supabase";

/*
 * Controlador do módulo de Itinerários (Ficha de Itinerário).
 *
 * Este módulo implementa as operações de listagem, consulta detalhada,
 * criação/atualização (upsert) e remoção de itinerários. A estrutura
 * segue o mesmo padrão das demais controllers, utilizando o cliente
 * Supabase para interagir com as tabelas do banco de dados. Os
 * itinerários consistem em um cabeçalho (tabela `itinerarios`) e duas
 * tabelas filhas: `itinerarios_dias` (dias em que a linha opera) e
 * `itinerario_paradas` (lista de paradas em ordem). As chaves
 * estrangeiras usam UUID para relacionar clientes, linhas, garagens e
 * tipos de veículo. Este controlador mantém todo o fluxo de dados
 * consistente com a estrutura esperada pelo front‑end descrito em
 * GestaoDeItinerarios.tsx.
 */

// Mapeamento de códigos de dias da semana para IDs numéricos conforme
// definição na tabela `dias_semana` (1=Domingo, 2=Segunda, etc.).
const DIAS_MAP: Record<string, number> = {
  DOM: 1,
  SEG: 2,
  TER: 3,
  QUA: 4,
  QUI: 5,
  SEX: 6,
  SAB: 7,
};

// Regex simples para validar UUIDs (versão 4 e similares).
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Lista todos os itinerários cadastrados, ordenados por criação
 * decrescente. Inclui joins com garagens (para nome), itinerarios_dias
 * (para códigos de dias) e itinerario_paradas (lista de paradas). As
 * paradas são ordenadas por ordem ascendente antes de retornar ao
 * cliente.
 */
export async function getItinerarios(req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from("itinerarios")
      .select(
        `*,
        garagens (nome),
        itinerarios_dias (dia_id, dias_semana (codigo)),
        itinerario_paradas (*)`
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Ordena as paradas em ordem ascendente (por ordem) para cada itinerário
    const mapped = (data || []).map((i: any) => ({
      ...i,
      itinerario_paradas: Array.isArray(i.itinerario_paradas)
        ? i.itinerario_paradas.sort((a: any, b: any) => a.ordem - b.ordem)
        : [],
    }));

    return res.status(200).json(mapped);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Erro interno ao listar itinerários." });
  }
}

/**
 * Consulta detalhada de um itinerário pelo ID. Retorna o mesmo
 * formato de getItinerarios, mas filtrando pelo ID e retornando
 * apenas um registro (single). Se o ID for inválido ou o itinerário
 * não existir, retorna um erro apropriado.
 */
export async function getItinerarioById(req: Request, res: Response) {
  const { id } = req.params;
  if (!id || !uuidRegex.test(id)) {
    return res.status(400).json({ error: "ID inválido para consulta." });
  }
  try {
    const { data, error } = await supabase
      .from("itinerarios")
      .select(
        `*,
        garagens (nome),
        itinerarios_dias (dia_id, dias_semana (codigo)),
        itinerario_paradas (*)`
      )
      .eq("id", id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Itinerário não encontrado." });

    const sorted = Array.isArray(data.itinerario_paradas)
      ? data.itinerario_paradas.sort((a: any, b: any) => a.ordem - b.ordem)
      : [];
    return res.status(200).json({ ...data, itinerario_paradas: sorted });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Erro interno ao buscar itinerário." });
  }
}

/**
 * Cria ou atualiza um itinerário. O corpo da requisição deve
 * conter os campos necessários: clienteId, linhaId, nomeCliente,
 * nomeLinha, garagem (UUID), turno, tipoVeiculo (UUID),
 * diasSemana (array de códigos) e paradas (array de objetos com
 * ordem, horario, referencia, bairro e endereco). Se um campo
 * opcional estiver ausente, será ignorado. Quando um ID é
 * fornecido, a operação será um update; caso contrário, cria um
 * novo itinerário. Após salvar o cabeçalho, substitui os registros
 * em itinerarios_dias e itinerario_paradas pelo novo conteúdo.
 */
export async function upsertItinerario(req: Request, res: Response) {
  const {
    id,
    clienteId,
    linhaId,
    nomeCliente,
    nomeLinha,
    garagem,
    turno,
    tipoVeiculo,
    diasSemana,
    paradas,
  } = req.body;
  // Verificações básicas
  if (!clienteId || !linhaId || !garagem) {
    return res.status(400).json({ error: "Campos obrigatórios: clienteId, linhaId e garagem." });
  }
  try {
    // Monta o payload para a tabela de itinerários
    const today = new Date().toISOString().split("T")[0];
    const payload: any = {
      cliente_id: clienteId,
      linha_id: linhaId,
      nome_cliente_snapshot: nomeCliente,
      nome_linha_snapshot: nomeLinha,
      garagem_id: garagem,
      turno_codigo: turno,
      tipo_veiculo_id: tipoVeiculo,
      data_ultima_atualizacao: today,
    };
    if (id) payload.id = id;

    const { data: itin, error: itinError } = await supabase
      .from("itinerarios")
      .upsert(payload)
      .select()
      .single();
    if (itinError) throw itinError;
    const itinId = itin.id;

    // Atualiza dias: remove antigos e insere novos
    // Apaga registros existentes
    await supabase.from("itinerarios_dias").delete().eq("itinerario_id", itinId);
    if (Array.isArray(diasSemana) && diasSemana.length > 0) {
      const diasData = diasSemana
        .map((cod: string) => {
          const diaId = DIAS_MAP[cod];
          if (!diaId) return null;
          return { itinerario_id: itinId, dia_id: diaId };
        })
        .filter(Boolean);
      if (diasData.length) {
        const { error: diasError } = await supabase
          .from("itinerarios_dias")
          .insert(diasData as any[]);
        if (diasError) throw diasError;
      }
    }

    // Atualiza paradas: remove antigos e insere novos
    await supabase.from("itinerario_paradas").delete().eq("itinerario_id", itinId);
    if (Array.isArray(paradas) && paradas.length > 0) {
      const paradasData = paradas.map((p: any) => ({
        itinerario_id: itinId,
        ordem: p.ordem,
        horario: p.horario,
        referencia: p.referencia,
        bairro: p.bairro,
        endereco: p.endereco,
      }));
      const { error: paradasError } = await supabase
        .from("itinerario_paradas")
        .insert(paradasData);
      if (paradasError) throw paradasError;
    }

    return res.status(id ? 200 : 201).json(itin);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Erro ao salvar itinerário." });
  }
}

/**
 * Remove um itinerário pelo ID. Se o ID for inválido, retorna
 * status 400. A exclusão cascata nas tabelas filhas (`itinerarios_dias`
 * e `itinerario_paradas`) é tratada automaticamente pelo
 * banco (ON DELETE CASCADE), mas ainda assim executamos deleção
 * explícita para garantir consistência em todos os ambientes.
 */
export async function deleteItinerario(req: Request, res: Response) {
  const { id } = req.params;
  if (!id || !uuidRegex.test(id)) {
    return res.status(400).json({ error: "ID inválido para remoção." });
  }
  try {
    // Exclui registros nas tabelas filhas antes de remover o itinerário
    await supabase.from("itinerarios_dias").delete().eq("itinerario_id", id);
    await supabase.from("itinerario_paradas").delete().eq("itinerario_id", id);
    const { error } = await supabase.from("itinerarios").delete().eq("id", id);
    if (error) throw error;
    return res.status(200).json({ message: "Itinerário removido com sucesso." });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Erro ao remover itinerário." });
  }
}