import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";

/* ===================== CONFIG ===================== */

const USE_REAL_API = import.meta.env.VITE_USE_REAL_API === "true";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

console.log("[INIT] USE_REAL_API =", USE_REAL_API);

/* ===================== TYPES ===================== */

interface Goleiro {
  id: number;
  nomecompleto: string;
  whatsapp: string;
  cidade: string;
  tipo_campo: string;
  status: boolean;
  fotoperfil: string;
  rating: number;
}

interface Partida {
  id: number;
  data: string;
  hora: string;
  endereco: string;
  tipocampo: string;
  contratante: string;
  idgoleiro: number | null;
  status: "confirmado" | "pendente" | "cancelado";
}

/* ===================== MOCK DB ===================== */

const DB_DELAY = 800;

const MOCK_DB = {
  goleiros: [
    { id: 1, nomecompleto: "Carlos Muralha", whatsapp: "11999990001", cidade: "São Paulo", tipo_campo: "Society", status: true, fotoperfil: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos", rating: 4.8 },
    { id: 2, nomecompleto: "João Mão de Cola", whatsapp: "11999990002", cidade: "Osasco", tipo_campo: "Campo", status: true, fotoperfil: "https://api.dicebear.com/7.x/avataaars/svg?seed=Joao", rating: 4.5 },
    { id: 3, nomecompleto: "Pedro Peneira", whatsapp: "11999990003", cidade: "São Paulo", tipo_campo: "Futsal", status: false, fotoperfil: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro", rating: 3.2 },
  ] as Goleiro[],
  partidas: [
    { id: 101, data: "2023-10-25", hora: "20:00", endereco: "Arena Society", tipocampo: "Society", contratante: "Time A", idgoleiro: 1, status: "confirmado" },
    { id: 102, data: "2023-10-26", hora: "19:00", endereco: "Quadra Zé", tipocampo: "Futsal", contratante: "Firma FC", idgoleiro: null, status: "pendente" },
  ] as Partida[],
};

/* ===================== API SAFE HELPERS ===================== */

async function safeFetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();
    console.error(`[API ERROR] ${url}`, response.status, text);
    throw new Error(`API error ${response.status}`);
  }

  const data = await response.json();

  return data;
}

/* ===================== DB SERVICE ===================== */

const DbService = {
  goleiros: {
    list: async (): Promise<Goleiro[]> => {
      if (!USE_REAL_API) {
        return new Promise(resolve =>
          setTimeout(() => resolve([...MOCK_DB.goleiros]), DB_DELAY)
        );
      }

      try {
        const data = await safeFetchJSON<Goleiro[]>("/api/goleiros");
        if (!Array.isArray(data)) throw new Error("Invalid data");
        return data;
      } catch (err) {
        console.warn("[DB] Falha API, usando mock", err);
        return MOCK_DB.goleiros;
      }
    },

    toggleStatus: async (id: number) => {
      if (!USE_REAL_API) {
        MOCK_DB.goleiros = MOCK_DB.goleiros.map(g =>
          g.id === id ? { ...g, status: !g.status } : g
        );
        return;
      }

      await fetch(`/api/goleiros/${id}/toggle`, { method: "POST" });
    },
  },

  partidas: {
    list: async (): Promise<Partida[]> => {
      if (!USE_REAL_API) {
        return new Promise(resolve =>
          setTimeout(() => resolve([...MOCK_DB.partidas]), DB_DELAY)
        );
      }

      try {
        const data = await safeFetchJSON<Partida[]>("/api/partidas");
        return data;
      } catch (err) {
        console.warn("[DB] Falha API partidas, usando mock", err);
        return MOCK_DB.partidas;
      }
    },
  },
};

/* ===================== APP ===================== */

function App() {
  const [goleiros, setGoleiros] = useState<Goleiro[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [g, p] = await Promise.all([
        DbService.goleiros.list(),
        DbService.partidas.list(),
      ]);
      setGoleiros(g);
      setPartidas(p);
    } finally {
      setLoading(false);
    }
  }

  async function generateAIMessage(partida: Partida) {
    if (!GEMINI_API_KEY) {
      alert("Configure VITE_GEMINI_API_KEY no Vercel");
      return;
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const goleiro = goleiros.find(g => g.id === partida.idgoleiro);
    const prompt = `
      Confirme a partida para o goleiro ${goleiro?.nomecompleto ?? "Goleiro"}.
      Data ${partida.data} às ${partida.hora}.
      Local ${partida.endereco}.
    `;

    await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
  }

  if (loading) return <div style={{ padding: 40 }}>Carregando...</div>;

  return (
    <div style={{ padding: 40 }}>
      <h1>Goleiro Manager</h1>

      <h2>Goleiros</h2>
      <ul>
        {goleiros.map(g => (
          <li key={g.id}>
            {g.nomecompleto} — {g.status ? "Ativo" : "Inativo"}
          </li>
        ))}
      </ul>

      <h2>Partidas</h2>
      <ul>
        {partidas.map(p => (
          <li key={p.id}>
            {p.contratante} ({p.status})
            {p.idgoleiro && (
              <button onClick={() => generateAIMessage(p)}>IA</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
