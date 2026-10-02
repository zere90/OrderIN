import { View } from "react-native";
import { useAiStatus } from "../services/supabaseAi";
import { aiRu } from "../i18n/ru";
import { useTheme } from "../theme";
import { Button, Label } from "./ui";
export function AiStatus({ retry }: { retry?: () => void }) {
  const { demo, busy, error } = useAiStatus();
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {demo && <Label size={10} color={t.warningText}>{aiRu.demo}</Label>}
      {busy > 0 && <Label size={12}>{aiRu.thinking}</Label>}
      {error && (
        <>
          <Label size={12} color={t.warningText}>{aiRu.error}</Label>
          {retry && (
            <Button
              small
              secondary
              title={aiRu.retry}
              disabled={busy > 0}
              onPress={retry}
            />
          )}
        </>
      )}
    </View>
  );
}
