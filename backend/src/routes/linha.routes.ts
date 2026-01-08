import { Router } from "express";
import {
  getLinhas,
  criarLinha,
  removerLinha,
  getLinhasDadosCompletos,
} from "../controllers/linha.controller";

const router = Router();

// Endpoint para carregar linhas juntamente com os clientes (join) em uma única chamada
router.get("/dados-completos", getLinhasDadosCompletos);

// Lista somente as linhas com informações de cliente
router.get("/", getLinhas);

// Cria uma nova linha (código, nome, cliente_id)
router.post("/", criarLinha);

// Exclui uma linha pelo ID
router.delete("/:id", removerLinha);

export default router;