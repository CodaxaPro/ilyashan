type Item = { word: string; headline: string; text: string };

type Props = {
  eyebrow: string;
  headline: string;
  items: Item[];
};

export function EmotionGrid({ eyebrow, headline, items }: Props) {
  return (
    <>
      <div className="max-w-2xl mx-auto text-center mb-12">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h2 className="headline-lg">{headline}</h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.word} className="bg-card border border-border rounded-2xl p-8">
            <p className="eyebrow mb-2 text-accent">{item.word}</p>
            <h3 className="text-xl font-bold mb-3">{item.headline}</h3>
            <p className="text-muted text-sm leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </>
  );
}
