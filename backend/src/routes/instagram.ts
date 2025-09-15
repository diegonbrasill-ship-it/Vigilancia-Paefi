import { Router } from "express";

const router = Router();

// Exemplo mockado (simulação)
router.get("/", async (req, res) => {
  try {
    const posts = [
      {
        id: "1",
        image: "https://via.placeholder.com/400x300.png?text=Post+1",
        caption: "Exemplo de post do Instagram",
        link: "https://www.instagram.com/paipatos/",
      },
      {
        id: "2",
        image: "https://via.placeholder.com/400x300.png?text=Post+2",
        caption: "Outro exemplo",
        link: "https://www.instagram.com/paipatos/",
      },
    ];

    res.json(posts);
  } catch (err) {
    console.error("Erro ao buscar posts do Instagram:", err);
    res.status(500).json({ error: "Erro ao buscar posts do Instagram" });
  }
});

export default router;

