import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";

/*
  -------------------------------------------------------------------------
  GUIA DE MIGRAÇÃO PARA VERCEL (Conexão MariaDB)
  -------------------------------------------------------------------------
  
  Para conectar este app ao seu banco de dados (162.241.203.142):
  
  1. Transforme este projeto em um app Next.js ou crie Serverless Functions na Vercel.
  2. Instale o driver do MySQL: `npm install mysql2`
  3. Configure as variáveis de ambiente na Vercel (Settings > Environment Variables):
     - DB_HOST: 162.241.203.142
     - DB_USER: onmitd99_anderson
     - DB_PASS: (Sua senha Floripa...)
     - DB_NAME: onmitd99_goleiros
     
  4. Crie uma rota de API (ex: /pages/api/goleiros.ts) com o código de conexão.
  5. Altere a constante USE_REAL_API abaixo para 'true'.
*/

// Ativa o uso da API real quando `VITE_USE_REAL_API=true` nas vars de ambiente (Vite/Vercel)
const USE_REAL_API = (import.meta.env.VITE_USE_REAL_API === 'true'); // <-- configurar em .env / Vercel

// --- Tipos ---
interface Goleiro {
  id: number;
  nomecompleto: string;
  whatsapp: string;
  cidade: string;
  tipo_campo: string;
  status: boolean; // true = Ativo, false = Inativo
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
  idgoleiro: number | null; // null se pendente
  status: 'confirmado' | 'pendente' | 'cancelado';
}

// --- SERVICE LAYER (CAMADA DE DADOS) ---

const DB_DELAY = 800; // Simula delay da internet no modo Mock

const MOCK_DB = {
  goleiros: [
    { id: 1, nomecompleto: "Carlos Muralha", whatsapp: "11999990001", cidade: "São Paulo", tipo_campo: "Society", status: true, fotoperfil: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos", rating: 4.8 },
    { id: 2, nomecompleto: "João 'Mão de Cola'", whatsapp: "11999990002", cidade: "Osasco", tipo_campo: "Campo", status: true, fotoperfil: "https://api.dicebear.com/7.x/avataaars/svg?seed=Joao", rating: 4.5 },
    { id: 3, nomecompleto: "Pedro Peneira", whatsapp: "11999990003", cidade: "São Paulo", tipo_campo: "Futsal", status: false, fotoperfil: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro", rating: 3.2 },
    { id: 4, nomecompleto: "Roberto Luva", whatsapp: "11999990004", cidade: "Guarulhos", tipo_campo: "Society", status: true, fotoperfil: "https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto", rating: 4.9 },
    { id: 5, nomecompleto: "André Seguro", whatsapp: "11999990005", cidade: "São Bernardo", tipo_campo: "Campo", status: true, fotoperfil: "https://api.dicebear.com/7.x/avataaars/svg?seed=Andre", rating: 4.7 },
  ] as Goleiro[],
  partidas: [
    { id: 101, data: "2023-10-25", hora: "20:00", endereco: "Arena Society, SP", tipocampo: "Society", contratante: "Time dos Amigos", idgoleiro: 1, status: "confirmado" },
    { id: 102, data: "2023-10-26", hora: "19:00", endereco: "Quadra do Zé, Osasco", tipocampo: "Futsal", contratante: "Firma FC", idgoleiro: null, status: "pendente" },
    { id: 103, data: "2023-10-27", hora: "21:00", endereco: "Clube Atlético, SP", tipocampo: "Campo", contratante: "Real Matismo", idgoleiro: 2, status: "confirmado" },
    { id: 104, data: "2023-10-28", hora: "10:00", endereco: "Arena Play, Guarulhos", tipocampo: "Society", contratante: "Domingueiros", idgoleiro: 4, status: "cancelado" },
  ] as Partida[]
};

const DbService = {
  goleiros: {
    list: async (): Promise<Goleiro[]> => {
      if (USE_REAL_API) {
        try {
          console.log('[DB] Fetching goleiros from /api/goleiros');
          const response = await fetch('/api/goleiros'); // Rota que você criará na Vercel
          console.log('[DB] Response status:', response.status);
          if (!response.ok) throw new Error(`API error: ${response.status}`);
          const data = await response.json();
          console.log('[DB] Data received:', data);
          return data;
        } catch (e) {
          console.error("[DB] Erro API, usando mock", e);
          return MOCK_DB.goleiros;
        }
      }
      return new Promise(resolve => setTimeout(() => resolve([...MOCK_DB.goleiros]), DB_DELAY));
    },
    toggleStatus: async (id: number): Promise<void> => {
      if (USE_REAL_API) {
        await fetch(`/api/goleiros/${id}/toggle`, { method: 'POST' });
        return;
      }
      return new Promise(resolve => {
        setTimeout(() => {
          MOCK_DB.goleiros = MOCK_DB.goleiros.map(g => g.id === id ? { ...g, status: !g.status } : g);
          resolve();
        }, DB_DELAY / 2);
      });
    }
  },
  partidas: {
    list: async (): Promise<Partida[]> => {
      if (USE_REAL_API) {
        const response = await fetch('/api/partidas');
        return await response.json();
      }
      return new Promise(resolve => setTimeout(() => resolve([...MOCK_DB.partidas]), DB_DELAY));
    },
    assignGoleiro: async (partidaId: number, goleiroId: number): Promise<void> => {
      if (USE_REAL_API) {
        await fetch(`/api/partidas/${partidaId}/assign`, {
          method: 'POST',
          body: JSON.stringify({ goleiroId }),
          headers: { 'Content-Type': 'application/json' }
        });
        return;
      }
      return new Promise(resolve => {
        setTimeout(() => {
          MOCK_DB.partidas = MOCK_DB.partidas.map(p => 
            p.id === partidaId ? { ...p, idgoleiro: goleiroId, status: 'confirmado' } : p
          );
          resolve();
        }, DB_DELAY);
      });
    }
  }
};

// --- Componentes SVG Icons ---
const Icons = {
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Calendar: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Activity: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  CheckCircle: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  XCircle: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  Refresh: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  MessageSquare: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Sparkles: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
  Database: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s 9-1.34 9-3V5"/></svg>,
  Loader: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
  Server: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
};

// --- Aplicação ---

function App() {
  const [view, setView] = useState<'dashboard' | 'goleiros' | 'partidas'>('dashboard');
  
  // Data States
  const [goleiros, setGoleiros] = useState<Goleiro[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Estados para Modal de Troca
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [selectedPartidaForSwap, setSelectedPartidaForSwap] = useState<Partida | null>(null);
  const [selectedNewGoleiroId, setSelectedNewGoleiroId] = useState<string>("");

  // Estados para Modal de IA
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiGeneratedText, setAiGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Initial Data Fetch ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [goleirosData, partidasData] = await Promise.all([
        DbService.goleiros.list(),
        DbService.partidas.list()
      ]);
      setGoleiros(goleirosData);
      setPartidas(partidasData);
    } catch (error) {
      console.error("Erro ao conectar com DB:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Actions ---

  const toggleGoleiroStatus = async (id: number) => {
    setIsUpdating(true);
    await DbService.goleiros.toggleStatus(id);
    // Refresh local state otimista ou re-fetch
    setGoleiros(prev => prev.map(g => g.id === id ? { ...g, status: !g.status } : g));
    setIsUpdating(false);
  };

  const openSwapModal = (partida: Partida) => {
    setSelectedPartidaForSwap(partida);
    setSelectedNewGoleiroId("");
    setIsSwapModalOpen(true);
  };

  const confirmSwap = async () => {
    if (selectedPartidaForSwap && selectedNewGoleiroId) {
      setIsUpdating(true);
      await DbService.partidas.assignGoleiro(selectedPartidaForSwap.id, parseInt(selectedNewGoleiroId));
      
      // Update local
      setPartidas(prev => prev.map(p => 
        p.id === selectedPartidaForSwap.id ? { ...p, idgoleiro: parseInt(selectedNewGoleiroId), status: 'confirmado' } : p
      ));
      
      setIsSwapModalOpen(false);
      setIsUpdating(false);
    }
  };

  const generateAIMessage = async (partida: Partida) => {
    setIsAIModalOpen(true);
    setIsGenerating(true);
    setAiGeneratedText("");

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        setAiGeneratedText("⚠️ Configure a API Key do Gemini no botão 'API Key' no canto inferior.");
        setIsGenerating(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const goleiro = goleiros.find(g => g.id === partida.idgoleiro);
      const nomeGoleiro = goleiro ? goleiro.nomecompleto : "Goleiro";

      const prompt = `
        Aja como um gerente de um aplicativo de aluguel de goleiros chamado "Goleiro Manager".
        Escreva uma mensagem curta, profissional e motivadora para WhatsApp.
        Destinatário: Goleiro ${nomeGoleiro}.
        Assunto: Confirmação de Partida.
        Detalhes:
        - Data: ${partida.data} às ${partida.hora}
        - Local: ${partida.endereco}
        - Tipo: ${partida.tipocampo}
        - Contratante: ${partida.contratante}
        
        A mensagem deve confirmar a escalação dele e pedir que chegue 15 minutos antes. Use emojis de futebol.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setAiGeneratedText(response.text || "Sem resposta.");
    } catch (error) {
      console.error(error);
      setAiGeneratedText("Erro ao gerar mensagem. Verifique sua conexão.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Views ---

  const renderSidebar = () => (
    <div className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen fixed left-0 top-0 shadow-xl z-20">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="text-green-400">⚽</span> Goleiro<span className="font-light">Mgr</span>
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <button 
          onClick={() => setView('dashboard')} 
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'dashboard' ? 'bg-green-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
        >
          <Icons.Activity /> Dashboard
        </button>
        <button 
          onClick={() => setView('goleiros')} 
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'goleiros' ? 'bg-green-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
        >
          <Icons.Users /> Meus Goleiros
        </button>
        <button 
          onClick={() => setView('partidas')} 
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'partidas' ? 'bg-green-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
        >
          <Icons.Calendar /> Partidas
        </button>
      </nav>
      
      {/* DB Connection Status Widget */}
      <div className="p-4 mx-4 mb-4 bg-slate-800 rounded-lg border border-slate-700 shadow-inner">
         <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wide">
            {USE_REAL_API ? (
               <span className="text-green-400 flex items-center gap-1"><Icons.Server /> Conectado (API)</span>
            ) : (
               <span className="text-yellow-400 flex items-center gap-1"><Icons.Database /> Modo Mock (Demo)</span>
            )}
         </div>
         <p className="text-[10px] text-slate-400 leading-tight">
            {USE_REAL_API 
              ? "Conectado via API Backend." 
              : "Usando dados simulados. Para conectar ao banco real, configure o Vercel Backend."}
         </p>
      </div>

      <div className="p-6 text-xs text-slate-500 text-center border-t border-slate-800">
        v1.2.0 - Vercel Ready
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[400px] text-slate-400 animate-pulse">
      <Icons.Loader />
      <p className="mt-4 text-sm font-medium text-slate-500">
        {USE_REAL_API ? "Conectando ao banco de dados..." : "Carregando ambiente de demonstração..."}
      </p>
    </div>
  );

  const renderDashboard = () => {
    if (isLoading) return renderLoading();

    const totalPartidas = partidas.length;
    const confirmadas = partidas.filter(p => p.status === 'confirmado').length;
    const ativos = goleiros.filter(g => g.status).length;
    const receitas = confirmadas * 80;

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <p className="text-slate-500 text-sm font-medium">Jogos no Mês</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-2">{totalPartidas}</h3>
            <div className="mt-2 text-xs text-green-600 font-medium">+12% vs mês anterior</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <p className="text-slate-500 text-sm font-medium">Confirmados</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-2">{confirmadas}</h3>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <p className="text-slate-500 text-sm font-medium">Goleiros Ativos</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-2">{ativos}</h3>
            <div className="mt-2 text-xs text-slate-400">Total cadastrados: {goleiros.length}</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <p className="text-slate-500 text-sm font-medium">Receita Estimada</p>
            <h3 className="text-3xl font-bold text-green-600 mt-2">R$ {receitas}</h3>
          </div>
        </div>

        {/* Charts Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4">Solicitações por Semana</h3>
            <div className="h-48 flex items-end justify-between gap-2">
              {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                <div key={i} className="w-full bg-green-100 rounded-t-sm hover:bg-green-200 transition-colors relative group">
                   <div style={{height: `${h}%`}} className="absolute bottom-0 w-full bg-green-500 rounded-t-sm"></div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sab</span><span>Dom</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <h3 className="font-semibold text-slate-700 mb-4">Últimas Atividades</h3>
             <ul className="space-y-4">
                {partidas.slice(0, 3).map(p => (
                  <li key={p.id} className="flex items-center gap-3 pb-3 border-b border-slate-50 last:border-0">
                    <div className={`w-2 h-2 rounded-full ${p.status === 'confirmado' ? 'bg-green-500' : p.status === 'pendente' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">{p.contratante} solicitou goleiro</p>
                      <p className="text-xs text-slate-400">{p.data} - {p.endereco}</p>
                    </div>
                    <span className="text-xs font-semibold bg-slate-100 px-2 py-1 rounded text-slate-600">{p.status}</span>
                  </li>
                ))}
             </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderGoleiros = () => {
    if (isLoading) return renderLoading();

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Goleiros Cadastrados</h2>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2">
            <Icons.Users /> Novo Goleiro
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Perfil</th>
                <th className="p-4 font-semibold">Contato</th>
                <th className="p-4 font-semibold">Local & Campo</th>
                <th className="p-4 font-semibold">Avaliação</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {goleiros.map(g => (
                <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <img src={g.fotoperfil} alt={g.nomecompleto} className="w-10 h-10 rounded-full bg-slate-200 border border-slate-200" />
                    <span className="font-medium text-slate-700">{g.nomecompleto}</span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{g.whatsapp}</td>
                  <td className="p-4 text-sm">
                    <div className="text-slate-700 font-medium">{g.cidade}</div>
                    <div className="text-xs text-slate-400">{g.tipo_campo}</div>
                  </td>
                  <td className="p-4">
                    <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded text-xs font-bold">★ {g.rating}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${g.status ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {g.status ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => toggleGoleiroStatus(g.id)}
                      disabled={isUpdating}
                      className={`text-xs px-3 py-1.5 rounded-md border transition-colors disabled:opacity-50 ${g.status ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                    >
                      {g.status ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPartidas = () => {
    if (isLoading) return renderLoading();

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-2xl font-bold text-slate-800">Gestão de Partidas</h2>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Data/Hora</th>
                <th className="p-4 font-semibold">Local</th>
                <th className="p-4 font-semibold">Contratante</th>
                <th className="p-4 font-semibold">Goleiro Escalar</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {partidas.map(p => {
                const goleiroAtual = goleiros.find(g => g.id === p.idgoleiro);
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-700">
                      <div>{new Date(p.data).toLocaleDateString('pt-BR')}</div>
                      <div className="text-slate-400 font-normal">{p.hora}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      <div>{p.endereco}</div>
                      <div className="text-xs text-slate-400">{p.tipocampo}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-700">{p.contratante}</td>
                    <td className="p-4 text-sm">
                      {goleiroAtual ? (
                        <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 w-max">
                           <img src={goleiroAtual.fotoperfil} className="w-6 h-6 rounded-full" />
                           {goleiroAtual.nomecompleto}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">-- Aguardando --</span>
                      )}
                    </td>
                    <td className="p-4">
                       <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border
                          ${p.status === 'confirmado' ? 'bg-green-50 text-green-700 border-green-200' : 
                            p.status === 'pendente' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {p.status === 'confirmado' && <Icons.CheckCircle />}
                          {p.status === 'pendente' && <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>}
                          {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                       </span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      {p.idgoleiro && (
                         <button 
                           title="Gerar Mensagem IA"
                           onClick={() => generateAIMessage(p)}
                           className="p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-100"
                         >
                           <Icons.Sparkles />
                         </button>
                      )}
                      <button 
                        title="Trocar Goleiro"
                        onClick={() => openSwapModal(p)}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                      >
                        <Icons.Refresh />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {renderSidebar()}
      
      <main className="ml-64 flex-1 p-8">
        {/* Global Update Indicator */}
        {isUpdating && (
           <div className="fixed top-4 right-4 bg-slate-800 text-white text-xs px-3 py-2 rounded-full shadow-lg z-50 flex items-center gap-2 animate-pulse">
             <div className="w-2 h-2 bg-green-500 rounded-full"></div>
             Sincronizando...
           </div>
        )}

        {view === 'dashboard' && renderDashboard()}
        {view === 'goleiros' && renderGoleiros()}
        {view === 'partidas' && renderPartidas()}
      </main>

      {/* Modal de Troca de Goleiro */}
      {isSwapModalOpen && selectedPartidaForSwap && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Trocar Goleiro</h3>
            <p className="text-sm text-slate-600 mb-4">Selecione um goleiro ativo para a partida de <strong>{selectedPartidaForSwap.contratante}</strong>.</p>
            
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Novo Goleiro</label>
              <select 
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white"
                value={selectedNewGoleiroId}
                onChange={(e) => setSelectedNewGoleiroId(e.target.value)}
              >
                <option value="">Selecione um goleiro disponível...</option>
                {goleiros.filter(g => g.status).map(g => (
                  <option key={g.id} value={g.id}>{g.nomecompleto} ({g.cidade} - {g.tipo_campo})</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => setIsSwapModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm transition-colors font-medium">Cancelar</button>
              <button 
                onClick={confirmSwap} 
                disabled={!selectedNewGoleiroId}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Troca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal da IA */}
      {isAIModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600"><Icons.Sparkles /></div> 
                   Assistente de Mensagens
                </h3>
                <button onClick={() => setIsAIModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors"><Icons.XCircle /></button>
             </div>
             
             <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-h-[150px] mb-4 text-sm text-slate-700 whitespace-pre-wrap relative">
                {isGenerating ? (
                   <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-3">
                      <div className="w-6 h-6 border-2 border-slate-200 border-t-purple-500 rounded-full animate-spin"></div>
                      <span className="text-xs">Escrevendo mensagem personalizada...</span>
                   </div>
                ) : (
                   aiGeneratedText
                )}
             </div>

             <div className="flex justify-end gap-2">
                <button 
                  onClick={() => {navigator.clipboard.writeText(aiGeneratedText); setIsAIModalOpen(false);}} 
                  disabled={isGenerating || !aiGeneratedText || aiGeneratedText.startsWith("Erro")}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                   <Icons.MessageSquare /> Copiar para WhatsApp
                </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);