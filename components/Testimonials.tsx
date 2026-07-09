import { siteConfig } from "@/lib/config";
import { ReviewCard } from "@/components/ReviewCard";
import { StarRating, GoogleLogo } from "@/components/ui/StarRating";

const featuredReview = siteConfig.testimonials[0];

export function Testimonials() {
  return (
    <section id="bewertungen" className="py-20 lg:py-28 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-center text-center lg:mb-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 shadow-sm">
            <GoogleLogo className="h-[18px]" />
            <span className="text-sm font-medium text-muted">Bewertungen</span>
          </div>

          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Kundenstimmen
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold mt-3 mb-4 max-w-2xl">
            Vertrauen, das man sieht – echte Google Bewertungen
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <StarRating rating={5} />
            <span className="text-2xl font-bold text-foreground">{siteConfig.business.rating}</span>
            <span className="text-muted text-sm">
              · {siteConfig.business.reviews} verifizierte Bewertungen
            </span>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-primary/20 bg-white p-6 shadow-sm lg:mb-10 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
            <div className="flex items-center gap-4 lg:shrink-0">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F4511E] text-xl font-semibold text-white">
                {featuredReview.initial}
              </div>
              <div>
                <p className="text-lg font-bold">{featuredReview.name}</p>
                {featuredReview.localGuide && (
                  <p className="text-sm font-medium text-[#1A73E8]">Local Guide</p>
                )}
                <StarRating rating={featuredReview.rating} size="sm" />
              </div>
            </div>
            <blockquote className="border-l-4 border-primary/30 pl-6 text-lg leading-relaxed text-foreground/90 italic">
              &ldquo;{featuredReview.text}&rdquo;
            </blockquote>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {siteConfig.testimonials.slice(1).map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}
