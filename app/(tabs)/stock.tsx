import { useStore } from "../../src/store";
import { ru } from "../../src/i18n/ru";
import { Label, Screen } from "../../src/components/ui";
import { StockRow } from "../../src/components/StockRow";
export default function Stock() {
  const products = useStore((s) => s.products);
  return (
    <Screen>
      <Label size={28} bold>
        {ru.stockHint}
      </Label>
      {products.map((p) => (
        <StockRow key={p.id} product={p} />
      ))}
    </Screen>
  );
}
