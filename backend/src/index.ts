// backend/src/index.ts
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import path from "path";
import { initDb } from "./db";
import authRoutes from "./routes/auth";
import newsRoutes from "./routes/news";
import usersRoutes from "./routes/users";
import casosRoutes from "./routes/casos";
import dashboardRoutes from './routes/dashboard';
import acompanhamentosRoutes from "./routes/acompanhamentos";
import relatoriosRoutes from "./routes/relatorios";
import vigilanciaRoutes from './routes/vigilancia';
import encaminhamentosRoutes from "./routes/encaminhamentos"; // <-- ADICIONE ESTA LINHA
import anexosRoutes from "./routes/anexos";

// Suas rotas do mural, 100% preservadas
import prefeituraRoutes from "./routes/prefeitura";
import mdsRoutes from "./routes/mds";
import instagramRoutes from "./routes/instagram";

const app = express();

// Sua configuração de CORS e outros middlewares, 100% preservada
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const PORT = process.env.PORT || 4000;

(async function start() {
  try {
    await initDb();

    // Rotas de Autenticação e Gerenciamento, 100% preservadas
    app.use("/auth", authRoutes);
    app.use("/api/users", usersRoutes);
    app.use("/api/casos", casosRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/vigilancia', vigilanciaRoutes);
    app.use("/api/acompanhamentos", acompanhamentosRoutes);
    app.use("/api/relatorios", relatoriosRoutes);
    app.use("/api/vigilancia", vigilanciaRoutes); // <-- 2. REGISTRO DA NOVA ROTA
    app.use("/api/encaminhamentos", encaminhamentosRoutes); // <-- ADICIONE ESTA LINHA
    app.use("/api/anexos", anexosRoutes);
    

    // Suas rotas do Mural, 100% preservadas
    app.use("/news", newsRoutes);
    app.use("/api/prefeitura", prefeituraRoutes);
    app.use("/api/mds", mdsRoutes);
    app.use("/api/instagram", instagramRoutes);

    app.listen(PORT, () => console.log(`✅ Backend rodando em http://localhost:${PORT}`));
  } catch (err) {
    console.error("Erro ao iniciar backend:", err);
    process.exit(1);
  }
})();



