import { Request, Response } from "express";
import { supabase } from "../services/supabase";

/**
 * Lista todas as garagens
 * GET /api/garagens
 */
export const listGaragens = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("garagens")
      .select("id, nome")
      .order("nome");

    if (error) {
      console.error("Erro ao listar garagens:", error);
      return res.status(500).json({ message: "Erro ao buscar garagens" });
    }

    return res.json(data || []);
  } catch (err) {
    console.error("Erro inesperado ao listar garagens:", err);
    return res.status(500).json({ message: "Erro interno" });
  }
};
