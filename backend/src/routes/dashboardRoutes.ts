import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
// Adicione a linha abaixo (ajuste o caminho conforme sua estrutura)
import { supabase } from "../services/supabase";

const router = Router();

router.get('/stats', DashboardController.getStats);

router.get('/garagens', async (req, res) => {
  // Agora o TS reconhecerá o 'supabase' aqui
  const { data, error } = await supabase.from('garagens').select('nome').order('nome');
  
  if (error) return res.status(500).json(error);
  return res.json(data);
});

export default router;