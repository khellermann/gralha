import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Feather, GraduationCap, Newspaper, PenLine } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RoughUnderline } from "@/components/RoughUnderline";
import { absoluteUrl, createSeo, jsonLd } from "@/lib/seo";

const works = [
  "Seleção Natural (1ª Ed.), Espaço Idea, 2006",
  "João e seu baú mágico (conto infanto-juvenil), Espaço Idea, 2008",
  "Amar só se for armado, Espaço Idea, 2008",
  "Entrelinhas (coletânea de autores), Ed. Andross, 2008",
  "Amor fé Menino, Espaço Idea, 2014",
  "Contos do Cotidiano, Ed. Patuá, 2012",
  "Primeira Antologia Literária, Moinhos de Vento, 2018 - ALGRASP",
  "Segunda Antologia Literária, Além da Porta, 2019 - ALGRASP",
  "Terceira Antologia Literária, Solidão Urbana, 2020 - ALGRASP",
  "Revista Tamises Academia de Letras da Grande São Paulo, ALGRASP, v.9 ao v.17",
  "Seleção Natural e outros contos (2ª Ed.), Ed. D3 Educacional, 2019",
];

const highlights = [
  {
    icon: GraduationCap,
    title: "Formação",
    text: "Graduado em Letras - Literatura, especialista em Literatura Africana e Infantil e mestre em Ciências da Religião pela PUC/SP.",
  },
  {
    icon: Feather,
    title: "Academias",
    text: "Membro da ALGRASP e membro fundador e primeiro presidente da ALNORPI, ocupando a cadeira 01.",
  },
  {
    icon: Newspaper,
    title: "A Gralha",
    text: "Fundador da Editora A Gralha Cultural e idealizador do Jornal Cultural A Gralha, primeiro jornal 100% cultural do Norte Pioneiro.",
  },
];

export const Route = createFileRoute("/editor")({
  head: () => {
    const seo = createSeo({
      title: "Flávio Mello - Editor de A Gralha",
      description:
        "Conheça Flávio Mello, editor, escritor, professor e idealizador do Jornal Cultural A Gralha.",
      path: "/editor",
      image: "/flavio-mello.jfif",
      imageType: null,
    });

    return {
      ...seo,
      scripts: [
        jsonLd({
          "@context": "https://schema.org",
          "@type": "Person",
          name: "Flávio Mello",
          url: absoluteUrl("/editor"),
          image: absoluteUrl("/flavio-mello.jfif"),
          jobTitle: "Editor, escritor e professor",
          worksFor: {
            "@type": "Organization",
            name: "A Gralha",
            url: absoluteUrl("/"),
          },
        }),
      ],
    };
  },
  component: EditorPage,
});

function EditorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper-grain">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14 w-full flex-1">
        <section className="grid gap-10 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
          <aside className="lg:sticky lg:top-28">
            <div className="overflow-hidden rounded-md border border-ink/15 bg-card paper-shadow">
              <img
                src="/flavio-mello.jfif"
                alt="Flávio Mello"
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
            <div className="mt-5 border-l-4 border-primary bg-card/70 px-4 py-3 text-sm text-muted-foreground">
              <p className="font-semibold text-ink">Editor-chefe e idealizador</p>
              <p>
                Jornal Cultural <RoughUnderline>A Gralha</RoughUnderline>
              </p>
            </div>
          </aside>

          <article>
            <header className="border-b border-ink/15 pb-8">
              <p className="text-xs uppercase tracking-[0.35em] text-primary">Sobre o editor</p>
              <h1 className="mt-3 text-serif text-4xl sm:text-6xl font-black text-ink">
                Flávio Mello
              </h1>
              <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
                Professor, palestrante, editor de livros, coordenador editorial e escritor.
              </p>
            </header>

            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              {highlights.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-md border border-ink/10 bg-card/70 p-4">
                  <Icon className="h-5 w-5 text-primary" />
                  <h2 className="mt-3 text-serif text-lg font-bold text-ink">
                    {title === "A Gralha" ? <RoughUnderline>{title}</RoughUnderline> : title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {title === "A Gralha" ? (
                      <>
                        Fundador da Editora <RoughUnderline>A Gralha</RoughUnderline> Cultural e
                        idealizador do Jornal Cultural <RoughUnderline>A Gralha</RoughUnderline>,
                        primeiro jornal 100% cultural do Norte Pioneiro.
                      </>
                    ) : (
                      text
                    )}
                  </p>
                </div>
              ))}
            </section>

            <section className="mt-10 max-w-[780px] text-[16px] leading-7 text-ink [&_p]:mb-2 [&_p]:text-left sm:[&_p]:text-justify [&_strong]:font-bold [&_strong]:text-ink">
              <h2 className="mb-2 text-serif text-3xl font-black leading-tight text-ink">
                Sobre o Editor
              </h2>
              <p>
                Possui graduação em Letras - Literatura, Especialização em Práticas e Vertentes -
                Literatura Africana e Infantil e Mestrado no curso de Ciências da Religião na
                Pontifícia Universidade Católica de São Paulo, PUC/SP, Brasil. Título da tese:
                <strong>
                  {" "}
                  Notas biográficas e metáforas religiosas na poesia de Jorge de Lima
                </strong>
                , com orientação do Dr. Ênio José da Costa Brito.
              </p>
              <p>
                É membro da ALGRASP, Academia de Letras da Grande São Paulo, com posse em
                25/08/2011, na cadeira 02, que tem como patrono Olavo Bilac, tendo como padrinho o
                escritor e jornalista Hildebrando Pafundi. Hoje, Flávio Mello é membro
                correspondente.
              </p>
              <p>
                É membro fundador e primeiro presidente da ALNORPI, Academia de Letras do Norte
                Pioneiro, com posse e fundação em 29/10/2021, na cadeira 01, que tem como patrono o
                poeta alagoano Jorge de Lima.
              </p>
              <p>
                Fundador da Editora <RoughUnderline>A Gralha</RoughUnderline> Cultural, em janeiro
                de 2021, é também o idealizador e criador do primeiro jornal 100% cultural do Norte
                Pioneiro, <RoughUnderline>A Gralha</RoughUnderline>, lançado em abril de 2021. O
                Jornal Cultural <RoughUnderline>A Gralha</RoughUnderline> já contemplou mais de 400
                artistas gratuitamente, do Paraná e de outros estados do Brasil, com mais de oito
                mil exemplares distribuídos no Brasil, EUA e Portugal.
              </p>
              <p>
                Também é editor-chefe do Jornal Acontece e tem uma coluna semanal no JCN Jornal
                Correio do Norte, onde escreve sobre o cotidiano por meio da crônica poética.
              </p>
              <p>
                Atualmente é Diretor de Cultura da cidade de Siqueira Campos, onde mora desde 2018,
                e professor convidado em universidades e colégios, ministrando aulas sobre
                Literatura, Escrita Criativa, Conto Contemporâneo e Poesia. Também realiza oficinas
                em diferentes abordagens, da criação de peças e construção de fantoches à poesia
                modernista de Jorge de Lima.
              </p>
            </section>

            <section className="mt-12 border-t border-ink/15 pt-8">
              <div className="mb-5 flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-primary" />
                <h2 className="text-serif text-3xl font-black text-ink">Obras e Participações</h2>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {works.map((work) => (
                  <li
                    key={work}
                    className="flex gap-3 rounded-md border border-ink/10 bg-card/70 p-3 text-sm leading-relaxed text-ink"
                  >
                    <PenLine className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{work}</span>
                  </li>
                ))}
              </ul>
            </section>
          </article>
        </section>
      </main>

      <Footer />
    </div>
  );
}
