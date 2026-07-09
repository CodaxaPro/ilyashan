import { siteConfig } from "@/lib/config";

export function Process() {
  return (
    <section id="ablauf" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">So einfach geht&apos;s</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold mt-3 mb-4">
            In 3 Schritten zu strahlend sauberen Fenstern
          </h2>
          <p className="text-muted text-lg">
            Unkompliziert, transparent und schnell – so arbeiten wir.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-linear-to-r from-primary via-accent to-primary" />

          {siteConfig.process.map((step) => (
            <div key={step.step} className="relative text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6 relative z-10 shadow-lg shadow-primary/30">
                {step.step}
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-muted text-sm leading-relaxed max-w-xs mx-auto">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
