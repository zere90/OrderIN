import { useLocalSearchParams, router } from "expo-router";
import { useStore } from "../../src/store";
import { ru } from "../../src/i18n/ru";
import { Button, EmptyState, Screen } from "../../src/components/ui";
import { OrderCard } from "../../src/components/OrderCard";
export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useStore((s) => s.orders.find((o) => o.id === id));
  return (
    <Screen>
      {order ? (
        <>
          <OrderCard order={order} editable />
          <Button
            secondary
            title={ru.inbox}
            onPress={() =>
              router.push({
                pathname: "/chat/[id]",
                params: { id: order.chatId },
              })
            }
          />
        </>
      ) : (
        <EmptyState />
      )}
    </Screen>
  );
}
