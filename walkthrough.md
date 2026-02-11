# Guia de Deploy - Controle de Veículos (PWA)

## 1. Supabase (Backend Gratuito)

1.  Crie um projeto em [supabase.com](https://supabase.com).
2.  Vá em **SQL Editor** e rode o script [schema.sql](./schema.sql).
3.  Vá em **Project Settings > API** e copie:
    *   Project URL
    *   anon public key

## 2. Configurar Autenticação
1.  No Supabase, vá em **Authentication > Providers** e habilite **Email**.
2.  Vá em **Users** e crie o primeiro usuário (será Admin).
3.  No Banco de Dados (Table Editor), vá na tabela `profiles` e edite a role desse usuário para `admin`.

## 3. Rodar Localmente
```bash
cd app-veiculos
npm install
# Crie um arquivo .env.local com:
# VITE_SUPABASE_URL=sua_url
# VITE_SUPABASE_ANON_KEY=sua_key
npm run dev
```

## 4. Deploy (Vercel ou Netlify) - Grátis

**Opção A: Netlify Drop (Mais fácil)**
1.  Rode `npm run build` na pasta `app-veiculos`.
2.  Arraste a pasta `dist` gerada para o site [app.netlify.com/drop](https://app.netlify.com/drop).
3.  O site estará no ar!
4.  **IMPORTANTE**: Como o Netlify Drop não gerencia `.env` facilmente, você pode precisar editar o `supabase.js` temporariamente com as chaves (não recomendado) ou usar o CLI / Github.

**Opção B: Vercel/Netlify via GitHub (Recomendado)**
1.  Suba o código para o GitHub.
2.  Conecte no Vercel/Netlify.
3.  Nas configurações do projeto, adicione as variáveis de ambiente:
    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_ANON_KEY`
4.  Deploy!

## 5. Instalar no Android
1.  Acesse o link gerado no Chrome do celular.
2.  Toque em "Adicionar à Tela Inicial" ou "Instalar App".
3.  O ícone aparecerá como um aplicativo nativo.
