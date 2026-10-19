import { ReactNode } from "react";
import { router } from "expo-router";
import { useBusiness } from "../store";
import { useRemoteMessaging } from "../hooks/useRemoteMessaging";
import { Screen } from "./Screen";
import { Button, Card, Label, Row, SpringPress } from "./ui";
import { metaRu, time } from "../i18n/ru";
import { useTheme } from "../theme";
export function RemoteChats({ switcher }: { switcher?: ReactNode }) {
  const b = useBusiness();
  const t = useTheme();
  const { snapshot, error, loading, refresh } = useRemoteMessaging(b);
  return (
    <Screen title={`${metaRu.chats} · ${b.name}`} subtitle={metaRu.live}>
      {switcher}
      <Button
        secondary
        title={metaRu.title}
        onPress={() => router.push("/settings")}
      />
      {loading && <Label>{metaRu.loading}</Label>}
      {!!error && <Label color={t.danger}>{error}</Label>}
      <Button small secondary title={metaRu.refresh} onPress={refresh} />
      {!loading && !snapshot?.conversations.length && (
        <Card>
          <Label>{metaRu.noMessages}</Label>
          <Label muted>{metaRu.connectHint}</Label>
        </Card>
      )}
      {snapshot?.conversations.map((c) => {
        const customer = snapshot.customers.find((x) => x.id === c.customer_id);
        const last = snapshot.messages.filter((m) => m.conversation_id === c.id)
          .at(-1);
        return (
          <SpringPress
            key={c.id}
            label={customer?.name || c.channel}
            onPress={() =>
              router.push({
                pathname: "/chat/[id]",
                params: { id: c.id, businessId: b.id },
              })}
          >
            <Card>
              <Row>
                <Label bold style={{ flex: 1 }}>
                  {customer?.name || c.channel}
                </Label>
                <Label muted size={11}>
                  {c.last_message_at ? time(c.last_message_at) : ""}
                </Label>
              </Row>
              <Label muted>
                {c.channel} · {last?.text ||
                  (last?.media_url || last?.media_id ? metaRu.attachment : "")}
              </Label>
              {c.unread_count > 0 && (
                <Label color={t.accent}>{c.unread_count}</Label>
              )}
            </Card>
          </SpringPress>
        );
      })}
    </Screen>
  );
}
