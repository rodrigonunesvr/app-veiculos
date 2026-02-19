# App Veículos - Guia Final de Instalação (v4.2) 🚀

Este documento contém os passos definitivos para instalar a versão 4.2 do aplicativo, que corrige todos os erros de build e configuração de administrador.

## 1. Instalação Limpa (Obrigatório)

Para evitar conflitos com versões antigas:
1.  **Apague todas as pastas e arquivos** do diretório do seu projeto.
2.  Baixe e extraia o arquivo **`app-veiculos-v4.2.zip`** na raiz.
3.  Abra o **GitHub Desktop**, faça o Commit ("Versão 4.2 Final") e Push.

Isso garante que o Vercel receba o código limpo, sem cache.

## 2. Configuração do Banco de Dados (Supabase)

Se você criou uma conta nova, rode este Script SQL no **Supabase -> SQL Editor** para corrigir a tabela de perfis e virar Admin:

```sql
-- 1. Garante que a coluna email exista (Correção de Bug)
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'email') then
    alter table public.profiles add column email text;
  end if;
end $$;

-- 2. Cria ou Atualiza seu Usuário ADMIN (Substitua o email abaixo)
insert into public.profiles (id, email, full_name, role, rg5, phone)
select 
  id, 
  email, 
  'Rodrigo Nunes (Admin)', 
  'admin', 
  'ADMIN01',
  '99999-9999' -- Telefone fictício obrigatório
from auth.users
where email = 'rodrigonunes86@yahoo.com.br' -- SEU EMAIL AQUI
on conflict (id) do update
set 
  role = 'admin',
  full_name = 'Rodrigo Nunes (Admin)',
  phone = '99999-9999';
```

## 3. Acessando o App

*   **Login:** Acesse com seu email e senha.
*   **Criar Conta:** Agora existe um link "Criar Conta" na tela de login.
*   **Admin:** O botão "Admin" aparecerá no menu se o passo 2 foi feito com sucesso.

## 4. Solução de Problemas Comuns

*   **Erro de Build (Vercel):** Se der erro, verifique se o nome do projeto no `package.json` é `vehicle-control-pwa-v4`.
*   **Botão Admin não aparece:** Saia (Logout) e entre novamente após rodar o SQL.
*   **Tela Branca:** Limpe o cache do navegador (CTRL+F5).
