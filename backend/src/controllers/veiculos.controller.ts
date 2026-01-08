// controllers/veiculos.controller.ts
import { Request, Response } from "express";
import { supabase } from "../services/supabase";

/**
 * IMPORTANTE:
 * Ajustado para as colunas reais da sua tabela veiculos:
 * - tipo_veiculo_id
 * - garagem_id
 * - categoria_cnh_id
 *
 * E mantendo joins para retornar os "nomes" relacionados:
 * - tipos_veiculo (nome)
 * - garagens (nome)
 * - categorias_motorista (nome)
 */

const SELECT_VEICULOS = `
  id,
  prefixo,
  placa,
  ano,
  tipo_veiculo_id,
  garagem_id,
  categoria_cnh_id,
  ativo,
  created_at,
  tipos_veiculo ( nome ),
  garagens ( nome ),
  categorias_motorista ( nome )
`;

export const listarVeiculos = async (req: Request, res: Response) => {
  try {
    const search = String(req.query.search ?? "").trim();

    // Mantive os nomes dos query params “amigáveis” (tipo_id, categoria_id),
    // mas mapeio internamente para as colunas reais.
    const tipo_id = String(req.query.tipo_id ?? "").trim();
    const garagem_id = String(req.query.garagem_id ?? "").trim();
    const categoria_id = String(req.query.categoria_id ?? "").trim();

    const ativoRaw = String(req.query.ativo ?? "").trim();

    let query = supabase
      .from("veiculos")
      .select(SELECT_VEICULOS)
      .order("prefixo");

    if (search) {
      query = query.or(`prefixo.ilike.%${search}%,placa.ilike.%${search}%`);
    }

    if (tipo_id) query = query.eq("tipo_veiculo_id", tipo_id);
    if (garagem_id) query = query.eq("garagem_id", garagem_id);
    if (categoria_id) query = query.eq("categoria_cnh_id", categoria_id);

    // ativo=true/false (opcional)
    if (ativoRaw !== "") {
      const ativo = ativoRaw === "true" || ativoRaw === "1";
      query = query.eq("ativo", ativo);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao listar veículos:", error);
      return res.status(500).json({ message: "Erro ao buscar veículos" });
    }

    return res.status(200).json(data || []);
  } catch (err) {
    console.error("Erro inesperado ao listar veículos:", err);
    return res.status(500).json({ message: "Erro interno" });
  }
};

export const criarVeiculo = async (req: Request, res: Response) => {
  try {
    const {
      prefixo,
      placa,
      ano,
      tipo_veiculo_id,
      garagem_id,
      categoria_cnh_id,
      ativo,
    } = req.body ?? {};

    if (!prefixo || !placa) {
      return res.status(400).json({ message: "prefixo e placa são obrigatórios" });
    }

    // ano pode vir vazio/string
    const anoInt =
      ano === null || ano === undefined || ano === ""
        ? null
        : Number.isFinite(Number(ano))
          ? Number(ano)
          : null;

    const payload = {
      prefixo: String(prefixo).trim(),
      placa: String(placa).trim(),
      ano: anoInt,
      tipo_veiculo_id: tipo_veiculo_id || null,
      garagem_id: garagem_id || null,
      categoria_cnh_id: categoria_cnh_id || null,
      ativo: ativo ?? true,
    };

    const { data, error } = await supabase
      .from("veiculos")
      .insert([payload])
      .select(SELECT_VEICULOS)
      .single();

    if (error) {
      console.error("Erro ao criar veículo:", error);
      return res.status(500).json({ message: "Erro ao criar veículo" });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error("Erro inesperado ao criar veículo:", err);
    return res.status(500).json({ message: "Erro interno" });
  }
};

export const atualizarVeiculo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const {
      prefixo,
      placa,
      ano,
      tipo_veiculo_id,
      garagem_id,
      categoria_cnh_id,
      ativo,
    } = req.body ?? {};

    const anoInt =
      ano === null || ano === undefined || ano === ""
        ? null
        : Number.isFinite(Number(ano))
          ? Number(ano)
          : null;

    const payload: any = {
      prefixo: prefixo !== undefined ? String(prefixo).trim() : undefined,
      placa: placa !== undefined ? String(placa).trim() : undefined,
      ano: ano !== undefined ? anoInt : undefined,
      tipo_veiculo_id: tipo_veiculo_id !== undefined ? (tipo_veiculo_id || null) : undefined,
      garagem_id: garagem_id !== undefined ? (garagem_id || null) : undefined,
      categoria_cnh_id: categoria_cnh_id !== undefined ? (categoria_cnh_id || null) : undefined,
      ativo: ativo !== undefined ? ativo : undefined,
    };

    // remove undefined para não sobrescrever campos sem querer
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    const { data, error } = await supabase
      .from("veiculos")
      .update(payload)
      .eq("id", id)
      .select(SELECT_VEICULOS)
      .maybeSingle();

    if (error) {
      console.error("Erro ao atualizar veículo:", error);
      return res.status(500).json({ message: "Erro ao atualizar veículo" });
    }

    if (!data) {
      return res.status(404).json({ message: "Veículo não encontrado" });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Erro inesperado ao atualizar veículo:", err);
    return res.status(500).json({ message: "Erro interno" });
  }
};

export const deletarVeiculo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("veiculos")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) {
      console.error("Erro ao deletar veículo:", error);
      return res.status(500).json({ message: "Erro ao deletar veículo" });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "Veículo não encontrado" });
    }

    return res.status(204).send();
  } catch (err) {
    console.error("Erro inesperado ao deletar veículo:", err);
    return res.status(500).json({ message: "Erro interno" });
  }
};
