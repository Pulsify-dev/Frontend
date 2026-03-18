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
    "Transparency Reports",
  ];

  return (
    <footer className="auth-footer">
      <div className="auth-footer-links">
        {footerLinks.map((item, i) => (
          <span key={item} className="auth-footer-item">
            {i > 0 && <span className="auth-footer-dot">·</span>}
            <a href="#" className="auth-footer-link">
              {item}
            </a>
          </span>
        ))}
      </div>
      <p className="auth-footer-lang">
        <strong>Language:</strong>{" "}
        <a href="#" className="auth-footer-lang-link">
          English (US)
        </a>
      </p>
    </footer>
  );
};

export default Footer;
