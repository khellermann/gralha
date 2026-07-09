import { Facebook, Instagram, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-ink/15 bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <h3 className="text-serif text-2xl font-black">A Gralha</h3>
          <p className="mt-2 text-sm text-paper/70 max-w-sm">
            Jornal cultural dedicado à literatura, à arte e à memória — inspirado no voo azul da
            gralha, ave símbolo dos pinheirais.
          </p>
        </div>
        <div className="text-sm space-y-2">
          <h4 className="text-serif text-lg font-bold mb-3">Contato</h4>
          <a
            href="mailto:editoraagralha@gmail.com"
            className="flex items-center gap-2 text-paper/80 hover:text-gold transition-colors"
          >
            <Mail className="h-4 w-4" /> editoraagralha@gmail.com
          </a>
          <a
            href="https://wa.me/5543984376305"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-paper/80 hover:text-gold transition-colors"
          >
            <Phone className="h-4 w-4" /> (43) 98437-6305
          </a>
        </div>
        <div className="text-sm space-y-2">
          <h4 className="text-serif text-lg font-bold mb-3">Redes</h4>
          <a
            href="https://facebook.com/flaviomelloescritor"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-paper/80 hover:text-gold transition-colors"
          >
            <Facebook className="h-4 w-4" /> flaviomelloescritor
          </a>
          <a
            href="https://instagram.com/flaviomelloescritor"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-paper/80 hover:text-gold transition-colors"
          >
            <Instagram className="h-4 w-4" /> @flaviomelloescritor
          </a>
        </div>
      </div>
      <div className="border-t border-paper/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-paper/50 text-center">
          © {new Date().getFullYear()} A Gralha — Jornal Cultural. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
