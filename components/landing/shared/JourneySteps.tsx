type Step = { num: string; title: string; text: string };

type Props = {
  eyebrow: string;
  headline: string;
  steps: Step[];
};

export function JourneySteps({ eyebrow, headline, steps }: Props) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h2 className="headline-lg">{headline}</h2>
      </div>
      <ol className="space-y-8">
        {steps.map((step) => (
          <li key={step.num} className="flex gap-6 md:gap-10">
            <span className="text-4xl md:text-5xl font-bold text-primary/20 shrink-0">{step.num}</span>
            <div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-muted leading-relaxed">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
