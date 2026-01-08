import { Request, Response } from 'express';
import { supabase } from "../services/supabase";
export const getFolgas = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('folgas')
      .select(`
        *,
        motoristas (nome, numero_registro),
        garagens (nome)
      `)
      .order('data_folga', { ascending: false });

    if (error) throw error;
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createFolga = async (req: Request, res: Response) => {
  const { motorista_id, garagem_id, data_folga } = req.body;

  try {
    // Verificar se já existe folga para este motorista nesta data
    const { data: existente } = await supabase
      .from('folgas')
      .select('id')
      .eq('motorista_id', motorista_id)
      .eq('data_folga', data_folga)
      .single();

    if (existente) {
      return res.status(400).json({ error: "Este motorista já possui uma folga registrada para este dia!" });
    }

    const { data, error } = await supabase
      .from('folgas')
      .insert([{ motorista_id, garagem_id, data_folga }])
      .select();

    if (error) throw error;
    return res.status(201).json(data[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteFolga = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('folgas').delete().eq('id', id);
    if (error) throw error;
    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};