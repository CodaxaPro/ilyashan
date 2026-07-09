import { siteConfig } from "@/lib/config";
import { CTAButtons } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center gradient-hero overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="absolute top-20 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-sky-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-4 py-2 text-white text-sm font-medium mb-6">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Jetzt Termine verfügbar in {siteConfig.contact.region}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              Streifenfreie{" "}
              <span className="relative">
                Fensterreinigung
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 8" fill="none">
                  <path d="M2 6C50 2 100 2 150 4C200 6 250 2 298 4" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-xl leading-relaxed">
              Professionelle Fensterreinigung für Privat- und Gewerbekunden.
              Kostenloses Festpreis-Angebot in {siteConfig.business.responseTime} – versichert, pünktlich, garantiert streifenfrei.
            </p>

            <CTAButtons className="mb-10" />

            <div className="flex flex-wrap gap-6 text-white/90 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Kostenloses Angebot
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Vollversichert
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                {siteConfig.business.customers} zufriedene Kunden
              </div>
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { value: siteConfig.business.rating, label: "Google Bewertung", suffix: "★" },
                  { value: siteConfig.business.customers, label: "Kunden", suffix: "" },
                  { value: siteConfig.business.responseTime, label: "Antwortzeit", suffix: "" },
                  { value: "100%", label: "Zufriedenheit", suffix: "" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/10 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">
                      {stat.value}
                      {stat.suffix && <span className="text-emerald-400 text-lg">{stat.suffix}</span>}
                    </div>
                    <div className="text-white/70 text-xs mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl p-6 text-foreground">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4511E] text-sm font-semibold text-white">
                    C
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Cengiz Aydin</p>
                    <p className="text-xs text-[#1A73E8] font-medium">Local Guide</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-[#FBBC04]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-xs text-muted ml-2">{siteConfig.business.rating} · Google</span>
                </div>
                <p className="text-sm text-muted leading-relaxed">
                  &ldquo;Er macht seine Arbeit so gut, dass man denkt, das Haus gehört ihm.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" className="w-full">
          <path d="M0 40L60 35C120 30 240 20 360 15C480 10 600 10 720 15C840 20 960 30 1080 35C1200 40 1320 40 1380 40L1440 40V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0V40Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
