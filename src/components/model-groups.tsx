"use client";

import { SelectGroup, SelectItem, SelectLabel } from "@/components/ui/select";
import { optionValue, type ModelCatalog } from "@/lib/model-catalog";

/** Picker sections: price tiers, the partial open-weight list, seat-priced tools. */
export function ModelGroups({ catalog }: { catalog: ModelCatalog }) {
  return (
    <>
      {catalog.groups.map((group) => (
        <SelectGroup key={group.key}>
          <SelectLabel title={group.note}>{group.label}</SelectLabel>
          {group.ids.map((id) => {
            const m = catalog.models[id]!;
            const showProvider = m.kind === "tokens" && !m.label.startsWith(m.provider);
            return (
              <SelectItem key={id} value={optionValue(group.key, id)} hint={showProvider ? m.provider : undefined}>
                {m.label}
              </SelectItem>
            );
          })}
        </SelectGroup>
      ))}
    </>
  );
}
