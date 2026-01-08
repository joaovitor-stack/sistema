import { Router } from "express";
import { listGaragens } from "../controllers/garagem.controller";

const router = Router();

/**
 * GET /api/garagens
 */
router.get("/", listGaragens);

export default router;
