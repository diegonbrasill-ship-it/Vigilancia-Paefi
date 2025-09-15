// frontend/src/components/SocialFeed.tsx
export default function SocialFeed() {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="font-semibold text-lg mb-3">📸 Programa PAI - Instagram</h2>
      <blockquote
        className="instagram-media"
        data-instgrm-permalink="https://www.instagram.com/paipatos/"
        data-instgrm-version="14"
        style={{ background: "#fff", border: 0, margin: "0 auto", maxWidth: "540px" }}
      ></blockquote>
      <script async src="//www.instagram.com/embed.js"></script>
    </div>
  );
}
