import { Request, Response } from "express";
import { supabase } from "../services/supabase";

/**
 * Lista todos os tipos de veículo
 * GET /api/tipos-veiculo
 */
export const listTiposVeiculo = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("tipos_veiculo")
      .select("id, nome")
      .order("nome");

    if (error) {
      console.error("Erro ao listar tipos de veículo:", error);
      return res.status(500).json({ message: "Erro ao buscar tipos de veículo" });
    }

    return res.json(data || []);
  } catch (err) {
    console.error("Erro inesperado ao listar tipos de veículo:", err);
    return res.status(500).json({ message: "Erro interno" });
  }
};
