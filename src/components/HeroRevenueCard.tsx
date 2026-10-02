import { useId } from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  RadialGradient,
  Stop,
  Path,
  Circle,
  Rect,
} from "react-native-svg";
import { useTheme } from "../theme";
import { Label, Row, Card } from "./ui";
import { Icon } from "./Icon";
import { money, v2 as ru } from "../i18n/ru";
export function HeroRevenueCard({
  data,
  mini = false,
}: {
  data: number[];
  mini?: boolean;
}) {
  const t = useTheme();
  const id = useId().replace(/:/g, "");
  const today = data.at(-1) || 0;
  const yesterday = data.at(-2) || 0;
  const diff = today - yesterday;
  const min = Math.min(...data);
  const range = Math.max(...data) - min || 1;
  const points = data.map(
    (n, i) =>
      `${(i / (data.length - 1)) * 140},${36 - ((n - min) / range) * 32}`,
  );
  const line = `M ${points.join(" L ")}`;
  const end = points.at(-1)?.split(",") || ["140", "20"];
  return (
    <LinearGradient
      colors={t.gradient}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={{
        borderRadius: mini ? 14 : 24,
        padding: mini ? 12 : 22,
        overflow: "hidden",
        gap: mini ? 4 : 8,
      }}
    >
      <Svg
        width="100%"
        height="100%"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <Defs>
          <RadialGradient id={`${id}mesh`}>
            <Stop offset="0" stopColor={t.second} stopOpacity={0.65} />
            <Stop offset="1" stopColor={t.second} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="85%" cy="15%" r="65%" fill={`url(#${id}mesh)`} />
        <Circle cx="15%" cy="90%" r="45%" fill={`url(#${id}mesh)`} />
      </Svg>
      <Label
        size={mini ? 7 : 11}
        color={t.white}
        bold
        style={{ opacity: 0.7, letterSpacing: 0.5 }}
      >
        {ru.revenueTitle}
      </Label>
      <Label display size={mini ? 14 : 30} color={t.white}>
        {money(today)}
      </Label>
      {!mini && (
        <Label size={12} color={t.white} style={{ opacity: 0.75 }}>
          {diff >= 0 ? "↑" : "↓"}{" "}
          {yesterday ? Math.round((Math.abs(diff) / yesterday) * 100) : 0}%{" "}
          {ru.versus} · {money(Math.abs(diff))}
        </Label>
      )}
      <Svg width={mini ? 80 : 140} height={mini ? 24 : 40} viewBox="0 0 140 40">
        <Defs>
          <SvgGradient id={`${id}area`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.white} stopOpacity={0.3} />
            <Stop offset="1" stopColor={t.white} stopOpacity={0} />
          </SvgGradient>
        </Defs>
        <Path
          d={`M 0,40 L ${points.join(" L ")} L 140,40 Z`}
          fill={`url(#${id}area)`}
        />
        <Path
          d={line}
          stroke={t.white}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={Number(end[0])} cy={Number(end[1])} r={3} fill={t.white} />
      </Svg>
      {!mini && (
        <Row>
          {data.map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - 6 + i);
            return (
              <Label
                key={i}
                size={9}
                color={t.white}
                style={{
                  flex: 1,
                  textAlign: "center",
                  opacity: i === 6 ? 1 : 0.5,
                }}
              >
                {d.toLocaleDateString("ru-RU", { weekday: "short" })}
              </Label>
            );
          })}
        </Row>
      )}
    </LinearGradient>
  );
}
export function StatTile({
  title,
  value,
  icon,
  sub,
}: {
  title: string;
  value: number;
  icon: string;
  sub?: string;
}) {
  const t = useTheme();
  return (
    <Card style={{ flex: 1, padding: 14, borderColor: t.tint, gap: 4 }}>
      <Row style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <Icon name={icon} size={18} color={t.second} />
        {sub && (
          <Label size={9} color={t.accent}>
            {sub}
          </Label>
        )}
      </Row>
      <Label display size={26} color={t.accent}>
        {value}
      </Label>
      <Label muted size={11} bold>
        {title}
      </Label>
    </Card>
  );
}
