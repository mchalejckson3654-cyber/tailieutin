-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    cover_url TEXT NOT NULL,
    file_url TEXT NOT NULL,
    views BIGINT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access to documents"
ON public.documents
FOR SELECT
TO public
USING (true);

-- Create policy to allow public insert
CREATE POLICY "Allow public insert to documents"
ON public.documents
FOR INSERT
TO public
WITH CHECK (true);

-- Create a function to securely increment the view count
CREATE OR REPLACE FUNCTION increment_view_count(doc_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.documents
  SET views = views + 1
  WHERE id = doc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert mock data
INSERT INTO public.documents (title, category, cover_url, file_url, views) VALUES
('C++ Masterclass: Từ cơ bản đến chuyên sâu', 'C++', 'https://placehold.co/400x550/0F172A/E63946?text=C%2B%2B\nMaster&font=Source+Code+Pro', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 150),
('Cấu trúc dữ liệu và Giải thuật (DSA)', 'Thuật toán', 'https://placehold.co/400x550/0F172A/38BDF8?text=DSA\nCore&font=Source+Code+Pro', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 342),
('React 18 & Tailwind CSS Thực Chiến', 'Frontend', 'https://placehold.co/400x550/0F172A/61DAFB?text=React\nUI/UX&font=Source+Code+Pro', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 521),
('Machine Learning với Python cơ bản', 'AI/ML', 'https://placehold.co/400x550/0F172A/FACC15?text=Python\nAI&font=Source+Code+Pro', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 87);
