import { Request, Response } from "express";
import { supabase } from "../services/supabase";

// 1. LISTAR TODAS AS ESCALAS (Sem alterações necessárias, o * já traz o turno)
export async function getEscalas(req: Request, res: Response) {
  try {
    // Primeira tentativa: incluir o join com turnos, caso exista o campo turno_id
    let { data, error } = await supabase
      .from('escalas')
      .select(`
        *,
        garagens (nome),
        escala_viagens (
          *,
          motoristas (nome, numero_registro),
          turnos!turno_id (descricao)
        ),
        perfis_usuarios!criado_por (nome)
      `)
      .order('data_escala', { ascending: false });

    // Se a tentativa com join falhar (por exemplo, se não houver relacionamento turno_id),
    // faz uma nova consulta sem o join em turnos.
    if (error) {
      const alt = await supabase
        .from('escalas')
        .select(`
          *,
          garagens (nome),
          escala_viagens (*, motoristas (nome, numero_registro)),
          perfis_usuarios!criado_por (nome)
        `)
        .order('data_escala', { ascending: false });
      data = alt.data;
      error = alt.error;
    }

    // Mapeia o turno para cada viagem: se houver relação com turnos, usa a descrição.
    if (data) {
      data.forEach((escala: any) => {
        if (Array.isArray(escala.escala_viagens)) {
          escala.escala_viagens = escala.escala_viagens.map((viagem: any) => {
            const turnoDesc = viagem.turnos?.descricao || viagem.turno || '';
            return { ...viagem, turno: turnoDesc };
          });
        }
      });
    }

    if (error) throw error;
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// 2. VISUALIZAR DETALHADA
export async function getEscalaDetalhada(req: Request, res: Response) {
  const { id } = req.params;
  try {
    // Primeira tentativa com join em turnos
    let { data, error } = await supabase
      .from('escalas')
      .select(`
        *,
        garagens (nome),
        perfis_usuarios!criado_por (nome),
        escala_viagens (
          *,
          motoristas (nome, numero_registro),
          turnos!turno_id (descricao)
        )
      `)
      .eq('id', id)
      .single();

    // Se houve erro na tentativa com join, faz consulta sem o join em turnos
    if (error) {
      const alt = await supabase
        .from('escalas')
        .select(`
          *,
          garagens (nome),
          perfis_usuarios!criado_por (nome),
          escala_viagens (
            *,
            motoristas (nome, numero_registro)
          )
        `)
        .eq('id', id)
        .single();
      data = alt.data;
      error = alt.error;
    }

    if (error) throw error;
    // Mapeia o turno dentro das viagens
    if (data && Array.isArray(data.escala_viagens)) {
      data.escala_viagens = data.escala_viagens.map((viagem: any) => {
        const turnoDesc = viagem.turnos?.descricao || viagem.turno || '';
        return { ...viagem, turno: turnoDesc };
      });
    }
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// 3. CRIAR NOVA (Garante que o turno vindo das linhas seja salvo)
export async function criarEscala(req: Request, res: Response) {
  const { escala, linhas } = req.body;
  try {
    const { data: novaEscala, error: errEscala } = await supabase
      .from('escalas')
      .insert([escala])
      .select().single();

    if (errEscala) throw errEscala;

    if (linhas && linhas.length > 0) {
      // O front-end deve enviar o campo 'turno' dentro de cada objeto de linha
      const viagensComId = linhas.map((l: any) => ({ 
        ...l, 
        escala_id: novaEscala.id 
      }));
      
      const { error: errViagens } = await supabase.from('escala_viagens').insert(viagensComId);
      if (errViagens) throw errViagens;
    }
    
    return res.status(201).json(novaEscala);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// 4. ATUALIZAR/EDITAR
export async function atualizarEscala(req: Request, res: Response) {
  const { id } = req.params;
  const { escala, linhas } = req.body;
  try {
    const { error: errUpdate } = await supabase.from('escalas').update(escala).eq('id', id);
    if (errUpdate) throw errUpdate;

    // Remove as antigas e insere as novas para evitar duplicidade ou lixo
    await supabase.from('escala_viagens').delete().eq('escala_id', id);
    
    if (linhas && linhas.length > 0) {
      const novasLinhas = linhas.map((l: any) => ({ ...l, escala_id: id }));
      await supabase.from('escala_viagens').insert(novasLinhas);
    }
    return res.status(200).json({ message: "Escala atualizada" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// 5. DUPLICAR (Corrigido para incluir TURNO e remover IDs antigos)
export async function duplicarEscala(req: Request, res: Response) {
  const { escalaId, userId } = req.body;
  try {
    // 1. Busca a escala original com todas as viagens
    const { data: original, error: errBusca } = await supabase
      .from('escalas')
      .select('*, escala_viagens(*)')
      .eq('id', escalaId)
      .single();

    if (errBusca) throw errBusca;

    // 2. Cria o cabeçalho da nova escala
    const { data: novaEscala, error: errNova } = await supabase
      .from('escalas')
      .insert([{
        data_escala: original.data_escala,
        garagem_id: original.garagem_id,
        dia_semana_texto: original.dia_semana_texto,
        criado_por: userId,
        hora_criacao: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }])
      .select().single();

    if (errNova) throw errNova;

    // 3. Duplica as viagens associadas
    if (original.escala_viagens && original.escala_viagens.length > 0) {
      const novasViagens = original.escala_viagens.map((v: any) => {
        // Removemos o ID antigo e campos de data automática para o banco gerar novos
        // Garantimos que o campo 'turno' está sendo desestruturado e incluído no dadosViagem
        const { id, created_at, ...dadosViagem } = v; 
        
        return { 
          ...dadosViagem, 
          escala_id: novaEscala.id // Vincula à nova escala criada acima
        };
      });

      const { error: errInsertViagens } = await supabase.from('escala_viagens').insert(novasViagens);
      if (errInsertViagens) throw errInsertViagens;
    }

    return res.status(201).json(novaEscala);
  } catch (err: any) {
    console.error("Erro ao duplicar:", err.message);
    return res.status(500).json({ error: err.message });
  }
}