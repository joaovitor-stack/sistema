import { Router } from "express";
import { listTiposVeiculo } from "../controllers/tiposVeiculo.controller";

const router = Router();

/**
 * GET /api/tipos-veiculo
 */
router.get("/", listTiposVeiculo);

export default router;
