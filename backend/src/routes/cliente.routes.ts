import { Router } from "express";
import {
  getClientes,
  criarCliente,
  removerCliente,
} from "../controllers/cliente.controller";

const router = Router();

// Lista todos os clientes, já retornando o status por meio da tabela cliente_status
router.get("/", getClientes);

// Cria um novo cliente. O corpo deve conter pelo menos nome e cnpj.
router.post("/", criarCliente);

// Remove um cliente pelo ID (UUID)
router.delete("/:id", removerCliente);

export default router;