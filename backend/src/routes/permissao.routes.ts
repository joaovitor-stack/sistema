import { Router } from "express";
import { getPermissoesPorRole, updatePermissoes } from "../controllers/permissao.controller";

const router = Router();

// Busca permissões pelo ID do cargo
router.get("/:role_id", getPermissoesPorRole);

// Atualiza ou cria uma regra de permissão
router.post("/update", updatePermissoes);

export default router;