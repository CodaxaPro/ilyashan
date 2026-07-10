interface StepPlaceholderProps {
  title: string;
  description: string;
}

export function StepPlaceholder({ title, description }: StepPlaceholderProps) {
  return (
    <div className="text-center py-12">
      <div className="w-14 h-14 rounded-2xl bg-primary-light text-primary flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-4.127-4.09l4.655-5.653m0 0l3.182-3.183a2.548 2.548 0 014.127 4.09l-3.182 3.183" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted max-w-md mx-auto">{description}</p>
    </div>
  );
}
