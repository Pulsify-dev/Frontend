/**
 * Footer Component
 * SoundCloud-style footer with legal links
 */

const Footer = () => {
  const footerLinks = [
    "Legal",
    "Privacy", 
    "Cookie Policy",
    "Cookie Manager",
    "Imprint",
    "Artist Resources",
    "Newsroom",
    "Charts",
    "Transparency Reports"
  ];

  return (
    <footer className="border-t border-border py-6 px-6">
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground mb-4">
        {footerLinks.map((item, i) => (
          <span key={item} className="flex items-center gap-2">
            {i > 0 && <span>·</span>}
            <a href="#" className="hover:text-foreground transition-colors">{item}</a>
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        <span className="font-semibold text-foreground">Language:</span>{" "}
        <a href="#" className="text-sky-400 hover:underline">English (US)</a>
      </p>
    </footer>
  );
};

export default Footer;
