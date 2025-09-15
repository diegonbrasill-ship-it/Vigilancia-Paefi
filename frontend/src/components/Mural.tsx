import { useEffect, useState } from "react";
import axios from "axios";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

type Post = {
  title: string;
  link: string;
  image?: string | null;
  excerpt?: string;
  date?: string;
};

type MuralProps = {
  source: "prefeitura" | "paefi" | "instagram" | "mds";
  mode?: "carousel" | "grid";
  type?: "image" | "video";
};

export default function Mural({ source, mode = "carousel", type }: MuralProps) {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get<Post[]>(`http://localhost:4000/news/${source}`);
        setPosts(res.data);
      } catch (err) {
        console.error(`Erro ao carregar mural ${source}:`, err);
      }
    }
    fetchData();
  }, [source]);

  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
  };

  if (!posts.length) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-3 text-center">
        {source === "prefeitura" && "Notícias da Prefeitura"}
        {source === "paefi" && "Notícias do PAEFI (MDS)"}
        {source === "instagram" && "Instagram @paipatos"}
        {source === "mds" && "Blog MDS - PAEFI"}
      </h2>

      {mode === "carousel" ? (
        <Slider {...settings}>
          {posts.map((post, i) => (
            <div key={i} className="p-4">
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                {post.image && (
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-md font-bold text-gray-800 mb-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  <a
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm font-medium hover:underline"
                  >
                    Ler mais →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {posts.map((post, i) => (
            <div key={i} className="bg-white shadow-md rounded-lg overflow-hidden">
              {post.image && (
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-32 object-cover"
                />
              )}
              <div className="p-3">
                <h3 className="text-sm font-bold text-gray-800 mb-1">{post.title}</h3>
                <a
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-xs font-medium hover:underline"
                >
                  Ler mais →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}





