CREATE TABLE IF NOT EXISTS editions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  number TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  cover_page_index INTEGER NOT NULL DEFAULT 0,
  page_count INTEGER NOT NULL DEFAULT 0,
  pdf_path TEXT NOT NULL,
  pdf_original_name TEXT NOT NULL DEFAULT '',
  pdf_size BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cover_image_url TEXT
);

CREATE TABLE IF NOT EXISTS sponsors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  image_path TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mural_artists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  testimonial TEXT NOT NULL,
  artistic_segment TEXT NOT NULL DEFAULT '',
  image_path TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  image_alt TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);
