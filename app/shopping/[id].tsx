import { Screen } from "../../src/components/Screen";
import { useLocalSearchParams } from "expo-router";
import { useStore } from "../../src/store";
import {
  Card,
  Label,
  Row,
  SpringPress,
  EmptyState,
} from "../../src/components/ui";
import { Icon } from "../../src/components/Icon";
import { v2 as ru } from "../../src/i18n/ru";
export default function Shopping() {
  const { id, businessId } = useLocalSearchParams<{
    id: string;
    businessId?: string;
  }>();
  const b = useStore((s) => s.businesses[businessId || s.currentBusinessId]);
  const list = b?.lists.find((l) => l.id === id);
  return (
    <Screen back title={ru.shopping}>
      {list?.items.length ? (
        list.items.map((i) => (
          <SpringPress
            key={i.id}
            onPress={() => useStore.getState().checkItem(b.id, id, i.id)}
          >
            <Card>
              <Row>
                <Icon name={i.done ? "check_circle" : "shopping_cart"} />
                <Label
                  style={{
                    flex: 1,
                    textDecorationLine: i.done ? "line-through" : "none",
                  }}
                >
                  {i.name}
                </Label>
                <Label bold>
                  {i.qty} {i.unit}
                </Label>
              </Row>
            </Card>
          </SpringPress>
        ))
      ) : (
        <EmptyState title={ru.noShopping} />
      )}
    </Screen>
  );
}
