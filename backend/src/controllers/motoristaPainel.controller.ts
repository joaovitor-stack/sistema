import { Request, Response } from "express";
import { supabase } from "../services/supabase";

/**
 * Retorna dados de painel para um motorista específico.
 * Este endpoint consolida as informações necessárias para a
 * área do motorista no PWA, incluindo a lista de viagens (escala),
 * folgas e itinerários associados às linhas do motorista.
 */
export const getPainelMotorista = async (req: Request, res: Response) => {
  try {
    const { re } = req.query as { re?: string };
    if (!re) {
      return res.status(400).json({ message: "Parâmetro 're' é obrigatório" });
    }

    // Busca o motorista pelo número de registro (RE)
    const { data: motorista, error: errorMotorista } = await supabase
      .from("motoristas")
      .select("id, nome, numero_registro, categoria_id, garagem_id")
      .eq("numero_registro", re)
      .maybeSingle();

    if (errorMotorista) {
      console.error("Erro ao buscar motorista por RE:", errorMotorista);
      return res.status(500).json({ message: "Erro ao buscar motorista" });
    }

    if (!motorista) {
      return res.status(404).json({ message: "Motorista não encontrado" });
    }

    const motoristaId = motorista.id;

    // Busca as viagens da escala vinculadas ao motorista
    const { data: viagens, error: errorViagens } = await supabase
      .from("escala_viagens")
      .select(
        "id, escala_id, motorista_id, motorista_nome_snapshot, motorista_re_snapshot, cliente_id, cliente, linha_id, linha, descricao, sentido_id, turno_codigo, inicio, fim, deslocamento_inicial, deslocamento_final, duracao, tipo_veiculo_id, carro, escalas(data_escala)"
      )
      .eq("motorista_id", motoristaId);

    if (errorViagens) {
      console.error("Erro ao buscar viagens do motorista:", errorViagens);
      return res.status(500).json({ message: "Erro ao buscar viagens do motorista" });
    }

    // Busca folgas do motorista (mantendo a lógica original de tratamento de erro)
    let folgas: any[] = [];
    try {
      const { data: folgaRows, error: errorFolgas } = await supabase
        .from("folgas")
        .select("id, motorista_id, data_folga")
        .eq("motorista_id", motoristaId);
      if (errorFolgas) throw errorFolgas;
      folgas = (folgaRows || []).map((f: any) => ({
        id: f.id,
        motorista_id: f.motorista_id,
        data: f.data_folga,
        observacao: null,
      }));
    } catch (errFolga) {
      console.warn("Aviso ao buscar folgas do motorista:", errFolga);
      folgas = [];
    }

    // Determina quais linhas estão relacionadas ao motorista para buscar itinerários
    const linhaIds = (viagens || [])
      .map((v: any) => v.linha_id)
      .filter((id) => id);

    let itinerarios: any[] = [];
    if (linhaIds.length > 0) {
      try {
        // ATUALIZAÇÃO: Adicionado 'nome_linha_snapshot' ao select
        const { data: itinRows, error: errorItinerarios } = await supabase
          .from("itinerarios")
          .select(
            `id, linha_id, nome_linha_snapshot, itinerario_paradas (id, ordem, horario, referencia, bairro, endereco)`
          )
          .in("linha_id", linhaIds);

        if (errorItinerarios) throw errorItinerarios;

        const result: any[] = [];
        (itinRows || []).forEach((it: any) => {
          const linhaId = it.linha_id;
          // ATUALIZAÇÃO: Captura o nome da linha ou usa o ID como fallback
          const nomeLinha = it.nome_linha_snapshot || linhaId; 

          const paradas = Array.isArray(it.itinerario_paradas)
            ? it.itinerario_paradas
            : [];

          paradas.forEach((p: any) => {
            // ATUALIZAÇÃO: Validação para descrição não ficar vazia
            // Prioridade: Endereco -> Bairro -> Referencia
            let descricaoValidada = p.endereco;
            if (!descricaoValidada || descricaoValidada.trim() === "") {
                descricaoValidada = p.bairro ? `Bairro: ${p.bairro}` : p.referencia;
            }

            result.push({
              id: p.id,
              linha_id: linhaId,
              nome_linha: nomeLinha, // Novo campo enviado ao front
              ordem: p.ordem,
              ponto: p.referencia ?? '',
              descricao: descricaoValidada ?? '',
              horario: p.horario ? p.horario.substring(0, 5) : '', // Formata HH:mm
            });
          });
        });
        itinerarios = result;
      } catch (errIt) {
        console.warn("Aviso ao buscar itinerários do motorista:", errIt);
        itinerarios = [];
      }
    }

    return res.json({
      motorista,
      viagens: viagens || [],
      folgas,
      itinerarios,
    });
  } catch (err) {
    console.error("Erro inesperado ao montar painel do motorista:", err);
    return res.status(500).json({ message: "Erro interno" });
  }
};