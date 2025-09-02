import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  Citizen,
  useDemocracyContract,
} from "../hooks/useDemocracyContract";
import { usePublicClient } from "wagmi";
import type { Abi, Address } from "viem";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const contract = useDemocracyContract();
  const publicClient = usePublicClient()!;
  const [viewerName, setViewerName] = useState<string | null>(null);

  // ⚡ cargar el nombre del viewer si hay wallet en la URL
  useEffect(() => {
    const wallet = searchParams.get("wallet");
    if (!wallet) return;

    const fetchCitizen = async () => {
      if (!contract) return;
      try {
        const address = contract.address as Address;
        const abi = contract.abi as Abi;

        const citizenUnknown = await publicClient.readContract({
          address,
          abi,
          functionName: "citizens",
          args: [wallet],
        });

        // @ts-expect-error "Dynamic ABI import"
        const citizen: Citizen = new Citizen(citizenUnknown);
        setViewerName(citizen.person.name);
      } catch (err) {
        console.error("Error al obtener ciudadano:", err);
      }
    };

    fetchCitizen();
  }, [searchParams, contract, publicClient]);

  // construir parts
  const parts: {
    text: string;
    link: string;
  }[] = location.pathname
    .split("/")
    .filter(Boolean)
    .map((item) => {
      if (item === "candidates")
        return { text: "Candidatos", link: item };
      if (item === "citizen")
        return { text: "Ciudadano", link: item };
      if (item === "about") return { text: "Sobre mi", link: item };
      if (item === "editor")
        return { text: "Editor de programa", link: item };
      if (item === "viewer")
        return { text: viewerName ?? "Cargando...", link: item };
      return { text: item, link: item };
    });
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

        {/* Breadcrumb */}
        <div className="breadcrumbs">
          <Link to="/">Democracy Chain</Link>
          {parts.map((part, i) => {
            const path =
              "/" +
              parts
                .slice(0, i + 1)
                .map((i) => i.link)
                .join("/");
            const isLast = i === parts.length - 1;
            return (
              <span key={path} className="crumb">
                {" › "}
                {isLast ? (
                  <span>{part.text}</span>
                ) : (
                  <Link to={path}>{part.text}</Link>
                )}
              </span>
            );
          })}
        </div>

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
