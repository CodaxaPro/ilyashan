"use client";

import { useState } from "react";
import { companyServices } from "@/lib/company-services";
import { Button } from "@/components/ui/Button";

export function ServiceChoice() {
  const [href, setHref] = useState(companyServices[0].href);
  const selected = companyServices.find((service) => service.href === href) ?? companyServices[0];

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="block min-w-0 flex-1 text-sm">
        <span className="text-muted">Leistung</span>
        <select
          className="mt-2 w-full border border-border bg-white px-3 py-3 text-base text-foreground"
          value={selected.href}
          onChange={(event) => setHref(event.target.value)}
        >
          {companyServices.map((service) => (
            <option key={service.href} value={service.href}>
              {service.title}
            </option>
          ))}
        </select>
      </label>
      <Button href={selected.nextHref} variant="primary" size="lg" className="sm:shrink-0">
        {selected.nextLabel}
      </Button>
    </div>
  );
}
