import Comparison from "./comparison";
import { getModelCatalog } from "@/lib/model-catalog.server";

// Same server-resolved model catalog as the calculator; see src/app/page.tsx.
export const dynamic = "force-dynamic";

export default async function ComparisonPage() {
  const catalog = await getModelCatalog();
  return <Comparison catalog={catalog} />;
}
