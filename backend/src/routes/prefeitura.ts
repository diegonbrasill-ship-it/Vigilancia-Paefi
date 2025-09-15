import { Router } from "express";
import axios from "axios";
import * as cheerio from "cheerio";

type Noticia = {
  title: string;
  link: string;
  image?: string;
};

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { data: html } = await axios.get("https://patos.pb.gov.br/noticias");
    const $ = cheerio.load(html);

    const noticias: Noticia[] = [];

    $("article").each((i, el) => {
      if (i >= 10) return false; // limita aos 10 primeiros

      const titleEl = $(el).find("h2.entry-title a");
      const title = titleEl.text().trim();
      const link = titleEl.attr("href") || "";

      // Extrair imagem
      const imgEl = $(el).find("img").first();
      let image = imgEl.attr("src") || "";
      if (image && !image.startsWith("http")) {
        // se for relativo
        image = `https://patos.pb.gov.br${image}`;
      }

      if (title && link) {
        noticias.push({ title, link, image });
      }
    });

    res.json(noticias);
  } catch (error: any) {
    console.error("Erro scraping prefeitura:", error.message);
    res.status(500).json({ error: "Erro ao buscar notícias da prefeitura" });
  }
});

export default router;





