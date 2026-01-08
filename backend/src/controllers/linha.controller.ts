import { Request, Response } from "express";
import { supabase } from "../services/supabase";

// Regex simples para validar UUIDs.
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retorna os dados completos para a tela de linhas: lista de clientes e lista de linhas.
 */
export async function getLinhasDadosCompletos(req: Request, res: Response) {
  try {
    // Carregar todos os clientes
    const clientesQuery = supabase.from('clientes').select('id, nome').order('nome');
    // Carregar todas as linhas com join em clientes
    const linhasQuery = supabase.from('linhas').select(`
      id,
      codigo,
      nome,
      cliente_id,
      clientes (nome)
    `).order('created_at', { ascending: false });

    const [{ data: clientesData, error: clientesError }, { data: linhasData, error: linhasError }] = await Promise.all([
      clientesQuery,
      linhasQuery,
    ]);

    if (clientesError) throw clientesError;
    if (linhasError) throw linhasError;

    const linhas = (linhasData || []).map((item: any) => ({
      id: item.id,
      codigo: item.codigo,
      nome: item.nome,
      clienteId: item.cliente_id,
      clienteNome: item.clientes?.nome || 'Cliente não encontrado',
    }));

    return res.status(200).json({ clientes: clientesData || [], linhas });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Erro interno ao carregar dados de linhas.' });
  }
}

/**
 * Lista apenas as linhas com as informações do cliente associado.
 */
export async function getLinhas(req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from('linhas')
      .select(`
        id,
        codigo,
        nome,
        cliente_id,
        clientes (nome)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const linhas = (data || []).map((item: any) => ({
      id: item.id,
      codigo: item.codigo,
      nome: item.nome,
      clienteId: item.cliente_id,
      clienteNome: item.clientes?.nome || 'Cliente não encontrado',
    }));
    return res.status(200).json(linhas);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Erro interno ao listar linhas.' });
  }
}

/**
 * Cria uma nova linha. Espera no corpo os campos `codigo`, `nome` e `cliente_id`.
 */
export async function criarLinha(req: Request, res: Response) {
  const { codigo, nome, cliente_id } = req.body;

  // Validação básica dos campos
  if (!codigo || !String(codigo).trim() || !nome || !String(nome).trim() || !cliente_id || !String(cliente_id).trim()) {
    return res.status(400).json({ error: 'Campos obrigatórios: codigo, nome e cliente_id.' });
  }

  try {
    const { error } = await supabase.from('linhas').insert([
      {
        codigo,
        nome,
        cliente_id,
      },
    ]);
    if (error) throw error;
    return res.status(201).json({ message: 'Linha criada com sucesso.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Erro interno ao criar linha.' });
  }
}

/**
 * Remove uma linha pelo ID. Verifica se o ID é um UUID válido.
 */
export async function removerLinha(req: Request, res: Response) {
  const { id } = req.params;
  if (!id || !uuidRegex.test(id)) {
    return res.status(400).json({ error: 'ID inválido para remoção.' });
  }
  try {
    const { error } = await supabase.from('linhas').delete().eq('id', id);
    if (error) throw error;
    return res.status(200).json({ message: 'Linha removida com sucesso.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Erro interno ao remover linha.' });
  }
}