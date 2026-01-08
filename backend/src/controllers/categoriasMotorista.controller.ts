import { Request, Response } from "express";
import { supabase } from "../services/supabase";

/**
 * Lista todas as categorias de motorista
 * GET /api/categorias-motorista
 */
export const listCategoriasMotorista = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("categorias_motorista")
      .select("id, nome")
      .order("nome");

    if (error) {
      console.error("Erro ao listar categorias de motorista:", error);
      return res.status(500).json({ message: "Erro ao buscar categorias de motorista" });
    }

    return res.json(data || []);
  } catch (err) {
    console.error("Erro inesperado ao listar categorias de motorista:", err);
    return res.status(500).json({ message: "Erro interno" });
  }
};
