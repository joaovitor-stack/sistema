import { Router } from "express";
import {
  getItinerarios,
  getItinerarioById,
  upsertItinerario,
  deleteItinerario,
} from "../controllers/itinerario.controller";

/**
 * Rotas para a gestão de Ficha de Itinerário. Seguem o padrão
 * RESTful simples: listagem, consulta por ID, criação/atualização
 * (upsert) e remoção. O front‑end espera consumir essas rotas para
 * persistir e recuperar dados de itinerários.
 */
const router = Router();

// Lista todos os itinerários
router.get("/", getItinerarios);

// Consulta detalhada de um itinerário
router.get("/:id", getItinerarioById);

// Cria um novo itinerário ou atualiza um existente (upsert). Para update,
// o ID pode ser enviado no corpo ou na URL (PUT /:id).
router.post("/", upsertItinerario);
router.put("/:id", (req, res) => {
  // Garante que o ID de rota seja adicionado ao corpo para o upsert
  req.body.id = req.params.id;
  return upsertItinerario(req, res);
});

// Remove um itinerário
router.delete("/:id", deleteItinerario);

export default router;