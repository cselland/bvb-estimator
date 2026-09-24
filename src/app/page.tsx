import Calculator from "./calculator";
import { getModelCatalog } from "@/lib/model-catalog.server";

// The model list comes from the nightly Overshoot price snapshot, resolved on
// the server (in-memory cached for an hour) so the picker never waits on the
// client. That makes the page per-request rather than prerendered.
export const dynamic = "force-dynamic";

export default async function Home() {
  const catalog = await getModelCatalog();
  return <Calculator catalog={catalog} />;
}
