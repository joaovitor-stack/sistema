import { Request, Response } from "express";
import { supabase } from "../services/supabase";

// Regex simples para validar UUIDs.
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Obtém todos os clientes com o status associado, ordenados pelo nome.
 * A consulta faz um join implícito com a tabela cliente_status para retornar
 * o campo "status" em cliente_status.status. Caso não haja status,
 * assume-se "Ativo" por padrão.
 */
export async function getClientes(req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select(`
        id,
        nome,
        cnpj,
        cliente_status(status)
      `)
      .order('nome', { ascending: true });

    if (error) throw error;

    const clientes = (data || []).map((item: any) => ({
      id: item.id,
      nome: item.nome,
      cnpj: item.cnpj ?? '',
      status: item.cliente_status?.status ?? 'Ativo',
    }));

    return res.status(200).json(clientes);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Erro interno ao listar clientes.' });
  }
}

/**
 * Insere um novo cliente no banco de dados. Espera-se no corpo do request
 * pelo menos os campos `nome` e `cnpj`. O campo `status_id` é opcional
 * e, se não fornecido, será atribuído 1 (assumindo que status_id 1 = Ativo).
 */
export async function criarCliente(req: Request, res: Response) {
  const { nome, cnpj, status_id } = req.body;

  // Validação básica
  if (!nome || !String(nome).trim() || !cnpj || !String(cnpj).trim()) {
    return res.status(400).json({ error: 'Nome e CNPJ são obrigatórios.' });
  }

  const statusId = status_id ?? 1;

  try {
    const { error } = await supabase
      .from('clientes')
      .insert([
        {
          nome,
          cnpj,
          status_id: statusId,
        },
      ]);

    if (error) throw error;

    return res.status(201).json({ message: 'Cliente criado com sucesso.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Erro interno ao criar cliente.' });
  }
}

/**
 * Remove um cliente pelo ID. O ID deve ser um UUID válido.
 */
export async function removerCliente(req: Request, res: Response) {
  const { id } = req.params;
  if (!id || !uuidRegex.test(id)) {
    return res.status(400).json({ error: 'ID inválido para remoção.' });
  }

  try {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) throw error;
    return res.status(200).json({ message: 'Cliente removido com sucesso.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Erro interno ao remover cliente.' });
  }
}