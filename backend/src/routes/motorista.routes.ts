import { Router } from "express";
import { 
  getDadosGestaoMotoristas, 
  salvarMotoristas, 
  excluirMotorista,
  getMotoristas 
} from "../controllers/motorista.controller";

const router = Router();

// Endpoint para carregar os dados iniciais da tela de gestão
router.get("/dados-completos", getDadosGestaoMotoristas);

// Endpoint para salvar (Insert ou Update)
router.post("/salvar", salvarMotoristas);

// Endpoint para deletar
router.delete("/:id", excluirMotorista);

// Listagem simples (GET /motoristas)
router.get("/", getMotoristas);

export default router;
