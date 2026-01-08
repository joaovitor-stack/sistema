import { Router } from "express";
import { validarPerfil } from "../controllers/auth.controller";
import escalaRoutes from "./escala.routes";
import motoristaRoutes from "./motorista.routes";

// Importa também as rotas de clientes e linhas para evitar 404 nas chamadas
import clienteRoutes from "./cliente.routes";
import linhaRoutes from "./linha.routes";

// Importa as rotas de itinerários para gestão de Ficha de Itinerário
import itinerarioRoutes from "./itinerario.routes";

// ✅ ADICIONAR: rotas de Garagens e Tipos de Veículo
import garagemRoutes from "./garagem.routes";
import tiposVeiculoRoutes from "./tiposVeiculo.routes";
import viagemExtraRoutes from "./viagemExtra.routes";
import turnoRoutes from "./turno.routes";     // ADICIONAR
import sentidoRoutes from "./sentido.routes"; // ADICIONAR
import folgaRoutes from "./folga.routes";
import usuarioRoutes from "./usuario.routes";
import permissaoRoutes from "./permissao.routes";
import dashboardRoutes from "./dashboardRoutes";
import categoriasMotoristaRoutes from "./categoriasMotorista.routes";
import veiculosRoutes from "./veiculos.routes";
import motoristaPainelRoutes from "./motoristaPainel.routes";



const router = Router();

// Rota de Login/Reconhecimento
router.get("/auth/perfil/:userId", validarPerfil);

// Agrupamento das rotas de Escala
router.use("/escalas", escalaRoutes);

// Rotas de Motoristas
router.use("/motoristas", motoristaRoutes);

// Rotas de Clientes
router.use("/clientes", clienteRoutes);

// Rotas de Linhas
router.use("/linhas", linhaRoutes);

// ✅ Rotas de Garagens
router.use("/garagens", garagemRoutes);

// ✅ Rotas de Tipos de Veículo (atenção: o path precisa ser EXATAMENTE "tipos-veiculo")
router.use("/tipos-veiculo", tiposVeiculoRoutes);

// Rotas de Itinerários (Ficha de Itinerário)
router.use("/itinerarios", itinerarioRoutes);

router.use("/viagens-extras", viagemExtraRoutes);

router.use("/turnos", turnoRoutes);     // ADICIONAR
router.use("/sentidos", sentidoRoutes); // ADICIONAR
router.use("/folgas", folgaRoutes); // Adicione esta linha
router.use("/usuarios", usuarioRoutes);
router.use("/permissoes", permissaoRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/categorias-motorista", categoriasMotoristaRoutes);
router.use("/veiculos", veiculosRoutes);
router.use("/painelmotorista", motoristaPainelRoutes);



export default router;
