import { Router } from "express";
import { supabase } from "../services/supabase";

const router = Router();

router.get("/", async (req, res) => {
  const { data, error } = await supabase.from('turnos').select('*').order('codigo');
  if (error) return res.status(400).json(error);
  res.json(data);
});

export default router;