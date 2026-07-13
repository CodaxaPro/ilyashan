import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export function Section({ children, className = "", id }: Props) {
  return (
    <section id={id} className={`section-padding ${className}`}>
      <div className="landing-container">{children}</div>
    </section>
  );
}
