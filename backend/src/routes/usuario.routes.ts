import { Router } from "express";
import * as usuarioController from "../controllers/usuario.controller";

const router = Router();

router.get("/", usuarioController.getUsuarios);
router.get("/roles", usuarioController.getRoles);
router.post("/", usuarioController.salvarUsuario);
router.delete("/:id", usuarioController.excluirUsuario);

export default router;