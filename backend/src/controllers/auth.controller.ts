import { Request, Response } from "express";
import { supabase } from "../services/supabase";

export async function validarPerfil(req: Request, res: Response) {
  const { userId } = req.params;

  try {
    const { data: perfil, error } = await supabase
      .from('perfis_usuarios')
      .select(`
        id, nome, email, ativo,
        roles_usuario ( codigo )
      `)
      .eq('id', userId)
      .single();

    if (error || !perfil) {
      return res.status(404).json({ error: "Perfil não encontrado no sistema." });
    }

    if (!perfil.ativo) {
      return res.status(403).json({ error: "Usuário inativo." });
    }

    return res.status(200).json({
      id: perfil.id,
      nome: perfil.nome,
      email: perfil.email,
      role: (perfil.roles_usuario as any).codigo,
      ativo: perfil.ativo
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}