import { messagingErrorText } from "../services/metaApi";
import { useEffect, useRef, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useBusiness } from "../store";
import { aiConfigured, deviceSession } from "../services/supabase";
import { ChannelConnection, connectionsService } from "../services/connections";
import { metaRu } from "../i18n/ru";
import { Button, Card, Label } from "./ui";
import { useTheme } from "../theme";
WebBrowser.maybeCompleteAuthSession();
export function ConnectionsPanel() {
  const b = useBusiness();
  const t = useTheme();
  const [channels, setChannels] = useState<ChannelConnection[]>([]);
  const [seller, setSeller] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const scope = useRef(b.id);
  scope.current = b.id;
  const redirect = Linking.createURL("/oauth/meta");
  async function load() {
    if (!aiConfigured) return;
    const current = b.id;
    setBusy(true);
    try {
      const id = await connectionsService.ensureBusiness(b);
      setSeller(await deviceSession());
      const result = await connectionsService.list(id);
      if (current === scope.current) setChannels(result);
      setError("");
    } catch (e) {
      setError(messagingErrorText(e));
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    setChannels([]);
    void load();
  }, [b.id]);
  async function connect(type: "instagram" | "whatsapp") {
    setBusy(true);
    setError("");
    try {
      const id = await connectionsService.ensureBusiness(b);
      if (type === "whatsapp") await connectionsService.whatsapp(id);
      else {
        const { url } = await connectionsService.instagram(id, redirect);
        await WebBrowser.openAuthSessionAsync(url, redirect);
      }
      await load();
    } catch (e) {
      setError(messagingErrorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <Label bold>{metaRu.title}</Label>
      <Label color={t.accent}>{aiConfigured ? metaRu.live : metaRu.demo}</Label>
      {aiConfigured && (
        <>
          <Label muted size={11}>{metaRu.sessionHint}</Label>
          {!!seller && <Label size={10}>{metaRu.seller}: {seller}</Label>}
          <Label size={10}>{metaRu.redirect}: {redirect}</Label>
          {channels.map((ch) => (
            <Label key={ch.id}>
              {ch.type} · {ch.display_name} ·{" "}
              {metaRu.status[ch.status] || ch.status}
            </Label>
          ))}
          {!!error && <Label color={t.danger}>{error}</Label>}
          <Button
            title={metaRu.connectInstagram}
            disabled={busy}
            onPress={() => void connect("instagram")}
          />
          <Button
            title={metaRu.connectWhatsapp}
            disabled={busy}
            onPress={() => void connect("whatsapp")}
          />
          <Button
            secondary
            title={metaRu.refresh}
            disabled={busy}
            onPress={() => void load()}
          />
          <Label muted size={11}>{metaRu.browserHint}</Label>
        </>
      )}
    </Card>
  );
}
