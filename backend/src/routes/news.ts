// backend/src/routes/news.ts
import { Router } from "express";
import axios from "axios";

const router = Router();

import Parser from "rss-parser";
const parser = new Parser();

// Notícias da Prefeitura de Patos via RSS
router.get("/prefeitura", async (req, res) => {
  try {
    const feed = await parser.parseURL("https://patos.pb.gov.br/noticias/feed");

    const posts = feed.items.slice(0, 6).map((item) => ({
      title: item.title,
      link: item.link,
      date: item.pubDate,
      excerpt: item.contentSnippet,
    }));

    res.json(posts);
  } catch (err) {
    console.error("Erro ao buscar notícias da Prefeitura (RSS):", err);
    res.status(500).json({ error: "Erro ao buscar notícias da Prefeitura" });
  }
});


// Notícias do PAEFI no Blog MDS
router.get("/paefi", async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://blog.mds.gov.br/redesuas/wp-json/wp/v2/posts?categories=37&per_page=6&_embed"
    );

    const posts = data.map((post: any) => ({
      title: post.title.rendered,
      link: post.link,
      image: post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null,
      excerpt: post.excerpt.rendered.replace(/<[^>]+>/g, ""),
      date: post.date,
    }));

    res.json(posts);
  } catch (err) {
    console.error("Erro ao buscar notícias do PAEFI:", err);
    res.status(500).json({ error: "Erro ao buscar notícias do PAEFI" });
  }
});

export default router;


