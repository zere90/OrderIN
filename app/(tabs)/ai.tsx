import { Screen } from "../../src/components/Screen";
import { router } from "expo-router";
import { useBusiness } from "../../src/store";
import { getOpportunities } from "../../src/services/opportunities";
import { v2 as ru } from "../../src/i18n/ru";
import { Label, Button, Card, EmptyState } from "../../src/components/ui";
import { OpportunityCard } from "../../src/components/OpportunityCard";
export default function AI() {
  const b = useBusiness();
  const opportunities = getOpportunities(b);
  return (
    <Screen title={`AI · ${b.name}`} subtitle={ru.opportunities}>
      {opportunities.map((op) => (
        <OpportunityCard key={`${b.id}-${op.id}`} op={op} />
      ))}
      {!opportunities.length && <EmptyState title={ru.opportunityEmpty} />}
      <Label muted size={11} bold>
        {ru.tools}
      </Label>
      <Card>
        <Button
          secondary
          icon="photo_camera"
          title={ru.invoice}
          onPress={() =>
            router.push({
              pathname: "/import",
              params: { mode: "invoice", businessId: b.id },
            })
          }
        />
        <Button
          secondary
          icon="table_view"
          title={ru.excel}
          onPress={() =>
            router.push({
              pathname: "/import",
              params: { mode: "excel", businessId: b.id },
            })
          }
        />
        {b.type === "aru" && (
          <Button
            secondary
            icon="straighten"
            title={ru.tryon}
            onPress={() =>
              router.push({
                pathname: "/tryon/[productId]",
                params: { productId: b.products[0].id, businessId: b.id },
              })
            }
          />
        )}
      </Card>
    </Screen>
  );
}
