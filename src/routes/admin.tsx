import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Edit3,
  ExternalLink,
  Feather,
  MessageSquareText,
  ImageIcon,
  LayoutDashboard,
  Loader2,
  LogOut,
  Plus,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getPdfPageCount } from "@/lib/pdf";
import {
  deleteEdition,
  deleteMuralArtist,
  deleteMuralArtistImage,
  deleteSponsor,
  getEditions,
  getMuralArtists,
  getSponsors,
  isAuthed,
  onAuthChange,
  saveEdition,
  saveMuralArtist,
  saveSponsor,
  signIn,
  signOut,
  uid,
  updateEdition,
  updateMuralArtist,
  updateSponsor,
  uploadEditionCoverImage,
  uploadEditionPdf,
  uploadMuralArtistImage,
  uploadSponsorImage,
  type Edition,
  type MuralArtist,
  type MuralStatus,
  type Sponsor,
} from "@/lib/store";
import "sweetalert2/dist/sweetalert2.min.css";

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
  const [muralArtists, setMuralArtists] = useState<MuralArtist[]>([]);
  const [activePanel, setActivePanel] = useState<"overview" | "editions" | "sponsors" | "mural">(
    "overview",
  );
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [editionRows, sponsorRows, muralRows] = await Promise.all([
        getEditions(),
        getSponsors(),
        getMuralArtists(),
      ]);
      setEditions(editionRows);
      setSponsors(sponsorRows);
      setMuralArtists(muralRows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
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

      {loading && <div className="text-sm text-muted-foreground">Carregando dados...</div>}

      <div className="rounded-xl border border-primary/25 bg-primary/10 p-5 text-sm leading-7 text-ink">
        <p className="font-semibold text-primary">Modo JSON ativo</p>
        <p>
          O site não usa mais Supabase para o conteúdo público. Para publicar ou editar edições,
          patrocinadores e mural, altere os arquivos em <strong>src/data</strong> e faça um novo
          deploy. Os botões de cadastro continuam visíveis apenas como referência do fluxo anterior.
        </p>
      </div>

      <DashboardStats editions={editions} sponsors={sponsors} muralArtists={muralArtists} />

      <div className="flex flex-wrap gap-2 rounded-xl border border-ink/15 bg-card p-2 paper-shadow">
        <PanelButton
          active={activePanel === "overview"}
          icon={<LayoutDashboard className="h-4 w-4" />}
          label="Visão geral"
          onClick={() => setActivePanel("overview")}
        />
        <PanelButton
          active={activePanel === "editions"}
          icon={<BookOpen className="h-4 w-4" />}
          label="Gerenciar edições"
          onClick={() => setActivePanel("editions")}
        />
        <PanelButton
          active={activePanel === "sponsors"}
          icon={<Users className="h-4 w-4" />}
          label="Gerenciar patrocinadores"
          onClick={() => setActivePanel("sponsors")}
        />
        <PanelButton
          active={activePanel === "mural"}
          icon={<MessageSquareText className="h-4 w-4" />}
          label="Mural de Artistas"
          onClick={() => setActivePanel("mural")}
        />
      </div>

      {activePanel === "overview" && (
        <DashboardOverview
          editions={editions}
          sponsors={sponsors}
          muralArtists={muralArtists}
          onManageEditions={() => setActivePanel("editions")}
          onManageSponsors={() => setActivePanel("sponsors")}
          onManageMural={() => setActivePanel("mural")}
        />
      )}

      {activePanel === "editions" && <EditionsSection editions={editions} onChange={load} />}

      {activePanel === "sponsors" && <SponsorsSection sponsors={sponsors} onChange={load} />}

      {activePanel === "mural" && <MuralAdminSection artists={muralArtists} onChange={load} />}
    </div>
  );
}

function DashboardStats({
  editions,
  sponsors,
  muralArtists,
}: {
  editions: Edition[];
  sponsors: Sponsor[];
  muralArtists: MuralArtist[];
}) {
  const activeSponsors = sponsors.filter((s) => s.active).length;
  const publishedMural = muralArtists.filter(
    (item) => item.status === "published" && item.active,
  ).length;
  const latestEdition = editions[0];
  const totalPages = editions.reduce((sum, edition) => sum + edition.pageCount, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={<BookOpen className="h-5 w-5" />}
        label="Edições publicadas"
        value={String(editions.length)}
        detail={`${totalPages} páginas no acervo`}
      />
      <StatCard
        icon={<CalendarDays className="h-5 w-5" />}
        label="Última edição"
        value={latestEdition ? `Nº ${latestEdition.number}` : "-"}
        detail={latestEdition ? latestEdition.title : "Nenhuma edição publicada"}
      />
      <StatCard
        icon={<Users className="h-5 w-5" />}
        label="Patrocinadores ativos"
        value={String(activeSponsors)}
        detail={`${sponsors.length} cadastrados no total`}
      />
      <StatCard
        icon={<BarChart3 className="h-5 w-5" />}
        label="Mural publicado"
        value={String(publishedMural)}
        detail={`${muralArtists.length} depoimentos cadastrados`}
      />
    </div>
  );
}

function DashboardOverview({
  editions,
  sponsors,
  muralArtists,
  onManageEditions,
  onManageSponsors,
  onManageMural,
}: {
  editions: Edition[];
  sponsors: Sponsor[];
  muralArtists: MuralArtist[];
  onManageEditions: () => void;
  onManageSponsors: () => void;
  onManageMural: () => void;
}) {
  const recentEditions = editions.slice(0, 4);
  const recentSponsors = sponsors.slice(-4).reverse();
  const recentMural = muralArtists.slice(0, 3);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <section className="rounded-xl border border-ink/15 bg-card paper-shadow p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Acervo</p>
            <h2 className="text-serif text-2xl font-black text-ink">Edições recentes</h2>
          </div>
          <button
            type="button"
            onClick={onManageEditions}
            className="inline-flex items-center gap-2 rounded-md border border-ink/20 px-3 py-2 text-xs font-semibold text-ink transition hover:bg-ink hover:text-paper"
          >
            <Plus className="h-4 w-4" /> Nova edição
          </button>
        </div>

        <ul className="mt-5 space-y-3">
          {recentEditions.length === 0 && (
            <li className="rounded-md border border-dashed border-ink/20 bg-paper p-4 text-sm text-muted-foreground">
              Nenhuma edição publicada ainda.
            </li>
          )}
          {recentEditions.map((edition) => (
            <li
              key={edition.id}
              className="flex items-center justify-between gap-3 rounded-md border border-ink/10 bg-paper px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-semibold text-ink truncate">
                  Nº {edition.number} - {edition.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(edition.publishedAt).toLocaleDateString("pt-BR")} · {edition.pageCount}{" "}
                  pág.
                </p>
              </div>
              <BookOpen className="h-4 w-4 shrink-0 text-primary" />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-ink/15 bg-card paper-shadow p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Apoio</p>
            <h2 className="text-serif text-2xl font-black text-ink">Patrocinadores</h2>
          </div>
          <button
            type="button"
            onClick={onManageSponsors}
            className="inline-flex items-center gap-2 rounded-md border border-ink/20 px-3 py-2 text-xs font-semibold text-ink transition hover:bg-ink hover:text-paper"
          >
            <ImageIcon className="h-4 w-4" /> Gerenciar
          </button>
        </div>

        <ul className="mt-5 space-y-3">
          {recentSponsors.length === 0 && (
            <li className="rounded-md border border-dashed border-ink/20 bg-paper p-4 text-sm text-muted-foreground">
              Nenhum patrocinador cadastrado.
            </li>
          )}
          {recentSponsors.map((sponsor) => (
            <li
              key={sponsor.id}
              className="flex items-center justify-between gap-3 rounded-md border border-ink/10 bg-paper px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-semibold text-ink truncate">{sponsor.name}</p>
                <p className="text-xs text-muted-foreground">
                  {sponsor.active ? "Visível no site" : "Inativo"}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                  sponsor.active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {sponsor.active ? "Ativo" : "Inativo"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-ink/15 bg-card paper-shadow p-6 lg:col-span-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Mural</p>
            <h2 className="text-serif text-2xl font-black text-ink">Mural de Artistas</h2>
          </div>
          <button
            type="button"
            onClick={onManageMural}
            className="inline-flex items-center gap-2 rounded-md border border-ink/20 px-3 py-2 text-xs font-semibold text-ink transition hover:bg-ink hover:text-paper"
          >
            <MessageSquareText className="h-4 w-4" /> Gerenciar
          </button>
        </div>

        <ul className="mt-5 grid gap-3 md:grid-cols-3">
          {recentMural.length === 0 && (
            <li className="rounded-md border border-dashed border-ink/20 bg-paper p-4 text-sm text-muted-foreground md:col-span-3">
              Nenhum depoimento cadastrado.
            </li>
          )}
          {recentMural.map((item) => (
            <li key={item.id} className="rounded-md border border-ink/10 bg-paper px-4 py-3">
              <p className="font-semibold text-ink truncate">{item.name}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.testimonial}</p>
              <span className="mt-3 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                {item.status === "published" ? "Publicado" : "Rascunho"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <section className="rounded-xl border border-ink/15 bg-card p-5 paper-shadow">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-black text-ink">{value}</p>
      <p className="mt-1 truncate text-sm text-muted-foreground">{detail}</p>
    </section>
  );
}

function PanelButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition sm:flex-none ${
        active
          ? "bg-ink text-paper paper-shadow"
          : "text-muted-foreground hover:bg-paper hover:text-ink"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function EditionsSection({
  editions,
  onChange,
}: {
  editions: Edition[];
  onChange: () => Promise<void>;
}) {
  const [pdfMode, setPdfMode] = useState<"upload" | "external">("upload");
  const [title, setTitle] = useState("");
  const [number, setNumber] = useState("");
  const [publishedAt, setPublishedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  const [externalPdfUrl, setExternalPdfUrl] = useState("");
  const [externalPageCount, setExternalPageCount] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [editingEdition, setEditingEdition] = useState<Edition | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editPublishedAt, setEditPublishedAt] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  function cancelEdit() {
    setEditingEdition(null);
    setEditTitle("");
    setEditNumber("");
    setEditPublishedAt("");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!coverFile) return;
    if (pdfMode === "upload" && !file) return;
    if (pdfMode === "external" && !isValidExternalPdfUrl(externalPdfUrl)) {
      void showError("Informe um link externo válido para o PDF.");
      return;
    }
    if (pdfMode === "external" && !isValidPageCount(externalPageCount)) {
      void showError("Informe a quantidade de páginas da edição.");
      return;
    }

    setBusy(true);
    try {
      const id = uid();
      let pdfPath = externalPdfUrl.trim();
      let pdfOriginalName = getExternalPdfName(pdfPath);
      let pdfSize = 0;
      let pageCount = Number(externalPageCount);

      if (pdfMode === "upload") {
        if (!file) return;
        setProgress("Lendo PDF...");
        pageCount = await getPdfPageCount(file);
        setProgress("Enviando PDF...");
        pdfPath = await uploadEditionPdf(id, file);
        pdfOriginalName = file.name;
        pdfSize = file.size;
      }

      setProgress("Enviando capa...");
      await uploadEditionCoverImage(id, coverFile);
      setProgress("Salvando edição...");
      await saveEdition({
        id,
        title: title.trim() || "Sem título",
        number: number.trim() || String(editions.length + 1),
        publishedAt: new Date(publishedAt).toISOString(),
        pdfPath,
        pdfOriginalName,
        pdfSize,
        pageCount,
      });
      setTitle("");
      setNumber("");
      setFile(null);
      setExternalPdfUrl("");
      setExternalPageCount("");
      setCoverFile(null);
      const input = document.getElementById("edition-file") as HTMLInputElement | null;
      if (input) input.value = "";
      const coverInput = document.getElementById("edition-cover") as HTMLInputElement | null;
      if (coverInput) coverInput.value = "";
      await onChange();
    } catch (error) {
      console.error(error);
      void showError("Não foi possível publicar a edição.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingEdition) return;
    setSavingEdit(true);
    try {
      await updateEdition({
        id: editingEdition.id,
        title: editTitle.trim() || "Sem título",
        number: editNumber.trim() || editingEdition.number,
        publishedAt: new Date(editPublishedAt).toISOString(),
      });
      cancelEdit();
      await onChange();
    } catch (error) {
      console.error(error);
      void showError("Não foi possível atualizar a edição.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function promptEditEdition(edition: Edition) {
    const Swal = await getSwal();
    const currentDate = new Date(edition.publishedAt).toISOString().slice(0, 10);
    const result = await Swal.fire({
      title: "Editar edição",
      html: `
        <div class="space-y-3 text-left">
          <label class="block text-xs font-semibold uppercase tracking-wider text-[#6b6257]">
            Título
            <input id="edition-title" class="swal2-input" value="${escapeAttribute(edition.title)}" />
          </label>
          <label class="block text-xs font-semibold uppercase tracking-wider text-[#6b6257]">
            Número
            <input id="edition-number" class="swal2-input" value="${escapeAttribute(edition.number)}" />
          </label>
          <label class="block text-xs font-semibold uppercase tracking-wider text-[#6b6257]">
            Data de publicação
            <input id="edition-date" class="swal2-input" type="date" value="${currentDate}" />
          </label>
        </div>
      `,
      confirmButtonText: "Salvar",
      cancelButtonText: "Cancelar",
      showCancelButton: true,
      confirmButtonColor: "#1f7a4d",
      cancelButtonColor: "#6b6257",
      preConfirm: () => {
        const title = getModalInputValue("edition-title");
        const number = getModalInputValue("edition-number");
        const publishedAt = getModalInputValue("edition-date");
        if (!title || !number || !publishedAt) {
          Swal.showValidationMessage("Preencha título, número e data.");
          return false;
        }
        return { title, number, publishedAt };
      },
    });

    if (!result.isConfirmed || !result.value) return;

    try {
      await updateEdition({
        id: edition.id,
        title: result.value.title,
        number: result.value.number,
        publishedAt: new Date(result.value.publishedAt).toISOString(),
      });
      await onChange();
    } catch (error) {
      console.error(error);
      void showError("Não foi possível atualizar a edição.");
    }
  }

  async function promptUpdateEditionCover(edition: Edition) {
    const Swal = await getSwal();
    const result = await Swal.fire<File>({
      title: "Atualizar capa",
      html: `
        <div class="text-left text-sm text-[#6b6257]">
          <p>Envie a imagem da capa desta edição. Ela será usada nos cards e na prévia do link.</p>
          <p class="mt-2 text-xs">Formatos aceitos: JPG, PNG ou WebP.</p>
        </div>
      `,
      input: "file",
      inputAttributes: {
        accept: "image/png,image/jpeg,image/webp",
        "aria-label": "Imagem da capa",
      },
      confirmButtonText: "Enviar capa",
      cancelButtonText: "Cancelar",
      showCancelButton: true,
      confirmButtonColor: "#1f7a4d",
      cancelButtonColor: "#6b6257",
      preConfirm: (file) => {
        if (!file) {
          Swal.showValidationMessage("Escolha uma imagem para a capa.");
          return false;
        }

        if (!file.type.startsWith("image/")) {
          Swal.showValidationMessage("Envie um arquivo de imagem.");
          return false;
        }

        return file;
      },
    });

    if (!result.isConfirmed || !result.value) return;

    try {
      await uploadEditionCoverImage(edition.id, result.value);
      await onChange();
      await showSuccess("Capa atualizada com sucesso.");
    } catch (error) {
      console.error(error);
      void showError("Não foi possível atualizar a capa.");
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
        <Field label="Origem do PDF">
          <div className="grid gap-2 sm:grid-cols-2">
            <label
              className={`rounded-md border px-4 py-3 text-sm transition ${
                pdfMode === "upload"
                  ? "border-primary bg-primary/10 text-ink"
                  : "border-ink/15 bg-paper text-muted-foreground"
              }`}
            >
              <input
                type="radio"
                name="pdf-mode"
                value="upload"
                checked={pdfMode === "upload"}
                onChange={() => setPdfMode("upload")}
                className="mr-2"
              />
              Enviar PDF para o Supabase
            </label>
            <label
              className={`rounded-md border px-4 py-3 text-sm transition ${
                pdfMode === "external"
                  ? "border-primary bg-primary/10 text-ink"
                  : "border-ink/15 bg-paper text-muted-foreground"
              }`}
            >
              <input
                type="radio"
                name="pdf-mode"
                value="external"
                checked={pdfMode === "external"}
                onChange={() => setPdfMode("external")}
                className="mr-2"
              />
              Usar link externo
            </label>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Para economizar o Supabase, use o link direto do PDF anexado no GitHub Releases.
          </p>
        </Field>

        {pdfMode === "upload" ? (
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
        ) : (
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
            <Field label="Link externo do PDF">
              <input
                type="url"
                value={externalPdfUrl}
                onChange={(e) => setExternalPdfUrl(e.target.value)}
                placeholder="https://github.com/.../releases/download/.../edicao.pdf"
                className="w-full rounded-md border border-input bg-paper px-3 py-2 text-sm"
                required
              />
            </Field>
            <Field label="Páginas">
              <input
                type="number"
                min="1"
                step="1"
                value={externalPageCount}
                onChange={(e) => setExternalPageCount(e.target.value)}
                placeholder="Ex: 24"
                className="w-full rounded-md border border-input bg-paper px-3 py-2 text-sm"
                required
              />
            </Field>
          </div>
        )}
        <Field label="Imagem da capa">
          <input
            id="edition-cover"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-2 file:text-paper file:cursor-pointer"
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Envie a capa em JPG, PNG ou WebP. Ela será usada nos cards e na prévia do link.
          </p>
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
                {new Date(e.publishedAt).toLocaleDateString("pt-BR")} · {e.pageCount} pág. ·{" "}
                {isExternalPdfUrl(e.pdfPath) ? "PDF externo" : "Supabase"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => void promptEditEdition(e)}
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-primary hover:text-primary-foreground transition"
                aria-label="Editar"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => void promptUpdateEditionCover(e)}
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-primary hover:text-primary-foreground transition"
                aria-label="Atualizar capa"
              >
                <ImageIcon className="h-4 w-4" />
              </button>
              <button
                onClick={async () => {
                  if (
                    await confirmAction(
                      "Excluir esta edição?",
                      "Esta ação remove o PDF e não pode ser desfeita.",
                    )
                  ) {
                    await deleteEdition(e);
                    await onChange();
                  }
                }}
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition"
                aria-label="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
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
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
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
        whatsapp: whatsapp.trim(),
        address: address.trim(),
        imagePath,
        active: true,
      });
      setName("");
      setUrl("");
      setWhatsapp("");
      setAddress("");
      setFile(null);
      const input = document.getElementById("sponsor-file") as HTMLInputElement | null;
      if (input) input.value = "";
      await onChange();
    } catch (error) {
      console.error(error);
      void showError("Não foi possível salvar o patrocinador.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(s: Sponsor) {
    await updateSponsor({ ...s, active: !s.active });
    await onChange();
  }

  async function promptEditSponsor(s: Sponsor) {
    const Swal = await getSwal();
    const result = await Swal.fire({
      title: "Editar patrocinador",
      html: `
        <div class="space-y-3 text-left">
          <label class="block text-xs font-semibold uppercase tracking-wider text-[#6b6257]">
            Nome
            <input id="sponsor-name" class="swal2-input" value="${escapeAttribute(s.name)}" />
          </label>
          <label class="block text-xs font-semibold uppercase tracking-wider text-[#6b6257]">
            Site (URL)
            <input id="sponsor-url" class="swal2-input" value="${escapeAttribute(s.url)}" />
          </label>
          <label class="block text-xs font-semibold uppercase tracking-wider text-[#6b6257]">
            WhatsApp
            <input id="sponsor-whatsapp" class="swal2-input" value="${escapeAttribute(s.whatsapp)}" />
          </label>
          <label class="block text-xs font-semibold uppercase tracking-wider text-[#6b6257]">
            Endereço
            <input id="sponsor-address" class="swal2-input" value="${escapeAttribute(s.address)}" />
          </label>
          <label class="mt-2 flex items-center gap-2 text-sm text-[#2f2a22]">
            <input id="sponsor-active" type="checkbox" ${s.active ? "checked" : ""} />
            Ativo no site
          </label>
        </div>
      `,
      confirmButtonText: "Salvar",
      cancelButtonText: "Cancelar",
      showCancelButton: true,
      confirmButtonColor: "#1f7a4d",
      cancelButtonColor: "#6b6257",
      preConfirm: () => {
        const name = getModalInputValue("sponsor-name");
        if (!name) {
          Swal.showValidationMessage("Informe o nome do patrocinador.");
          return false;
        }
        return {
          name,
          url: getModalInputValue("sponsor-url"),
          whatsapp: getModalInputValue("sponsor-whatsapp"),
          address: getModalInputValue("sponsor-address"),
          active: Boolean(
            (document.getElementById("sponsor-active") as HTMLInputElement | null)?.checked,
          ),
        };
      },
    });

    if (!result.isConfirmed || !result.value) return;

    try {
      await updateSponsor({
        ...s,
        name: result.value.name,
        url: result.value.url,
        whatsapp: result.value.whatsapp,
        address: result.value.address,
        active: result.value.active,
      });
      await onChange();
    } catch (error) {
      console.error(error);
      void showError("Não foi possível atualizar o patrocinador.");
    }
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
          <Field label="WhatsApp">
            <input
              type="tel"
              placeholder="(48) 99999-9999"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full rounded-md border border-input bg-paper px-3 py-2 text-sm"
            />
          </Field>
          <Field label="EndereÃ§o">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
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
          <p className="mt-1 text-xs text-muted-foreground">
            Use uma imagem horizontal, de preferência 1200x600px, em PNG ou JPG. O site exibirá
            todos os logos no mesmo tamanho visual, sem cortar a imagem.
          </p>
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
              {s.whatsapp && (
                <p className="text-xs text-muted-foreground truncate">WhatsApp: {s.whatsapp}</p>
              )}
              {s.address && (
                <p className="text-xs text-muted-foreground truncate">EndereÃ§o: {s.address}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
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
                onClick={() => void promptEditSponsor(s)}
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-primary hover:text-primary-foreground transition"
                aria-label="Editar"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={async () => {
                  if (
                    await confirmAction(
                      "Excluir patrocinador?",
                      "Esta ação remove o cadastro e a imagem enviada.",
                    )
                  ) {
                    await deleteSponsor(s);
                    await onChange();
                  }
                }}
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition"
                aria-label="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MuralAdminSection({
  artists,
  onChange,
}: {
  artists: MuralArtist[];
  onChange: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<MuralArtist | null>(null);
  const [name, setName] = useState("");
  const [testimonial, setTestimonial] = useState("");
  const [artisticSegment, setArtisticSegment] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [order, setOrder] = useState("0");
  const [status, setStatus] = useState<MuralStatus>("draft");
  const [active, setActive] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  function resetForm() {
    setEditing(null);
    setName("");
    setTestimonial("");
    setArtisticSegment("");
    setImageAlt("");
    setOrder("0");
    setStatus("draft");
    setActive(true);
    setFile(null);
    setPreviewUrl("");
    const input = document.getElementById("mural-file") as HTMLInputElement | null;
    if (input) input.value = "";
  }

  function startEdit(item: MuralArtist) {
    setEditing(item);
    setName(item.name);
    setTestimonial(item.testimonial);
    setArtisticSegment(item.artisticSegment);
    setImageAlt(item.imageAlt);
    setOrder(String(item.order));
    setStatus(item.status);
    setActive(item.active);
    setFile(null);
    setPreviewUrl(item.imageUrl);
    const input = document.getElementById("mural-file") as HTMLInputElement | null;
    if (input) input.value = "";
  }

  function chooseFile(nextFile: File | null) {
    setFile(nextFile);
    if (!nextFile) {
      setPreviewUrl(editing?.imageUrl ?? "");
      return;
    }
    setPreviewUrl(URL.createObjectURL(nextFile));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();

    if (!editing && !file) {
      void showError("Envie uma foto para o mural.");
      return;
    }

    setBusy(true);
    setProgress(file ? "Enviando imagem..." : "Salvando publicação...");

    let newImagePath = editing?.imagePath ?? "";
    const oldImagePath = editing?.imagePath ?? "";

    try {
      if (file) {
        newImagePath = await uploadMuralArtistImage(file, name);
      }

      const payload: MuralArtist = {
        id: editing?.id ?? uid(),
        name,
        testimonial,
        artisticSegment,
        imagePath: newImagePath,
        imageUrl: editing?.imageUrl ?? "",
        imageAlt: imageAlt || `Foto de ${name}`,
        order: Number.parseInt(order, 10) || 0,
        status,
        active,
        createdAt: editing?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: editing?.publishedAt ?? null,
      };

      setProgress(editing ? "Atualizando registro..." : "Salvando registro...");

      if (editing) {
        await updateMuralArtist(payload);
      } else {
        await saveMuralArtist(payload);
      }

      if (
        editing &&
        file &&
        oldImagePath &&
        oldImagePath !== newImagePath &&
        canDeleteSharedImage(oldImagePath)
      ) {
        await deleteMuralArtistImage(oldImagePath);
      }

      resetForm();
      await onChange();
      await showSuccess(
        editing ? "Publicação atualizada com sucesso." : "Publicação criada com sucesso.",
      );
    } catch (error) {
      console.error(error);
      if (file && newImagePath && newImagePath !== oldImagePath) {
        await deleteMuralArtistImage(newImagePath).catch(() => undefined);
      }
      void showError(
        error instanceof Error ? error.message : "Não foi possível salvar a publicação.",
      );
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  async function removeItem(item: MuralArtist) {
    if (
      !(await confirmAction(
        "Excluir publicação do mural?",
        "Esta ação remove o registro e a imagem enviada.",
      ))
    ) {
      return;
    }

    try {
      await deleteMuralArtist(item.id);
      if (canDeleteSharedImage(item.imagePath)) {
        await deleteMuralArtistImage(item.imagePath);
      }
      await onChange();
      if (editing?.id === item.id) resetForm();
    } catch (error) {
      console.error(error);
      void showError("Não foi possível excluir a publicação.");
    }
  }

  function canDeleteSharedImage(imagePath: string) {
    return Boolean(imagePath) && artists.filter((item) => item.imagePath === imagePath).length <= 1;
  }

  return (
    <section className="rounded-xl border border-ink/15 bg-card paper-shadow p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Mural</p>
          <h2 className="text-serif text-2xl font-black text-ink flex items-center gap-2">
            <MessageSquareText className="h-5 w-5 text-primary" /> Mural de Artistas
          </h2>
        </div>
        {editing && (
          <button
            type="button"
            onClick={resetForm}
            className="rounded-md border border-ink/20 px-3 py-2 text-xs font-semibold text-ink transition hover:bg-ink hover:text-paper"
          >
            Cancelar edição
          </button>
        )}
      </div>

      <form onSubmit={submit} className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome do artista">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-input bg-paper px-3 py-2 text-sm"
                required
              />
            </Field>
            <Field label="Segmento artístico (opcional)">
              <input
                value={artisticSegment}
                onChange={(e) => setArtisticSegment(e.target.value)}
                className="w-full rounded-md border border-input bg-paper px-3 py-2 text-sm"
              />
            </Field>
          </div>

          <Field label="Depoimento">
            <textarea
              value={testimonial}
              onChange={(e) => setTestimonial(e.target.value)}
              className="min-h-32 w-full rounded-md border border-input bg-paper px-3 py-2 text-sm leading-6"
              required
            />
          </Field>

          <Field label="Texto alternativo da imagem">
            <input
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
              placeholder="Ex: Maria Silva segurando o Jornal A Gralha"
              className="w-full rounded-md border border-input bg-paper px-3 py-2 text-sm"
              required
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Ordem">
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="w-full rounded-md border border-input bg-paper px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MuralStatus)}
                className="w-full rounded-md border border-input bg-paper px-3 py-2 text-sm"
              >
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
              </select>
            </Field>
            <Field label="Situação">
              <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-paper px-3 text-sm">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="accent-primary"
                />
                Ativo
              </label>
            </Field>
          </div>

          <Field label={editing ? "Substituir imagem (opcional)" : "Foto do artista"}>
            <input
              id="mural-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => chooseFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-2 file:text-paper file:cursor-pointer"
              required={!editing}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              JPG, PNG ou WebP até 8 MB. O servidor converte para WebP e redimensiona imagens
              grandes.
            </p>
          </Field>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-md bg-gralha-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground paper-shadow hover:brightness-110 transition disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {busy
                ? progress || "Salvando..."
                : editing
                  ? "Salvar alterações"
                  : "Cadastrar publicação"}
            </button>
            {previewUrl && (
              <button
                type="button"
                onClick={() =>
                  void previewMuralItem({
                    name,
                    testimonial,
                    artisticSegment,
                    imageUrl: previewUrl,
                    imageAlt: imageAlt || `Foto de ${name}`,
                  })
                }
                className="inline-flex items-center gap-2 rounded-md border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-ink hover:text-paper"
              >
                <ImageIcon className="h-4 w-4" /> Prévia
              </button>
            )}
          </div>
        </div>

        <aside className="rounded-md border border-ink/10 bg-paper p-3">
          {previewUrl ? (
            <div className="bg-white p-3 pb-5 shadow-md rotate-[-1deg]">
              <img
                src={previewUrl}
                alt={imageAlt || name}
                className="aspect-[4/3] w-full object-cover"
              />
              <p className="mt-3 text-serif text-xl font-black text-ink">
                {name || "Nome do artista"}
              </p>
              <p className="mt-1 line-clamp-4 text-sm text-ink/70">
                {testimonial || "Depoimento do artista..."}
              </p>
            </div>
          ) : (
            <div className="grid aspect-[4/5] place-items-center rounded-md border border-dashed border-ink/20 text-center text-sm text-muted-foreground">
              Pré-visualização da Polaroid
            </div>
          )}
        </aside>
      </form>

      <h3 className="mt-8 mb-3 text-serif text-xl font-bold text-ink">Publicações</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-separate border-spacing-y-2 text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3">Foto</th>
              <th className="px-3">Nome</th>
              <th className="px-3">Depoimento</th>
              <th className="px-3">Segmento</th>
              <th className="px-3">Ordem</th>
              <th className="px-3">Status</th>
              <th className="px-3">Situação</th>
              <th className="px-3">Criado em</th>
              <th className="px-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {artists.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="rounded-md border border-dashed border-ink/20 bg-paper p-4 text-center text-muted-foreground"
                >
                  Nenhuma publicação cadastrada.
                </td>
              </tr>
            )}
            {artists.map((item) => (
              <tr key={item.id} className="bg-paper">
                <td className="rounded-l-md border-y border-l border-ink/10 px-3 py-2">
                  <img
                    src={item.imageUrl}
                    alt={item.imageAlt}
                    className="h-14 w-14 rounded object-cover"
                  />
                </td>
                <td className="border-y border-ink/10 px-3 py-2 font-semibold text-ink">
                  {item.name}
                </td>
                <td className="border-y border-ink/10 px-3 py-2 text-muted-foreground">
                  <span className="line-clamp-2 max-w-xs">{item.testimonial}</span>
                </td>
                <td className="border-y border-ink/10 px-3 py-2 text-muted-foreground">
                  {item.artisticSegment || "-"}
                </td>
                <td className="border-y border-ink/10 px-3 py-2">{item.order}</td>
                <td className="border-y border-ink/10 px-3 py-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                      item.status === "published"
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.status === "published" ? "Publicado" : "Rascunho"}
                  </span>
                </td>
                <td className="border-y border-ink/10 px-3 py-2">
                  {item.active ? "Ativo" : "Inativo"}
                </td>
                <td className="border-y border-ink/10 px-3 py-2 text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                </td>
                <td className="rounded-r-md border-y border-r border-ink/10 px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => void previewMuralItem(item)}
                      className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-primary hover:text-primary-foreground transition"
                      aria-label="Prévia"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-primary hover:text-primary-foreground transition"
                      aria-label="Editar"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeItem(item)}
                      className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

async function previewMuralItem(item: {
  name: string;
  testimonial: string;
  artisticSegment: string;
  imageUrl: string;
  imageAlt: string;
}) {
  const Swal = await getSwal();
  await Swal.fire({
    title: escapeHtml(item.name || "Prévia do mural"),
    html: `
      <div class="space-y-4 text-left">
        <img src="${escapeAttribute(item.imageUrl)}" alt="${escapeAttribute(item.imageAlt)}" class="mx-auto max-h-80 w-full rounded-md object-contain bg-[#f7f0df] p-2" />
        ${item.artisticSegment ? `<p class="text-xs font-semibold uppercase tracking-[0.22em] text-[#1f7a4d]">${escapeHtml(item.artisticSegment)}</p>` : ""}
        <p class="text-base leading-7 text-[#2f2a22]">“${escapeHtml(item.testimonial)}”</p>
      </div>
    `,
    confirmButtonText: "Fechar",
    confirmButtonColor: "#1f7a4d",
    width: "min(94vw, 760px)",
  });
}

async function getSwal() {
  const { default: Swal } = await import("sweetalert2");
  return Swal;
}

async function showError(message: string) {
  const Swal = await getSwal();
  await Swal.fire({
    icon: "error",
    title: "Algo deu errado",
    text: message,
    confirmButtonText: "Fechar",
    confirmButtonColor: "#1f7a4d",
  });
}

async function showSuccess(message: string) {
  const Swal = await getSwal();
  await Swal.fire({
    icon: "success",
    title: "Tudo certo",
    text: message,
    confirmButtonText: "Fechar",
    confirmButtonColor: "#1f7a4d",
  });
}

async function confirmAction(title: string, text: string) {
  const Swal = await getSwal();
  const result = await Swal.fire({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: "Excluir",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#b42318",
    cancelButtonColor: "#6b6257",
  });

  return result.isConfirmed;
}

function getModalInputValue(id: string) {
  return (document.getElementById(id) as HTMLInputElement | null)?.value.trim() ?? "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function isExternalPdfUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isValidExternalPdfUrl(value: string) {
  if (!isExternalPdfUrl(value)) return false;
  return value.trim().toLowerCase().includes(".pdf");
}

function isValidPageCount(value: string) {
  const pageCount = Number(value);
  return Number.isInteger(pageCount) && pageCount > 0;
}

function getExternalPdfName(value: string) {
  try {
    const url = new URL(value);
    const fileName = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() ?? "");
    return fileName || "PDF externo";
  } catch {
    return "PDF externo";
  }
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
