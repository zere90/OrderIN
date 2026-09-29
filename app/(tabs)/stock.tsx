import { Screen } from "../../src/components/Screen";
import { useState } from "react";
import { router } from "expo-router";
import { useBusiness } from "../../src/store";
import { useTheme } from "../../src/theme";
import { v2 as ru, time, readableDate } from "../../src/i18n/ru";
import {
  Label,
  Button,
  Row,
  Card,
  Field,
  Chip,
  BottomSheet,
  EmptyState,
} from "../../src/components/ui";
import { StockRow } from "../../src/components/StockRow";
import { Icon } from "../../src/components/Icon";
export default function Stock() {
  const b = useBusiness();
  const t = useTheme();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sheet, setSheet] = useState(false);
  const [history, setHistory] = useState(false);
  const [edit, setEdit] = useState(false);
  const list = b.products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" ||
        (filter === "product" && ["product", "service"].includes(p.category)) ||
        p.category === filter),
  );
  const low = b.products.filter((p) => p.stock < 3).length;
  return (
    <Screen
      title={t.skin.stockLabel}
      subtitle={b.name}
      footer={
        <Button
          icon="add"
          title={ru.updateStock}
          onPress={() => setSheet(true)}
        />
      }
    >
      {low > 0 && (
        <Card
          style={{
            backgroundColor: t.warningBg,
            borderColor: t.warning,
            padding: 12,
          }}
        >
          <Row>
            <Icon name="warning" size={18} color={t.warning} />
            <Label color={t.warningText} size={13} style={{ flex: 1 }}>
              {ru.lowCount(low)}
            </Label>
            <Button
              small
              secondary
              title={ru.refill}
              onPress={() => setSheet(true)}
            />
          </Row>
        </Card>
      )}
      <Field placeholder={ru.search} value={search} onChangeText={setSearch} />
      <Row style={{ flexWrap: "wrap" }}>
        {[
          { id: "all", title: ru.allStock },
          { id: "product", title: ru.menu },
          ...(b.products.some((p) => p.category === "ingredient")
            ? [{ id: "ingredient", title: ru.ingredients }]
            : []),
          ...(b.products.some((p) => p.category === "material")
            ? [{ id: "material", title: ru.materials }]
            : []),
        ].map((f) => (
          <Chip
            key={f.id}
            title={f.title}
            active={filter === f.id}
            onPress={() => setFilter(f.id)}
          />
        ))}
      </Row>
      {list.map((p) => (
        <StockRow key={p.id} product={p} businessId={b.id} editable={edit} />
      ))}
      {!list.length && <EmptyState />}
      <Button
        secondary
        title={ru.history}
        onPress={() => setHistory((v) => !v)}
      />
      {history &&
        b.history
          .slice()
          .reverse()
          .map((h) => (
            <Row
              key={h.id}
              style={{
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderColor: t.border,
              }}
            >
              <Icon
                name={
                  h.source === "invoice"
                    ? "photo_camera"
                    : h.source === "excel"
                      ? "table_view"
                      : "inventory_2"
                }
                size={18}
              />
              <Label size={12} style={{ flex: 1 }}>
                {h.name}
                {"\n"}
                <Label muted size={10}>
                  {readableDate(h.createdAt)} {time(h.createdAt)} ·{" "}
                  {ru.source[h.source]}
                </Label>
              </Label>
              <Label bold color={h.delta < 0 ? t.danger : t.success}>
                {h.delta > 0 ? "+" : ""}
                {h.delta}
              </Label>
            </Row>
          ))}
      <BottomSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title={ru.updateStock}
      >
        <Button
          secondary
          icon="photo_camera"
          title={ru.camera}
          onPress={() => {
            setSheet(false);
            router.push({
              pathname: "/import",
              params: { mode: "invoice", businessId: b.id },
            });
          }}
        />
        <Button
          secondary
          icon="table_view"
          title={ru.excel}
          onPress={() => {
            setSheet(false);
            router.push({
              pathname: "/import",
              params: { mode: "excel", businessId: b.id },
            });
          }}
        />
        <Button
          secondary
          icon="edit"
          title={ru.manual}
          onPress={() => {
            setSheet(false);
            setEdit(true);
          }}
        />
        <Button
          secondary
          title={ru.addProduct}
          onPress={() => {
            setSheet(false);
            router.push({
              pathname: "/import",
              params: { mode: "manual", businessId: b.id },
            });
          }}
        />
      </BottomSheet>
    </Screen>
  );
}
