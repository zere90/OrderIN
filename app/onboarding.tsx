import { Screen } from "../src/components/Screen";
import { useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BusinessType } from "../src/types";
import { useStore } from "../src/store";
import { ThemeProvider, useTheme } from "../src/theme";
import { v2 as ru } from "../src/i18n/ru";
import {
  Label,
  Button,
  Card,
  Row,
  Field,
  Chip,
  SpringPress,
  ProductThumb,
  FadeIn,
} from "../src/components/ui";
import { Icon } from "../src/components/Icon";
function BusinessChoice({
  type,
  selected,
  onPress,
}: {
  type: BusinessType;
  selected: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <SpringPress onPress={onPress}>
      <Card
        style={{
          padding: 14,
          borderColor: selected ? t.accent : t.border,
          gap: 8,
        }}
      >
        <LinearGradient
          colors={t.gradient}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={t.skin.icon} size={20} color={t.white} />
        </LinearGradient>
        <Label muted size={11}>
          {t.skin.businessType}
        </Label>
        <Label bold size={13}>
          {t.skin.name}
        </Label>
        <Label size={10} color={t.accent}>
          {t.skin.aiFeature}
        </Label>
      </Card>
    </SpringPress>
  );
}
function Wizard({
  type,
  setType,
}: {
  type: BusinessType;
  setType: (type: BusinessType) => void;
}) {
  const { add } = useLocalSearchParams<{ add?: string }>();
  const t = useTheme();
  const [step, setStep] = useState(add ? 3 : 0);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const [businessId, setBusinessId] = useState<string>();
  const [error, setError] = useState("");
  const questions = ru.questionSets[type];
  const next = () => {
    setError("");
    setStep((s) => s + 1);
  };
  return (
    <ThemeProvider skinId={step >= 3 ? type : undefined}>
      <Screen header={false}>
        <FadeIn key={step}>
          {step > 0 && step < 7 && (
            <View
              style={{ height: 3, backgroundColor: t.border, borderRadius: 2 }}
            >
              <LinearGradient
                colors={t.gradient}
                style={{
                  height: 3,
                  width: `${(step / 6) * 100}%`,
                  borderRadius: 2,
                }}
              />
            </View>
          )}
          {step > 0 && step < 7 && (
            <SpringPress
              label={ru.back}
              style={{ alignSelf: "flex-start" }}
              onPress={() => {
                setError("");
                if (add && step === 3) router.back();
                else setStep((s) => s - 1);
              }}
            >
              <Row style={{ gap: 4, paddingVertical: 6 }}>
                <Icon name="arrow_back" size={18} />
                <Label bold size={13} color={t.accent}>
                  {ru.back}
                </Label>
              </Row>
            </SpringPress>
          )}
          {!!error && <Label color={t.danger}>{error}</Label>}
          {step === 0 && (
            <View style={{ paddingTop: 48, alignItems: "center", gap: 20 }}>
              <LinearGradient
                colors={t.gradient}
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 28,
                  alignItems: "center",
                  justifyContent: "center",
                  ...t.shadow,
                }}
              >
                <Icon name="storefront" color={t.white} size={36} />
              </LinearGradient>
              <Label display size={26} color={t.accent}>
                OrderIN
              </Label>
              <Label size={15} style={{ textAlign: "center" }}>
                {ru.welcome}
              </Label>
              <Label
                muted
                size={13}
                style={{ textAlign: "center", marginBottom: 28 }}
              >
                {ru.journey}
              </Label>
              <View style={{ gap: 12, alignSelf: "stretch" }}>
                <Button title={ru.login} onPress={next} />
                <Button title={ru.register} secondary onPress={next} />
              </View>
            </View>
          )}
          {step === 1 && (
            <>
              <Label display size={20}>
                {ru.phone}
              </Label>
              <Label muted>{ru.phoneHint}</Label>
              <Row>
                <Label bold>🇰🇿 +7</Label>
                <Field
                  style={{ flex: 1 }}
                  accessibilityLabel={ru.phone}
                  placeholder={ru.phonePlaceholder}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(s) =>
                    setPhone(s.replace(/\D/g, "").slice(0, 10))
                  }
                />
              </Row>
              <Button
                title={ru.getCode}
                disabled={phone.length !== 10}
                onPress={next}
              />
            </>
          )}
          {step === 2 && (
            <>
              <Label display size={20}>
                {ru.code}
              </Label>
              <Label muted>{ru.codeHint}</Label>
              <Field
                accessibilityLabel={ru.code}
                keyboardType="number-pad"
                maxLength={4}
                value={code}
                onChangeText={(s) => setCode(s.replace(/\D/g, ""))}
              />
              <Button
                title={ru.continue}
                onPress={() =>
                  code === "1234" ? next() : setError(ru.badCode)
                }
              />
            </>
          )}
          {step === 3 && (
            <>
              <Label display size={18}>
                {ru.businessQuestion}
              </Label>
              <Label muted size={13}>
                {ru.businessHint}
              </Label>
              <Row style={{ flexWrap: "wrap", gap: 12, alignItems: "stretch" }}>
                {t.skins.map((s) => (
                  <View key={s.id} style={{ width: "48%", flexGrow: 1 }}>
                    <ThemeProvider skinId={s.id}>
                      <BusinessChoice
                        type={s.id}
                        selected={type === s.id}
                        onPress={() => {
                          if (s.id !== type) setBusinessId(undefined);
                          setType(s.id);
                          setAnswers({});
                        }}
                      />
                    </ThemeProvider>
                  </View>
                ))}
              </Row>
              <Button title={ru.continue} onPress={next} />
            </>
          )}
          {step === 4 && (
            <>
              <Label display size={18}>
                {ru.aboutBusiness}
              </Label>
              {questions.map((q, i) => (
                <View key={q.q} style={{ gap: 8 }}>
                  <Label bold>{q.q}</Label>
                  {q.opts.map((opt) => (
                    <Chip
                      key={opt}
                      title={opt}
                      active={answers[String(i)] === opt}
                      onPress={() => setAnswers((a) => ({ ...a, [i]: opt }))}
                    />
                  ))}
                </View>
              ))}
              <Button
                title={ru.next}
                disabled={questions.some((_, i) => !answers[String(i)])}
                onPress={next}
              />
            </>
          )}
          {step === 5 && (
            <>
              <Label display size={18}>
                {ru.connect}
              </Label>
              <Label muted size={13}>
                {ru.connectHint}
              </Label>
              {["instagram", "whatsapp", "kaspi"].map((channel) => (
                <Card key={channel}>
                  <Row>
                    <Icon name={channel === "kaspi" ? "payments" : channel} />
                    <Label bold style={{ flex: 1 }}>
                      {channel === "kaspi"
                        ? "Kaspi Pay"
                        : channel === "instagram"
                          ? ru.instagram
                          : ru.whatsapp}
                    </Label>
                    <Button
                      small
                      secondary
                      title={
                        connections[channel] ? ru.connected : ru.connectAction
                      }
                      onPress={() =>
                        setConnections((c) => ({
                          ...c,
                          [channel]: !c[channel],
                        }))
                      }
                    />
                  </Row>
                </Card>
              ))}
              <Button
                title={ru.continue}
                onPress={() => {
                  // Going back and forth must not create duplicate businesses.
                  if (!businessId) {
                    setBusinessId(
                      useStore
                        .getState()
                        .addBusiness(type, answers, connections, !!add),
                    );
                  }
                  next();
                }}
              />
            </>
          )}
          {step === 6 && (
            <>
              <Label display size={18}>
                {ru.upload}
              </Label>
              <Label muted size={13}>
                {ru.uploadHint}
              </Label>
              {[
                { mode: "invoice", title: ru.camera, icon: "photo_camera" },
                { mode: "excel", title: ru.excel, icon: "table_view" },
                { mode: "manual", title: ru.manual, icon: "edit" },
              ].map((item) => (
                <Button
                  key={item.mode}
                  secondary
                  icon={item.icon}
                  title={item.title}
                  onPress={() =>
                    router.push({
                      pathname: "/import",
                      params: { mode: item.mode, businessId: businessId! },
                    })
                  }
                />
              ))}
              <Button title={ru.continue} onPress={next} />
              <Label muted size={11}>
                {ru.skip}
              </Label>
            </>
          )}
          {step === 7 && (
            <View style={{ paddingTop: 40, gap: 20, alignItems: "center" }}>
              <ProductThumb icon="check_circle" size={96} />
              <Label
                display
                size={22}
                color={t.accent}
                style={{ textAlign: "center" }}
              >
                {ru.ready}
              </Label>
              <Label>{t.skins.find((s) => s.id === type)?.name}</Label>
              <Label muted size={13} style={{ textAlign: "center" }}>
                {ru.journey}
              </Label>
              <Button
                title={ru.start}
                onPress={() => {
                  useStore.getState().completeOnboarding();
                  router.replace("/today");
                }}
              />
            </View>
          )}
        </FadeIn>
      </Screen>
    </ThemeProvider>
  );
}
export default function Onboarding() {
  const [type, setType] = useState<BusinessType>("kofe");
  return (
    <ThemeProvider skinId={type}>
      <Wizard type={type} setType={setType} />
    </ThemeProvider>
  );
}
