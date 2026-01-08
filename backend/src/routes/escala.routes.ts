import { Router } from "express";
import { 
  getEscalas, 
  getEscalaDetalhada, 
  criarEscala, 
  atualizarEscala, 
  duplicarEscala 
} from "../controllers/escala.controller";

const router = Router();

router.get("/", getEscalas);
router.get("/:id", getEscalaDetalhada);
router.post("/", criarEscala);
router.put("/:id", atualizarEscala);
router.post("/duplicar", duplicarEscala);

export default router;