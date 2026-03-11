import http.client
import json

project_ref = "vnyplgxevpqegvhykwlj"
token = "sbp_9cb3069a3601ac183118513ed68481d9741d571a"

# Script completo para garantir que a tabela e políticas existam
sql_content = """
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL,
    image TEXT, 
    novidade BOOLEAN DEFAULT false,
    is_starting_price BOOLEAN DEFAULT false,
    is_esgotado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura pública" ON public.products;
CREATE POLICY "Permitir leitura pública" ON public.products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir tudo para todos" ON public.products;
CREATE POLICY "Permitir tudo para todos" ON public.products
    FOR ALL USING (true);
"""

conn = http.client.HTTPSConnection("api.supabase.com")
payload = json.dumps({
    "query": sql_content
})
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# Usando o endpoint que funcionou (retornou erro de SQL mas a rota estava correta)
conn.request("POST", f"/v1/projects/{project_ref}/database/query", payload, headers)
res = conn.getresponse()
data = res.read()
print(f"Status: {res.status}")
print(data.decode("utf-8"))
