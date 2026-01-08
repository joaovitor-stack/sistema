import { Router } from "express";
import { listCategoriasMotorista } from "../controllers/categoriasMotorista.controller";

const router = Router();

/**
 * GET /api/categorias-motorista
 */
router.get("/", listCategoriasMotorista);

export default router;
