import { runProductionChecks, productionReadinessScore, isProductionReady } from "../lib/production-check";

const checks = runProductionChecks();
const score = productionReadinessScore();
const ready = isProductionReady();

console.log(`\nIlyashan Production Readiness: ${score}%${ready ? " ✓" : " (incomplete)"}\n`);

for (const item of checks) {
  const icon = item.status === "ok" ? "✓" : item.status === "warn" ? "!" : "✗";
  console.log(`  ${icon} [${item.status.toUpperCase()}] ${item.label}`);
  console.log(`      ${item.detail}`);
}

console.log("");
process.exit(ready ? 0 : 1);
