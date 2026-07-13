type Props = {
  title: string;
  eyebrow?: string;
  items: { q: string; a: string }[];
};

export function FaqSection({ title, eyebrow = "Fragen", items }: Props) {
  return (
    <dl className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h2 className="headline-lg">{title}</h2>
      </div>
      {items.map((item) => (
        <div key={item.q} className="border-b border-border pb-8 last:border-0">
          <dt className="text-lg font-semibold text-foreground mb-3">{item.q}</dt>
          <dd className="text-muted leading-relaxed">{item.a}</dd>
        </div>
      ))}
    </dl>
  );
}
