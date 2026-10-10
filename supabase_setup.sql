-- ==============================================================================
-- VALCHECK - CONFIGURACIÓN INTEGRAL DE SUPABASE (BASE DE DATOS + AUTENTICACIÓN)
-- ==============================================================================
-- INSTRUCCIONES:
-- 1. Entra a tu proyecto en: https://supabase.com/dashboard
-- 2. Ve a: SQL Editor (icono de terminal con SQL en el menú lateral)
-- 3. Haz clic en: "New query"
-- 4. Pega todo este código y haz clic en: "Run" (o Ctrl+Enter)
--
-- RECOMENDACIÓN DE AUTENTICACIÓN:
-- Para permitir que los clientes compren y se registren al instante sin esperar
-- correos de confirmación (y evitar límites de 3 emails por hora en el plan gratuito):
--   Ve a: Authentication -> Providers -> Email
--   Desmarca: "Confirm email"
--   Haz clic en: "Save"
-- ==============================================================================

-- ==============================================================================
-- 1. TABLA Y PERMISOS DE PRODUCTOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.productos (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  precio_usd NUMERIC NOT NULL,
  categoria TEXT NOT NULL,
  imagen TEXT NOT NULL,
  descripcion TEXT,
  stock INTEGER DEFAULT 10,
  destacado BOOLEAN DEFAULT false,
  precio_anterior NUMERIC,
  calificacion NUMERIC DEFAULT 5.0,
  resenas_count INTEGER DEFAULT 12,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE IF EXISTS public.productos 
  ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS precio_anterior NUMERIC,
  ADD COLUMN IF NOT EXISTS calificacion NUMERIC DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS resenas_count INTEGER DEFAULT 12;

ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura publica de productos" ON public.productos;
CREATE POLICY "Permitir lectura publica de productos" 
ON public.productos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir gestion de productos" ON public.productos;
CREATE POLICY "Permitir gestion de productos" 
ON public.productos FOR ALL USING (true) WITH CHECK (true);


-- ==============================================================================
-- 2. TABLA Y PERMISOS DE PEDIDOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.pedidos (
  id TEXT PRIMARY KEY,
  user_id UUID,
  cliente_nombre TEXT,
  cliente_telefono TEXT,
  cliente_email TEXT,
  cliente_cedula TEXT,
  direccion_entrega TEXT,
  empresa_envio TEXT,
  numero_guia TEXT,
  metodo_pago TEXT,
  referencia_pago TEXT,
  comprobante_url TEXT,
  total_usd NUMERIC DEFAULT 0,
  estado TEXT DEFAULT 'pendiente',
  items JSONB DEFAULT '[]'::jsonb,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE IF EXISTS public.pedidos 
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cliente_nombre TEXT,
  ADD COLUMN IF NOT EXISTS cliente_telefono TEXT,
  ADD COLUMN IF NOT EXISTS cliente_email TEXT,
  ADD COLUMN IF NOT EXISTS cliente_cedula TEXT,
  ADD COLUMN IF NOT EXISTS direccion_entrega TEXT,
  ADD COLUMN IF NOT EXISTS notas TEXT;

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de pedidos" ON public.pedidos;
CREATE POLICY "Permitir lectura de pedidos" 
ON public.pedidos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion de pedidos" ON public.pedidos;
CREATE POLICY "Permitir insercion de pedidos" 
ON public.pedidos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizacion de pedidos" ON public.pedidos;
CREATE POLICY "Permitir actualizacion de pedidos" 
ON public.pedidos FOR UPDATE USING (true) WITH CHECK (true);


-- ==============================================================================
-- 3. TABLA DE PERFILES (SINCRONIZACIÓN AUTOMÁTICA CON SUPABASE AUTH)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'cliente',
  telefono TEXT,
  cedula TEXT,
  direccion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura de perfiles
DROP POLICY IF EXISTS "Permitir lectura de perfiles" ON public.profiles;
CREATE POLICY "Permitir lectura de perfiles" 
ON public.profiles FOR SELECT USING (true);

-- Políticas de inserción y actualización
DROP POLICY IF EXISTS "Permitir insercion de perfiles" ON public.profiles;
CREATE POLICY "Permitir insercion de perfiles" 
ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizacion de perfiles" ON public.profiles;
CREATE POLICY "Permitir actualizacion de perfiles" 
ON public.profiles FOR UPDATE USING (true) WITH CHECK (true);

-- Función y trigger para sincronizar cada nuevo usuario de auth.users con public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, email, rol, telefono, cedula, direccion)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.email,
    CASE 
      WHEN LOWER(NEW.email) = 'omarapp1921@gmail.com' THEN 'admin' 
      ELSE 'cliente' 
    END,
    COALESCE(NEW.raw_user_meta_data->>'telefono', ''),
    COALESCE(NEW.raw_user_meta_data->>'cedula', ''),
    COALESCE(NEW.raw_user_meta_data->>'direccionSugerida', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    email = EXCLUDED.email,
    rol = CASE 
      WHEN LOWER(EXCLUDED.email) = 'omarapp1921@gmail.com' THEN 'admin' 
      ELSE 'cliente' 
    END,
    telefono = COALESCE(EXCLUDED.telefono, profiles.telefono),
    cedula = COALESCE(EXCLUDED.cedula, profiles.cedula),
    direccion = COALESCE(EXCLUDED.direccion, profiles.direccion),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Actualizar perfiles existentes para garantizar que solo omarapp1921@gmail.com sea admin
UPDATE public.profiles
SET rol = CASE 
  WHEN LOWER(email) = 'omarapp1921@gmail.com' THEN 'admin' 
  ELSE 'cliente' 
END;


-- ==============================================================================
-- 4. LIMPIEZA DE PRODUCTOS DE DEMOSTRACIÓN GENÉRICOS (SI EXISTÍAN)
-- ==============================================================================
DELETE FROM public.productos WHERE id IN ('prod-1', 'prod-2', 'prod-3', 'prod-4');

