-- Criação da tabela de produtos
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL,
    image TEXT, -- Armazena a string Base64 ou URL
    novidade BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Política para permitir que qualquer pessoa leia os produtos
CREATE POLICY "Permitir leitura pública" ON public.products
    FOR SELECT USING (true);

-- Política para permitir inserção/edição/deleção (Simplificado para este projeto)
-- NOTA: Em produção, o ideal seria autenticação, mas para este caso de uso rápido:
CREATE POLICY "Permitir tudo para todos" ON public.products
    FOR ALL USING (true);
