import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useParallax } from '../hooks/useParallax';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  useParallax();

  return (
    <>
      <Navbar />
      <Footer />
      <div className="parallax-container">
        <div className="parallax-layer back"></div>
        <div className="parallax-layer front"></div>
      </div>
      <main className="relative z-10">
        <Outlet />
      </main>
    </>
  );
}

