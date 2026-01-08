import { Request, Response } from "express";
import { supabase } from "../services/supabase";

export const getUsuarios = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('perfis_usuarios')
      .select(`
        id, nome, email, ativo, role_id,
        roles_usuario (codigo)
      `)
      .order('nome');

    if (error) throw error;
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getRoles = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('roles_usuario').select('*').order('descricao');
    if (error) throw error;
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const salvarUsuario = async (req: Request, res: Response) => {
  const { id, nome, email, role_id, senha } = req.body;

  try {
    if (id) {
      // --- EDIÇÃO DE USUÁRIO EXISTENTE ---
      
      // 1. Atualiza os dados do perfil na tabela 'perfis_usuarios'
      const { error: profileError } = await supabase
        .from('perfis_usuarios')
        .update({ nome, email, role_id })
        .eq('id', id);

      if (profileError) throw profileError;

      // 2. Atualiza a senha se ela foi informada no formulário
      if (senha && senha.trim() !== "") {
        // Usamos a API de Admin para forçar a nova senha no Auth do Supabase
        const { error: authError } = await supabase.auth.admin.updateUserById(
          id,
          { password: senha }
        );
        if (authError) throw authError;
      }

      return res.json({ message: "Usuário atualizado com sucesso!" });

    } else {
      // --- CRIAÇÃO DE NOVO USUÁRIO ---
      
      // 1. Cria o acesso no Auth do Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
      });

      if (authError) throw authError;

      // 2. Cria o perfil vinculado ao ID do Auth recém-criado
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('perfis_usuarios')
          .insert({
            id: authData.user.id,
            nome,
            email,
            role_id,
            ativo: true
          });
        if (profileError) throw profileError;
      }
      
      return res.status(201).json({ message: "Usuário criado com sucesso!" });
    }
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const excluirUsuario = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Nota: Aqui removemos o perfil. 
    // Em um cenário real, você também poderia remover o usuário do auth.admin.deleteUser(id)
    const { error } = await supabase.from('perfis_usuarios').delete().eq('id', id);
    
    if (error) throw error;
    return res.status(204).send();
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};