import { Request, Response } from "express";
import { supabase } from "../services/supabase";

/**
 * Express controller helpers and handlers for o módulo de motoristas.
 *
 * Este módulo contém validações robustas para garantir que os dados recebidos
 * do front‑end estão no formato esperado. A lógica foi ajustada para
 * lidar de maneira segura com registros temporários (IDs que começam com
 * "temp-") e para garantir que apenas IDs válidos (UUIDs) sejam
 * enviados ao Supabase. Assim, o front pode continuar enviando campos em
 * camelCase ou snake_case sem provocar erros no backend.
 */

// Regex simples para validar UUIDs (versão 4 e similares).
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Normaliza os campos enviados pelo front. O Supabase usa snake_case,
 * enquanto o React utiliza camelCase. Esta função também trata ID
 * temporário e remove campos indesejados.
 */
function normalizarMotorista(input: any) {
  // Garante que o número de registro esteja disponível em snake_case.
  const numeroRegistro = input.numero_registro ?? input.numeroRegistro;

  return {
    nome: input.nome,
    numero_registro: numeroRegistro,
    categoria_id: input.categoria_id,
    garagem_id: input.garagem_id,
  } as Record<string, any>;
}

export async function getDadosGestaoMotoristas(req: Request, res: Response) {
  try {
    const [garagens, categorias, motoristas] = await Promise.all([
      supabase.from('garagens').select('id, nome').order('nome'),
      supabase.from('categorias_motorista').select('id, nome').order('nome'),
      supabase.from('motoristas').select('*').order('nome')
    ]);

    return res.status(200).json({
      garagens: garagens.data || [],
      categorias: categorias.data || [],
      motoristas: motoristas.data || []
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function salvarMotoristas(req: Request, res: Response) {
  const { payload } = req.body;
  // Verifica se o payload é um array.
  if (!Array.isArray(payload)) {
    return res.status(400).json({ error: "O payload deve ser um array de motoristas." });
  }

  try {
    const novos: any[] = [];
    const existentes: any[] = [];

    for (const rawMotorista of payload) {
      // Verificação básica de presença de campos obrigatórios.
      if (!rawMotorista || typeof rawMotorista !== 'object') {
        return res.status(400).json({ error: 'Formato de motorista inválido.' });
      }
      const { nome } = rawMotorista;
      const numeroRegistro = rawMotorista.numero_registro ?? rawMotorista.numeroRegistro;
      const categoriaId = rawMotorista.categoria_id;
      const garagemId = rawMotorista.garagem_id;

      // Campos obrigatórios devem estar presentes e não vazios.
      if (
        !nome || !String(nome).trim() ||
        !numeroRegistro || !String(numeroRegistro).trim() ||
        !categoriaId || !String(categoriaId).trim() ||
        !garagemId || !String(garagemId).trim()
      ) {
        return res.status(400).json({ error: `Todos os campos são obrigatórios para cada motorista.` });
      }

      // Decide se o registro é novo ou existente.
      const id = rawMotorista.id;
      const normalizado = normalizarMotorista(rawMotorista);

      if (id && typeof id === 'string' && !id.startsWith('temp-')) {
        // Valida se o ID é um UUID válido.
        if (!uuidRegex.test(id)) {
          return res.status(400).json({ error: `ID inválido fornecido para motorista: ${id}` });
        }
        // Para registros existentes, inclua o ID para o upsert.
        existentes.push({ id, ...normalizado });
      } else {
        // Não inclui o ID temporário nos novos registros; Supabase gerará um UUID.
        novos.push(normalizado);
      }
    }

    // Inserção de novos registros.
    if (novos.length) {
      const { error: insertError } = await supabase.from('motoristas').insert(novos);
      if (insertError) {
      throw insertError;
      }
    }

    // Atualização ou inserção de registros existentes.
    if (existentes.length) {
      // O onConflict com 'id' garante que atualizações ocorram baseadas no ID primário.
      const { error: upsertError } = await supabase.from('motoristas').upsert(existentes, { onConflict: 'id' });
      if (upsertError) {
        throw upsertError;
      }
    }

    return res.status(200).json({ message: 'Sincronizado' });
  } catch (err: any) {
    // Caso ocorra um erro interno, devolve resposta genérica com a mensagem.
    return res.status(500).json({ error: err.message ?? 'Erro interno no servidor.' });
  }
}

// Garante a exportação da função de listagem simples
export async function getMotoristas(req: Request, res: Response) {
  try {
    const { data, error } = await supabase.from('motoristas').select('*').order('nome');
    if (error) throw error;
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function excluirMotorista(req: Request, res: Response) {
  const { id } = req.params;
  // Verifica se o ID informado é válido.
  if (!id || !uuidRegex.test(id)) {
    return res.status(400).json({ error: 'ID inválido para exclusão.' });
  }
  try {
    const { error } = await supabase.from('motoristas').delete().eq('id', id);
    if (error) throw error;
    return res.status(200).json({ message: 'Removido' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Erro interno no servidor.' });
  }
}
