import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  interface NavbarItemI {
    title: string;
    href: string;
  }
  const NavbarItem: React.FC<NavbarItemI> = ({ title, href }) => {
    return (
      <Link
        to={href}
        className="menucontextual-item"
        onClick={() => setOpen(false)}
      >
        {title}
      </Link>
    );
  };

  return (
    <>
      {/* Navbar fijo arriba */}
      <nav className="navbar">
        <ConnectButton />

        <Link to="/">Democracy Chain</Link>

        <button
          onClick={() => setOpen(!open)}
          className="focus:outline-none"
          aria-label="Abrir menú"
          style={{ padding: 0 }}
        >
          <svg
            width="35px"
            height="30px"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ position: "relative", left: "-2px" }}
          >
            <path
              d={
                open
                  ? "M6 18L18 6M6 6l12 12"
                  : "M5 8H13.75M5 12H19M10.25 16L19 16"
              }
              stroke="#ffffff"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </nav>

      {/* Overlay flotante del menú */}
      {open && (
        <div
          className="menucontextual-bg"
          onClick={() => setOpen(false)}
        >
          <div
            className="menucontextual"
            onClick={(e) => e.stopPropagation()}
          >
            <NavbarItem title="Inicio" href="/" />
            <NavbarItem title="Ciudadano" href="/citizen" />
            <NavbarItem title="Candidatos" href="/candidates" />
            <NavbarItem title="Sobre mi" href="/about" />
          </div>
        </div>
      )}
    </>
  );
}
