import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import routes from "./routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Monte as rotas sob o prefixo `/api` para compatibilidade com URLs que utilizam o prefixo
app.use("/api", routes);

// Além de expor sob `/api`, monte o mesmo roteador na raiz.  
// Isso permite que chamadas para `/clientes`, `/linhas`, etc. funcionem sem o prefixo `/api`.
app.use(routes);

const port = Number(process.env.PORT) || 3333;

app.listen(port, () => {
  console.log(`✅ Backend rodando em http://localhost:${port}`);
  console.log(`➡️  Health check: http://localhost:${port}/api/health`);
});
