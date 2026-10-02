import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Opportunity } from "../types";
import { useBusiness, useStore } from "../store";
import { useTheme } from "../theme";
import { v2 as ru } from "../i18n/ru";
import {
  AICard,
  AILabel,
  Label,
  Row,
  Button,
  BottomSheet,
  Field,
  Chip,
  ProductThumb,
} from "./ui";
import { useToast } from "./Toast";
export function OpportunityCard({
  op,
  compact = false,
}: {
  op: Opportunity;
  compact?: boolean;
}) {
  const b = useBusiness();
  const t = useTheme();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(op.draft);
  const [selected, setSelected] = useState(op.recipientIds);
  const [busy, setBusy] = useState(false);
  const created = b.createdOpportunities.includes(op.id);
  return (
    <>
      <AICard>
        <Row style={{ gap: 12 }}>
          <ProductThumb icon={op.icon} size={40} />
          <View style={{ flex: 1, gap: 4 }}>
            <AILabel />
            <Label bold size={14}>
              {op.title}
            </Label>
          </View>
        </Row>
        <Label muted size={12}>
          {op.reason}
        </Label>
        <View
          style={{ backgroundColor: t.tint, padding: 10, borderRadius: 12 }}
        >
          <Label color={t.accent} size={12} bold>
            {op.calculation}
          </Label>
        </View>
        {compact ? (
          <Button
            small
            title={`${op.title} →`}
            onPress={() => router.push("/ai")}
          />
        ) : (
          <>
            <Button
              small
              title={ru.sendCustomers}
              disabled={!op.recipientIds.length}
              onPress={() => {
                setText(op.draft);
                setSelected(op.recipientIds);
                setOpen(true);
              }}
            />
            <Row>
              <View style={{ flex: 1 }}>
                <Button
                  small
                  secondary
                  title={created ? ru.createdAlready : ru.create}
                  disabled={created}
                  onPress={() => {
                    const id = useStore.getState().createOpportunity(b.id, op);
                    if (id && op.kind === "shopping")
                      router.push({
                        pathname: "/shopping/[id]",
                        params: { id, businessId: b.id },
                      });
                    else toast(ru.created);
                  }}
                />
              </View>
              <Button
                small
                secondary
                title={ru.hide}
                onPress={() => {
                  useStore.getState().hide(b.id, op.id, true);
                  toast(ru.hidden, () =>
                    useStore.getState().hide(b.id, op.id, false),
                  );
                }}
              />
            </Row>
          </>
        )}
      </AICard>
      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={ru.previewMessage}
      >
        <Label muted size={12}>
          {ru.demo}
        </Label>
        <Field
          multiline
          accessibilityLabel={ru.draftMessage}
          value={text}
          onChangeText={setText}
          style={{ minHeight: 100 }}
        />
        <Label bold>{ru.recipients}</Label>
        {op.recipientIds.map((id) => {
          const customer = b.customers.find(
            (c) => c.id === b.chats.find((c) => c.id === id)?.customerId,
          );
          return (
            <Chip
              key={id}
              title={customer?.name || id}
              active={selected.includes(id)}
              onPress={() =>
                setSelected((s) =>
                  s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
                )
              }
            />
          );
        })}
        <Button
          title={ru.sendCustomers}
          disabled={busy || !selected.length || !text.trim()}
          onPress={() => {
            setBusy(true);
            void useStore
              .getState()
              .sendOpportunity(b.id, op, text, selected)
              .then(() => {
                setOpen(false);
                toast(ru.sentCustomers(selected.length));
              })
              .catch((e) => toast(String(e)))
              .finally(() => setBusy(false));
          }}
        />
      </BottomSheet>
    </>
  );
}
