import { ActivityIndicator, View } from "react-native";
import { useAiStatus } from "../services/supabaseAi";
import { aiRu } from "../i18n/ru";
import { useTheme } from "../theme";
import { Button, Label, Row } from "./ui";
/**
 * Shows whether AI results come from the live backend or the local demo parser,
 * plus a busy indicator and a retry action after a failed request.
 */
export function AiStatus({
  retry,
  hideDemo = false,
}: {
  retry?: () => void;
  hideDemo?: boolean;
}) {
  const { demo, busy, error } = useAiStatus();
  const t = useTheme();
  if (!busy && !error && (!demo || hideDemo)) return null;
  return (
    <View style={{ gap: 6 }}>
      <Row style={{ gap: 6 }}>
        {busy > 0 && <ActivityIndicator size="small" color={t.accent} />}
        <Label size={11} bold color={error ? t.warningText : t.accent}>
          {busy > 0 ? aiRu.thinking : error ? aiRu.error : `✦ AI · ${aiRu.demoLong}`}
        </Label>
      </Row>
      {error && retry && (
        <Button
          small
          secondary
          title={aiRu.retry}
          disabled={busy > 0}
          onPress={retry}
        />
      )}
    </View>
  );
}
