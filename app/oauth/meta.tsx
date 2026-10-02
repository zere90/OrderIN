import * as WebBrowser from "expo-web-browser";
WebBrowser.maybeCompleteAuthSession();
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "../../src/components/Screen";
import { Button, Label } from "../../src/components/ui";
import { metaRu } from "../../src/i18n/ru";
export default function MetaCallback() {
  const { meta } = useLocalSearchParams<{ meta?: string }>();
  return (
    <Screen title={metaRu.title}>
      <Label>
        {meta === "connected" ? metaRu.oauthSuccess : metaRu.oauthFailure}
      </Label>
      <Button
        title={metaRu.goBack}
        onPress={() => router.replace("/settings")}
      />
    </Screen>
  );
}
