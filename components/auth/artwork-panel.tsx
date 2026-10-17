import { Sparkles } from "lucide-react";

const artworkUrl =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-AApX9rQikYEunX9nJ7hPAZL996AdX3.png";

export function ArtworkPanel() {
  return (
    <div className="art-panel" aria-label="A collage of classic book covers">
      <div className="glow glow-one" />
      <div className="glow glow-two" />
      <div className="book-art book-art-back">
        <img src={artworkUrl} alt="Classic illustrated book covers" />
      </div>
      <div className="book-art book-art-front">
        <img src={artworkUrl} alt="Classic illustrated book covers" />
      </div>
      <div className="art-caption">
        <Sparkles aria-hidden="true" /> Stories worth staying for
      </div>
    </div>
  );
}
