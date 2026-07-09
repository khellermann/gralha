import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Feather,
  ImageIcon,
  Loader2,
  LogOut,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getPdfPageCount } from "@/lib/pdf";
import {
  deleteEdition,
  deleteSponsor,
  getEditions,
  getSponsors,
  isAuthed,
  onAuthChange,
  saveEdition,
  saveSponsor,
  signIn,
  signOut,
  uid,
  updateSponsor,
  uploadEditionPdf,
  uploadSponsorImage,
  type Edition,
  type Sponsor,
} from "@/lib/store";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let alive = true;
    isAuthed()
      .then((value) => {
        if (alive) setAuthed(value);
      })
      .finally(() => {
        if (alive) setCheckingAuth(false);
      });

    const unsubscribe = onAuthChange(setAuthed);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-paper-grain">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10 w-full flex-1">
        {checkingAuth ? (
          <div className="py-20 text-center text-muted-foreground">Verificando acesso...</div>
        ) : authed ? (
          <Dashboard />
        ) : (
          <LoginForm />
        )}
      </main>
      <Footer />
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch {
      setError("Credenciais inválidas.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-md rounded-xl border border-ink/15 bg-card paper-shadow p-8 mt-10"
    >
      <div className="flex items-center gap-3 mb-6">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-gralha-gradient text-primary-foreground">
          <Feather className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-serif text-2xl font-black text-ink">Painel do Editor</h1>
          <p className="text-xs text-muted-foreground">Acesso restrito à redação</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Field label="E-mail">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-input bg-paper px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </Field>
        <Field label="Senha">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-input bg-paper px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-gralha-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground paper-shadow hover:brightness-110 transition disabled:opacity-60"
        >
          {busy ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </motion.div>
  );
}

function Dashboard() {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [editionRows, sponsorRows] = await Promise.all([getEditions(), getSponsors()]);
      setEditions(editionRows);
      setSponsors(sponsorRows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary">Redação</p>
          <h1 className="text-serif text-3xl sm:text-4xl font-black text-ink">Painel do Editor</h1>
        </div>
        <button
          onClick={() => void signOut()}
          className="inline-flex items-center gap-2 rounded-full border border-ink/25 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-ink hover:bg-ink hover:text-paper transition-colors"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>

      {loading && <div className="mb-6 text-sm text-muted-foreground">Carregando dados...</div>}
      <div className="grid gap-10 lg:grid-cols-2">
        <EditionsSection editions={editions} onChange={load} />
        <SponsorsSection sponsors={sponsors} onChange={load} />
      </div>
    </div>
  );
}

function EditionsSection({
  editions,
  onChange,
}: {
  editions: Edition[];
  onChange: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [number, setNumber] = useState("");
  const [publishedAt, setPublishedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      const id = uid();
      setProgress("Lendo PDF...");
      const pageCount = await getPdfPageCount(file);
      setProgress("Enviando PDF...");
      const pdfPath = await uploadEditionPdf(id, file);
      setProgress("Salvando edição...");
      await saveEdition({
        id,
        title: title.trim() || "Sem título",
        number: number.trim() || String(editions.length + 1),
        publishedAt: new Date(publishedAt).toISOString(),
        pdfPath,
        pdfOriginalName: file.name,
        pdfSize: file.size,
        pageCount,
      });
      setTitle("");
      setNumber("");
      setFile(null);
      const input = document.getElementById("edition-file") as HTMLInputElement | null;
      if (input) input.value = "";
      await onChange();
    } catch (error) {
      console.error(error);
      alert("Não foi possível publicar a edição.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  return (
    <section className="rounded-xl border border-ink/15 bg-card paper-shadow p-6">
      <h2 className="text-serif text-2xl font-black text-ink flex items-center gap-2">
        <Plus className="h-5 w-5 text-primary" /> Nova edição
      </h2>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-input bg-paper px-3 py-2 text-sm"
              required
            />
          </Field>
          <Field label="Número">
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Ex: 12"
              className="w-full rounded-md border border-input bg-paper px-3 py-2 text-sm"
              required
            />
          </Field>
        </div>
        <Field label="Data de publicação">
          <input
            type="date"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            className="w-full rounded-md border border-input bg-paper px-3 py-2 text-sm"
            required
          />
        </Field>
        <Field label="Arquivo PDF">
          <input
            id="edition-file"
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-2 file:text-paper file:cursor-pointer"
            required
          />
        </Field>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md bg-gralha-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground paper-shadow hover:brightness-110 transition disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? progress || "Publicando..." : "Publicar edição"}
        </button>
      </form>

      <h3 className="mt-8 mb-3 text-serif text-xl font-bold text-ink">Edições publicadas</h3>
      <ul className="space-y-2">
        {editions.length === 0 && (
          <li className="text-sm text-muted-foreground">Nenhuma edição ainda.</li>
        )}
        {editions.map((e) => (
          <li
            key={e.id}
            className="flex items-center justify-between gap-3 rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm"
          >
            <div className="min-w-0">
              <p className="font-semibold text-ink truncate">
                Nº {e.number} - {e.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(e.publishedAt).toLocaleDateString("pt-BR")} · {e.pageCount} pág.
              </p>
            </div>
            <button
              onClick={async () => {
                if (confirm("Excluir esta edição?")) {
                  await deleteEdition(e);
                  await onChange();
                }
              }}
              className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition"
              aria-label="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SponsorsSection({
  sponsors,
  onChange,
}: {
  sponsors: Sponsor[];
  onChange: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      const id = uid();
      const imagePath = await uploadSponsorImage(id, file);
      await saveSponsor({
        id,
        name: name.trim(),
        url: url.trim(),
        imagePath,
        active: true,
      });
      setName("");
      setUrl("");
      setFile(null);
      const input = document.getElementById("sponsor-file") as HTMLInputElement | null;
      if (input) input.value = "";
      await onChange();
    } catch (error) {
      console.error(error);
      alert("Não foi possível salvar o patrocinador.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(s: Sponsor) {
    await updateSponsor({ ...s, active: !s.active });
    await onChange();
  }

  return (
    <section className="rounded-xl border border-ink/15 bg-card paper-shadow p-6">
      <h2 className="text-serif text-2xl font-black text-ink flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-primary" /> Patrocinadores
      </h2>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-input bg-paper px-3 py-2 text-sm"
              required
            />
          </Field>
          <Field label="Site (URL)">
            <input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-md border border-input bg-paper px-3 py-2 text-sm"
            />
          </Field>
        </div>
        <Field label="Banner (imagem)">
          <input
            id="sponsor-file"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-2 file:text-paper file:cursor-pointer"
            required
          />
        </Field>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md bg-gralha-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground paper-shadow hover:brightness-110 transition disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Adicionar
        </button>
      </form>

      <h3 className="mt-8 mb-3 text-serif text-xl font-bold text-ink">Lista</h3>
      <ul className="space-y-2">
        {sponsors.length === 0 && (
          <li className="text-sm text-muted-foreground">Nenhum patrocinador cadastrado.</li>
        )}
        {sponsors.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-3 rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink truncate">{s.name}</p>
              {s.url && (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  {s.url} <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={s.active}
                onChange={() => void toggleActive(s)}
                className="accent-primary"
              />
              Ativo
            </label>
            <button
              onClick={async () => {
                if (confirm("Excluir patrocinador?")) {
                  await deleteSponsor(s);
                  await onChange();
                }
              }}
              className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition"
              aria-label="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
