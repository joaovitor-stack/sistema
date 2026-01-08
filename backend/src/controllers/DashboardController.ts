import { Request, Response } from 'express';
import { supabase } from "../services/supabase";
export const DashboardController = {
  async getStats(req: Request, res: Response) {
    try {
      const { dataInicio, dataFim, garagem } = req.query;

      // 1. Buscar Escalas e Viagens Fixas
      let queryEscalas = supabase
        .from('escalas')
        .select(`
          data_escala,
          garagens!inner(nome),
          escala_viagens(id, cliente)
        `);

      // 2. Buscar Viagens Extras
      let queryExtras = supabase
        .from('viagens_extras')
        .select(`data_viagem, garagens!inner(nome), cliente`);

      // 3. Buscar Itinerários (Contagem e Movimentação)
      let queryItin = supabase
        .from('itinerarios')
        .select(`data_ultima_atualizacao, created_at, garagens!inner(nome)`);

      // Aplicação de filtros conforme estrutura do banco
      if (dataInicio) {
        queryEscalas = queryEscalas.gte('data_escala', dataInicio);
        queryExtras = queryExtras.gte('data_viagem', dataInicio);
      }
      if (dataFim) {
        queryEscalas = queryEscalas.lte('data_escala', dataFim);
        queryExtras = queryExtras.lte('data_viagem', dataFim);
      }
      if (garagem && garagem !== 'TODAS') {
        queryEscalas = queryEscalas.eq('garagens.nome', garagem);
        queryExtras = queryExtras.eq('garagens.nome', garagem);
        queryItin = queryItin.eq('garagens.nome', garagem);
      }

      const [resEscalas, resExtras, resItin] = await Promise.all([
        queryEscalas, queryExtras, queryItin
      ]);

      // Aqui você retornaria os dados processados para o front
      return res.json({
        escalas: resEscalas.data,
        extras: resExtras.data,
        itinerarios: resItin.data
      });

    } catch (error) {
      return res.status(500).json({ error: 'Erro interno ao processar dashboard' });
    }
  }
};