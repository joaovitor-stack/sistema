import { Router } from "express";
import {
  listarVeiculos,
  criarVeiculo,
  atualizarVeiculo,
  deletarVeiculo,
} from "../controllers/veiculos.controller";

const router = Router();

// GET /veiculos
router.get("/", listarVeiculos);

// POST /veiculos
router.post("/", criarVeiculo);

// PUT /veiculos/:id
router.put("/:id", atualizarVeiculo);

// DELETE /veiculos/:id
router.delete("/:id", deletarVeiculo);

export default router;
