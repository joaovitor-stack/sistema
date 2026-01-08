import { Request, Response } from 'express';
import { supabase } from '../services/supabase';

export const getPermissoesPorRole = async (req: Request, res: Response) => {
  const { role_id } = req.params;

  if (!role_id || role_id === 'undefined') {
    return res.json([]);
  }

  try {
    const { data, error } = await supabase
      .from('permissoes_modulos')
      .select('modulo_id, pode_ver, pode_editar')
      .eq('role_id', role_id);

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data || []);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro interno ao buscar permissões' });
  }
};

export const updatePermissoes = async (req: Request, res: Response) => {
  const { role_id, modulo_id, pode_ver, pode_editar } = req.body;

  // Validação para evitar o Bad Request (Erro 400)
  if (!role_id || !modulo_id) {
    return res.status(400).json({ error: 'role_id e modulo_id são obrigatórios.' });
  }

  try {
    // Busca se já existe uma permissão para este par role/modulo
    const { data: existente } = await supabase
      .from('permissoes_modulos')
      .select('id, pode_ver, pode_editar')
      .eq('role_id', role_id)
      .eq('modulo_id', modulo_id)
      .single();

    const payload = {
      role_id,
      modulo_id,
      pode_ver: pode_ver !== undefined ? pode_ver : (existente?.pode_ver || false),
      pode_editar: pode_editar !== undefined ? pode_editar : (existente?.pode_editar || false)
    };

    // Upsert baseado no UNIQUE(role_id, modulo_id) da sua tabela
    const { data, error } = await supabase
      .from('permissoes_modulos')
      .upsert(payload, { onConflict: 'role_id, modulo_id' })
      .select();

    if (error) throw error;
    return res.json(data);
  } catch (error: any) {
    console.error("Erro no update de permissões:", error.message);
    return res.status(400).json({ error: error.message });
  }
};