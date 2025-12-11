# Guia para Debug e Deploy

## 1. Teste Local com `vercel dev`

```bash
# Instalar Vercel CLI se não tiver
npm i -g vercel

# Fazer login
vercel login

# Rodar em modo dev (simula serverless functions localmente)
vercel dev
```

Acesse `http://localhost:3000` e abra o **Console do DevTools (F12)** para ver os logs:
- `[DB]` — logs da conexão com banco
- `[API]` — logs das requisições para `/api/*`

## 2. Se ainda vir dados mock:

**Confirmar que `VITE_USE_REAL_API=true`:**
- Abra o console (F12) → Network
- Recarregue a página
- Procure por requisição para `/api/goleiros`
- Se não aparecer, então `VITE_USE_REAL_API` está `false`

**Verificar variáveis de ambiente:**
Na Vercel Dashboard → Settings → Environment Variables, confirme que tem:
- ✓ `VITE_USE_REAL_API=true`
- ✓ `DB_HOST=162.241.203.142`
- ✓ `DB_USER=onmitd99_anderson`
- ✓ `DB_PASS=Floripa@2025` (ou sua senha)
- ✓ `DB_NAME=onmitd99_goleiros`

## 3. Deploy final

```bash
# Commit das mudanças
git add -A
git commit -m "Fix: Add VITE_USE_REAL_API to vite.config.ts and improve API logging"

# Push para GitHub (Vercel fará deploy automático)
git push origin main

# Ou force redeploy na Vercel
vercel --prod
```

## 4. Logs de erro esperados

Se houver erro de conexão, procure no console do Vercel:
- "Erro: connect ECONNREFUSED" → banco não está acessível
- "Erro: ER_ACCESS_DENIED" → credenciais erradas
- "Erro: ER_BAD_DB_ERROR" → nome do banco errado

Compartilhe comigo qualquer erro que aparecer no console do navegador ou logs da Vercel!
