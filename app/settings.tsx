import { ConnectionsPanel } from "../src/components/ConnectionsPanel";
import { Screen } from "../src/components/Screen";
import { useState } from "react";
import { router } from "expo-router";
import { useStore } from "../src/store";
import { v2 as ru } from "../src/i18n/ru";
import {
  Card,
  Label,
  Button,
  SegmentedControl,
  BottomSheet,
} from "../src/components/ui";
export default function Settings() {
  const mode = useStore((s) => s.mode);
  const [reset, setReset] = useState(false);
  return (
    <Screen back title={ru.settings} subtitle={ru.profile}>
      <ConnectionsPanel />
      <Card>
        <Label bold>{ru.theme}</Label>
        <SegmentedControl
          value={mode}
          onChange={(m) => useStore.getState().setMode(m as typeof mode)}
          items={(["system", "light", "dark"] as const).map((id) => ({
            id,
            title: ru[id],
          }))}
        />
      </Card>
      <Button
        secondary
        title={ru.allSkins}
        onPress={() => router.push("/skins")}
      />
      <Button secondary title={ru.reset} onPress={() => setReset(true)} />
      <Label muted size={11}>
        {ru.demo}
      </Label>
      <BottomSheet
        visible={reset}
        onClose={() => setReset(false)}
        title={ru.resetTitle}
      >
        <Label>{ru.resetBody}</Label>
        <Button
          title={ru.resetConfirm}
          onPress={() => {
            useStore.getState().reset();
            setReset(false);
            router.replace("/today");
          }}
        />
        <Button title={ru.keep} secondary onPress={() => setReset(false)} />
      </BottomSheet>
    </Screen>
  );
}
