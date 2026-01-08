import { Request, Response } from "express";
import { supabase } from "../services/supabase";

export const listarViagensExtras = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('viagens_extras')
      .select('*')
      .order('data_viagem', { ascending: false });

    if (error) throw error;
    return res.json(data);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const criarViagemExtra = async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.from('viagens_extras').insert([req.body]);
    if (error) throw error;
    return res.status(201).send();
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const excluirViagemExtra = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('viagens_extras').delete().eq('id', id);
    if (error) throw error;
    return res.status(204).send();
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};