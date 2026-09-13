-- Create folders table
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Cấp quyền truy cập mức CSDL (BẮT BUỘC ĐỂ API KHÔNG BÁO LỖI 404)
GRANT ALL ON TABLE public.folders TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Allow public read access to folders" ON public.folders;
CREATE POLICY "Allow public read access to folders" ON public.folders FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public insert to folders" ON public.folders;
CREATE POLICY "Allow public insert to folders" ON public.folders FOR INSERT TO public WITH CHECK (true);

-- Create documents table (if not exists)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    cover_url TEXT NOT NULL,
    file_url TEXT NOT NULL,
    views BIGINT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add folder_id to documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE;

-- Enable Row Level Security (RLS)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Cấp quyền truy cập mức CSDL (BẮT BUỘC ĐỂ API KHÔNG BÁO LỖI 404)
GRANT ALL ON TABLE public.documents TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Allow public read access to documents" ON public.documents;
CREATE POLICY "Allow public read access to documents" ON public.documents FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public insert to documents" ON public.documents;
CREATE POLICY "Allow public insert to documents" ON public.documents FOR INSERT TO public WITH CHECK (true);

-- Create a function to securely increment the view count
CREATE OR REPLACE FUNCTION increment_view_count(doc_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.documents
  SET views = views + 1
  WHERE id = doc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Setup Storage for local file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('documents_bucket', 'documents_bucket', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public read storage" ON storage.objects;
CREATE POLICY "Allow public read storage" ON storage.objects FOR SELECT TO public USING (bucket_id = 'documents_bucket');

DROP POLICY IF EXISTS "Allow public insert storage" ON storage.objects;
CREATE POLICY "Allow public insert storage" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'documents_bucket');

-- Tự động tạo thư mục "FILE tài liệu cũ" và chuyển tất cả tài liệu cũ vào đó
DO $$
DECLARE
    old_folder_id UUID;
BEGIN
    -- Kiểm tra xem đã có tài liệu nào không có thư mục hay chưa
    IF EXISTS (SELECT 1 FROM public.documents WHERE folder_id IS NULL) THEN
        -- Tạo thư mục
        INSERT INTO public.folders (name) VALUES ('FILE tài liệu cũ') RETURNING id INTO old_folder_id;
        
        -- Chuyển tài liệu
        UPDATE public.documents SET folder_id = old_folder_id WHERE folder_id IS NULL;
    END IF;
END $$;
