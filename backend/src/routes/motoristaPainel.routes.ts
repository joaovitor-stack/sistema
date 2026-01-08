import { Router } from "express";
// Importa o controller a partir do diretório de controllers.
// Na estrutura do projeto, os arquivos de controller ficam em 'controllers',
// enquanto as rotas ficam em 'routes'. Ao compilar para JavaScript,
// os caminhos relativos mudam de './' para '../controllers'.
import { getPainelMotorista } from "../controllers/motoristaPainel.controller";

const router = Router();

/**
 * GET /api/painel-motorista
 * Retorna o painel do motorista a partir do número de registro (RE).
 * Exemplo: /api/painel-motorista?re=1062
 */
router.get("/", getPainelMotorista);

export default router;