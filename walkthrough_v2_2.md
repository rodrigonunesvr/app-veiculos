# Guia de Atualização v2.2 - Auditoria & Acesso Público

Esta versão remove o login obrigatório para operação (Entrada/Saída agora são públicas) e adiciona **Auditoria por Registro** (Nome e RG obrigatórios em cada ação).

## 1. Atualização do Banco de Dados

1.  Acesse seu projeto no **Supabase**.
2.  Vá em **SQL Editor**.
3.  Cole e rode o conteúdo do arquivo `app-veiculos/schema_v2_2.sql`.
    *   *Isso adiciona as colunas de auditoria e libera o acesso público (Anon) para inserção.*

## 2. Deploy do Frontend

1.  Envie o código atualizado para o Vercel/Netlify.
2.  **Atenção**: Agora as páginas de Entrada e Saída não exigem login. Você pode deixar o link aberto em um tablet/celular na portaria.
3.  Apenas a página **Admin** (canto superior direito > Login) exige senha.

## 3. Uso Diário

*   Ao clicar em Entrada/Saída, o militar **DEVE** preencher seu Nome e RG (5 dígitos).
*   Esses dados sairão no **Relatório PDF**.
*   O sistema não "lembra" quem logou (para garantir segurança na troca de turno).

## 4. Segurança

*   Qualquer pessoa com o link pode registrar veículos, mas não pode **apagar** nem **ver histórico completo** (apenas lista atual).
*   Isso atende ao requisito de "sem login de staff", mas mantém controle de quem fez o quê.
