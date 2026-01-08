import { Router } from "express";
import * as controller from "../controllers/viagemExtra.controller";

const router = Router();

router.get("/", controller.listarViagensExtras);
router.post("/", controller.criarViagemExtra);
router.delete("/:id", controller.excluirViagemExtra);

export default router;