// backend/src/index.ts
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { initDb } from "./db";
import authRoutes from "./routes/auth";
import newsRoutes from "./routes/news";

// Novas rotas que vamos criar
import prefeituraRoutes from "./routes/prefeitura";
import mdsRoutes from "./routes/mds";
import instagramRoutes from "./routes/instagram";

const app = express();

// Ajuste origin para o endereço do seu frontend (vite)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(bodyParser.json());
app.use(cookieParser());

const PORT = process.env.PORT || 4000;

(async function start() {
  try {
    await initDb();

    // Rotas já existentes
    app.use("/auth", authRoutes);
    app.use("/news", newsRoutes);

    // Novas rotas
    app.use("/api/prefeitura", prefeituraRoutes);
    app.use("/api/mds", mdsRoutes);
    app.use("/api/instagram", instagramRoutes);

    app.listen(PORT, () => console.log(`✅ Backend rodando em http://localhost:${PORT}`));
  } catch (err) {
    console.error("Erro ao iniciar backend:", err);
    process.exit(1);
  }
})();



