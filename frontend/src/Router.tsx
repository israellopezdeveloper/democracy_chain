import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import CandidatesPage from "./pages/Candidates";
import CitizenPage from "./pages/Citizen";
import AboutPage from "./pages/About";
import { ConnectedRoute } from "./components/ConnectedRoute";
import Editor from "./pages/Editor";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route element={<ConnectedRoute />}>
            <Route path="/candidates" element={<CandidatesPage />} />
            <Route path="/citizen" element={<CitizenPage />} />
            <Route path="/editor" element={<Editor />} />
          </Route>
          <Route path="/about" element={<AboutPage />} />
        </Route>
      </Routes>
    </BrowserRouter >
  );
}

