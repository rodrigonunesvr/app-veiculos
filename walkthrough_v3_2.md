# Guia de Hotfix v3.2 - Produção Final 🚀

Esta versão corrige todos os problemas de roteamento, relatórios e fluxo de viaturas.

## 1. Banco de Dados (Obrigatório)

1.  Rode o script **`app-veiculos/schema_v3_2.sql`** no Supabase.
    *   Isso cria a view `movements_report` (essencial para o Admin funcionar) e corrige o tamanho do campo RG.

## 2. Configurações da Vercel

1.  O arquivo `vercel.json` foi incluído para corrigir o erro "404 Not Found" ao recarregar páginas.
2.  Garanta que as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estejam corretas no painel da Vercel.

## 3. Principais Mudanças

*   **Viaturas (VTR)**: Agora é possível selecionar **várias viaturas** de uma vez na Entrada e na Saída (estilo checkbox).
*   **Logout**: Botão "Sair" adicionado no cabeçalho.
*   **Admin**: Relatório agora usa uma View otimizada, evitando erros de carregamento.
*   **Roteamento**: Otimizado para não mostrar tela branca se o login expirar.

## 4. Como atualizar

1.  Substitua todos os arquivos do seu repositório pelos arquivos deste ZIP.
2.  Faça o commit e push.
3.  A Vercel fará o deploy automaticamente.
