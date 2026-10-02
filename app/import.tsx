import * as ImageManipulator from "expo-image-manipulator";
import { aiService } from "../src/services/ai";
import { AiStatus } from "../src/components/AiStatus";
import { aiRu } from "../src/i18n/ru";
import { fetch as expoFetch } from "expo/fetch";
import { Screen } from "../src/components/Screen";
import { useRef, useState } from "react";
import { ActivityIndicator, Image, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { getResetGeneration, stockFingerprint, useStore } from "../src/store";
import { useTheme } from "../src/theme";
import { money, v2 as ru } from "../src/i18n/ru";
import { ImportRow } from "../src/types";
import {
  ColumnField,
  ColumnMapping,
  importService,
  previewChanges,
  WorkbookTable,
} from "../src/services/imports";
import { sampleWorkbook } from "../src/data/sampleWorkbook";
import {
  AICard,
  AILabel,
  Button,
  Card,
  Chip,
  Field,
  Label,
  ProductThumb,
  Row,
} from "../src/components/ui";
import { useToast } from "../src/components/Toast";
export default function ImportScreen() {
  const { mode = "excel", businessId } = useLocalSearchParams<{
    mode?: string;
    businessId?: string;
  }>();
  const b = useStore((s) => s.businesses[businessId || s.currentBusinessId]);
  const t = useTheme();
  const toast = useToast();
  const resultScope = useRef({
    businessId: b.id,
    generation: getResetGeneration(),
  });
  const [step, setStep] = useState(mode === "manual" ? "preview" : "upload");
  const [image, setImage] = useState<string>();
  const [rows, setRows] = useState<ImportRow[]>(
    mode === "manual" ? [{ name: "", qty: 1, price: 0, confidence: 1 }] : [],
  );
  const [table, setTable] = useState<WorkbookTable>();
  const [mapping, setMapping] = useState<ColumnMapping>({
    name: -1,
    qty: -1,
    price: -1,
    size: -1,
    color: -1,
  });
  const [mappingConfidence, setMappingConfidence] = useState(1);
  const [invoiceImage, setInvoiceImage] = useState<string>();
  async function mapWithAi() {
    if (!table) return;
    setBusy(true);
    try {
      const result = await aiService.mapColumns(
        table.headers,
        table.rows,
        importService.guess(table.headers),
      );
      const { name, qty, price, size, color } = result.mapping;
      setMapping({ name, qty, price, size, color });
      setMappingConfidence(result.confidence);
    } finally {
      setBusy(false);
    }
  }
  async function retryInvoice() {
    if (!invoiceImage) return;
    setStep("processing");
    try {
      setRows(await importService.recognize(b.products, invoiceImage));
      setStep("preview");
    } catch {
      setError(ru.error);
      setStep("upload");
    }
  }
  const [fingerprint, setFingerprint] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function load(
    data: ArrayBuffer | string,
    type: "array" | "base64" = "array",
  ) {
    try {
      resultScope.current = {
        businessId: b.id,
        generation: getResetGeneration(),
      };
      const table = importService.parse(data, type);
      setTable(table);
      setMapping(importService.guess(table.headers));
      setError("");
      setStep("mapping");
    } catch (e) {
      setError(e instanceof Error ? e.message : ru.badFile);
    }
  }
  async function pickFile() {
    setBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/csv",
          "text/comma-separated-values",
          "application/vnd.ms-excel",
        ],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.size && asset.size > 2 * 1024 * 1024) throw Error(ru.emptyFile);
      const buffer = asset.file
        ? await asset.file.arrayBuffer()
        : await (await expoFetch(asset.uri)).arrayBuffer();
      if (buffer.byteLength > 2 * 1024 * 1024) throw Error(ru.emptyFile);
      load(buffer);
    } catch (e) {
      setError(e instanceof Error ? e.message : ru.badFile);
    } finally {
      setBusy(false);
    }
  }
  async function recognize(source: "camera" | "gallery" | "sample") {
    setError("");
    try {
      resultScope.current = {
        businessId: b.id,
        generation: getResetGeneration(),
      };
      let encoded: string | undefined;
      if (source !== "sample") {
        if (source === "camera") {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) throw Error(ru.permission);
        }
        const result = source === "camera"
          ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.7,
          })
          : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.7,
          });
        if (result.canceled) return;
        const asset = result.assets[0];
        setImage(asset.uri);
        const context = ImageManipulator.ImageManipulator.manipulate(asset.uri);
        if (Math.max(asset.width, asset.height) > 1600) {
          context.resize(
            asset.width >= asset.height ? { width: 1600 } : { height: 1600 },
          );
        }
        const rendered = await context.renderAsync();
        const resized = await rendered.saveAsync({
          format: ImageManipulator.SaveFormat.JPEG,
          compress: 0.7,
          base64: true,
        });
        encoded = resized.base64;
        if (!encoded || encoded.length > 4_000_000) throw Error(ru.emptyFile);
        setInvoiceImage(encoded);
      }
      setStep("processing");
      const result = await importService.recognize(b.products, encoded);
      setRows(result);
      setStep("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : ru.error);
      setStep("upload");
    }
  }
  const applied = useRef(false);
  function apply() {
    if (applied.current) return;
    try {
      if (
        resultScope.current.businessId !== b.id ||
        resultScope.current.generation !== getResetGeneration()
      ) throw Error(ru.error);
      useStore
        .getState()
        .importStock(
          b.id,
          rows,
          mode === "excel" ? "replace" : "add",
          mode === "invoice"
            ? "invoice"
            : mode === "excel"
            ? "excel"
            : "manual",
          mode === "excel" ? fingerprint : undefined,
        );
      applied.current = true;
      toast(ru.importSuccess);
      if (router.canGoBack()) router.back();
      else {
        useStore.getState().switchBusiness(b.id);
        router.replace("/stock");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : ru.error);
    }
  }
  return (
    <Screen
      back
      title={mode === "invoice"
        ? ru.invoice
        : mode === "manual"
        ? ru.manual
        : ru.excel}
      subtitle={b.name}
    >
      <AiStatus
        retry={mode === "excel"
          ? () => void mapWithAi()
          : invoiceImage
          ? () => void retryInvoice()
          : undefined}
      />
      {!!error && (
        <Card style={{ backgroundColor: t.warningBg }}>
          <Label color={t.warningText}>{error}</Label>
        </Card>
      )}
      <AICard>
        <AILabel />
        <Label bold size={15}>
          {mode === "invoice"
            ? ru.invoice
            : mode === "manual"
            ? ru.addProduct
            : ru.excel}
        </Label>
        <Label muted size={12}>
          {mode === "invoice"
            ? ru.photoHint
            : mode === "excel"
            ? ru.excelHint
            : ru.manual}
        </Label>
        {step === "upload" &&
          (mode === "invoice"
            ? (
              <>
                <ProductThumb icon="photo_camera" size={80} />
                <Button
                  icon="photo_camera"
                  title={ru.camera}
                  onPress={() => void recognize("camera")}
                />
                <Button
                  secondary
                  title={ru.gallery}
                  onPress={() => void recognize("gallery")}
                />
                <Button
                  secondary
                  title={ru.sample}
                  onPress={() => void recognize("sample")}
                />
              </>
            )
            : (
              <>
                <Button
                  icon="upload_file"
                  title={ru.excel}
                  disabled={busy}
                  onPress={() => void pickFile()}
                />
                <Button
                  secondary
                  title={ru.sample}
                  onPress={() => load(sampleWorkbook, "base64")}
                />
              </>
            ))}
        {step === "processing" && (
          <View style={{ padding: 24, alignItems: "center", gap: 12 }}>
            <ActivityIndicator color={t.accent} size="large" />
            <Label bold>{aiRu.thinking}</Label>
          </View>
        )}
        {step === "mapping" && table && (
          <>
            <Label bold>{ru.mapping}</Label>
            <Button
              small
              secondary
              title={busy ? aiRu.thinking : aiRu.map}
              disabled={busy}
              onPress={() => void mapWithAi()}
            />
            {mappingConfidence < 0.7 && (
              <Label color={t.warningText}>{aiRu.review}</Label>
            )}
            {(["name", "qty", "price", "size", "color"] as ColumnField[]).map(
              (field) => (
                <View key={field} style={{ gap: 8 }}>
                  <Label bold size={12}>
                    {ru[field]}
                  </Label>
                  <Row style={{ flexWrap: "wrap" }}>
                    <Chip
                      title={ru.none}
                      active={mapping[field] === -1}
                      onPress={() => setMapping((m) => ({ ...m, [field]: -1 }))}
                    />
                    {table.headers.map((h, i) => (
                      <Chip
                        key={i}
                        title={h || String(i + 1)}
                        active={mapping[field] === i}
                        onPress={() =>
                          setMapping((m) => ({ ...m, [field]: i }))}
                      />
                    ))}
                  </Row>
                </View>
              ),
            )}
            <Button
              title={ru.preview}
              onPress={() => {
                try {
                  setRows(importService.map(table, mapping));
                  setFingerprint(
                    stockFingerprint(useStore.getState().businesses[b.id]),
                  );
                  setError("");
                  setStep("preview");
                } catch (e) {
                  setError(e instanceof Error ? e.message : ru.invalidRows);
                }
              }}
            />
          </>
        )}
        {step === "preview" && (
          <>
            {image && (
              <Image
                source={{ uri: image }}
                style={{ height: 140, borderRadius: 14 }}
              />
            )}
            {mode === "invoice" && (
              <Label muted size={11}>
                {aiRu.review}
              </Label>
            )}
            {rows.map((row, i) => {
              const changes = mode === "excel"
                ? previewChanges([row], b.products)[0]
                : undefined;
              return (
                <Card
                  key={i}
                  style={{
                    padding: 12,
                    backgroundColor: row.confidence < 0.7
                      ? t.warningBg
                      : t.tint,
                  }}
                >
                  <Row>
                    <Label bold size={12} style={{ flex: 1 }}>
                      {mode === "invoice"
                        ? `${Math.round(row.confidence * 100)}%`
                        : ru.name}
                    </Label>
                    <Button
                      small
                      secondary
                      title={ru.remove}
                      onPress={() =>
                        setRows((r) => r.filter((_, j) => i !== j))}
                    />
                  </Row>
                  {row.confidence < 0.7 && (
                    <Label size={11} color={t.warningText}>
                      {ru.checkLow}
                    </Label>
                  )}
                  <Field
                    accessibilityLabel={`${ru.name} ${i + 1}`}
                    value={row.name}
                    onChangeText={(name) =>
                      setRows(
                        rows.map((r, j) =>
                          j === i ? { ...r, name, productId: undefined } : r
                        ),
                      )}
                  />
                  <Row>
                    <View style={{ flex: 1 }}>
                      <Label muted size={10}>
                        {ru.qty}
                      </Label>
                      <Field
                        keyboardType="decimal-pad"
                        value={String(row.qty)}
                        onChangeText={(s) =>
                          setRows(
                            rows.map((r, j) =>
                              j === i
                                ? { ...r, qty: Number(s.replace(",", ".")) }
                                : r
                            ),
                          )}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Label muted size={10}>
                        {ru.price}
                      </Label>
                      <Field
                        keyboardType="decimal-pad"
                        value={String(row.price)}
                        onChangeText={(s) =>
                          setRows(
                            rows.map((r, j) =>
                              j === i
                                ? { ...r, price: Number(s.replace(",", ".")) }
                                : r
                            ),
                          )}
                      />
                    </View>
                  </Row>
                  {(b.type === "aru" || b.type === "tumar") && (
                    <Row>
                      <Field
                        placeholder={ru.size}
                        value={row.size || ""}
                        style={{ flex: 1 }}
                        onChangeText={(size) =>
                          setRows(
                            rows.map((r, j) => (j === i ? { ...r, size } : r)),
                          )}
                      />
                      <Field
                        placeholder={ru.color}
                        value={row.color || ""}
                        style={{ flex: 1 }}
                        onChangeText={(color) =>
                          setRows(
                            rows.map((r, j) => (j === i ? { ...r, color } : r)),
                          )}
                      />
                    </Row>
                  )}
                  {changes && (
                    <Label
                      bold
                      size={12}
                      color={changes.delta < 0 ? t.danger : t.success}
                    >
                      {changes.before} → {row.qty} (
                      {changes.delta > 0 ? "+" : ""}
                      {changes.delta}) · {money(changes.previousPrice || 0)} →
                      {" "}
                      {money(row.price)}
                    </Label>
                  )}
                </Card>
              );
            })}
            {mode === "manual" && (
              <Button
                secondary
                title={ru.addProduct}
                onPress={() =>
                  setRows((r) => [
                    ...r,
                    { name: "", qty: 1, price: 0, confidence: 1 },
                  ])}
              />
            )}
            <Button
              title={mode === "excel" ? ru.apply : ru.applyStock}
              disabled={busy || !rows.length}
              onPress={apply}
            />
            {mode === "excel" && (
              <Button
                secondary
                title={ru.back}
                onPress={() => {
                  setError("");
                  setStep("mapping");
                }}
              />
            )}
          </>
        )}
      </AICard>
    </Screen>
  );
}
