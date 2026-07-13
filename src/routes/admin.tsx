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
  updateEdition,
  updateSponsor,
  uploadEditionPdf,
  uploadSponsorImage,
  type Edition,
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
  const [activePanel, setActivePanel] = useState<"overview" | "editions" | "sponsors">("overview");
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

      <DashboardStats editions={editions} sponsors={sponsors} />

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
      </div>

      {activePanel === "overview" && (
        <DashboardOverview
          editions={editions}
          sponsors={sponsors}
          onManageEditions={() => setActivePanel("editions")}
          onManageSponsors={() => setActivePanel("sponsors")}
        />
      )}

      {activePanel === "editions" && <EditionsSection editions={editions} onChange={load} />}

      {activePanel === "sponsors" && <SponsorsSection sponsors={sponsors} onChange={load} />}
    </div>
  );
}

function DashboardStats({ editions, sponsors }: { editions: Edition[]; sponsors: Sponsor[] }) {
  const activeSponsors = sponsors.filter((s) => s.active).length;
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
        label="Status do apoio"
        value={sponsors.length ? `${Math.round((activeSponsors / sponsors.length) * 100)}%` : "0%"}
        detail="Patrocinadores visíveis no site"
      />
    </div>
  );
}

function DashboardOverview({
  editions,
  sponsors,
  onManageEditions,
  onManageSponsors,
}: {
  editions: Edition[];
  sponsors: Sponsor[];
  onManageEditions: () => void;
  onManageSponsors: () => void;
}) {
  const recentEditions = editions.slice(0, 4);
  const recentSponsors = sponsors.slice(-4).reverse();

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
                  {new Date(edition.publishedAt).toLocaleDateString("pt-BR")} ·{" "}
                  {edition.pageCount} pág.
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
                  sponsor.active
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {sponsor.active ? "Ativo" : "Inativo"}
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
  const [title, setTitle] = useState("");
  const [number, setNumber] = useState("");
  const [publishedAt, setPublishedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
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
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => void promptEditEdition(e)}
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-primary hover:text-primary-foreground transition"
                aria-label="Editar"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            <button
              onClick={async () => {
                if (await confirmAction("Excluir esta edição?", "Esta ação remove o PDF e não pode ser desfeita.")) {
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
          active: Boolean((document.getElementById("sponsor-active") as HTMLInputElement | null)
            ?.checked),
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
            Use uma imagem horizontal, de preferência 1200x600px, em PNG ou JPG. O site
            exibirá todos os logos no mesmo tamanho visual, sem cortar a imagem.
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
                  if (await confirmAction("Excluir patrocinador?", "Esta ação remove o cadastro e a imagem enviada.")) {
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
