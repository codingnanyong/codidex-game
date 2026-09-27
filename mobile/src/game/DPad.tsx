import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, font } from "@/ui/theme";
import type { WorldPosition } from "./WorldCanvas";

interface DPadProps { onMove(delta: WorldPosition): void }

export function DPad({ onMove }: DPadProps) {
  return (
    <View accessibilityLabel="이동 방향키" style={styles.pad}>
      <PadButton label="위" symbol="▲" style={styles.up} onPress={() => onMove({ x: 0, y: -0.06 })} />
      <PadButton label="왼쪽" symbol="◀" style={styles.left} onPress={() => onMove({ x: -0.05, y: 0 })} />
      <View style={styles.center} />
      <PadButton label="오른쪽" symbol="▶" style={styles.right} onPress={() => onMove({ x: 0.05, y: 0 })} />
      <PadButton label="아래" symbol="▼" style={styles.down} onPress={() => onMove({ x: 0, y: 0.06 })} />
    </View>
  );
}

function PadButton({ label, onPress, style, symbol }: { label: string; onPress(): void; style: object; symbol: string }) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.button, style, pressed && styles.pressed]}>
      <Text style={styles.symbol}>{symbol}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pad: { height: 102, position: "relative", width: 102 },
  button: { alignItems: "center", backgroundColor: colors.panelRaised, borderColor: colors.cyan, borderRadius: 8, borderWidth: 1, height: 34, justifyContent: "center", position: "absolute", width: 34 },
  pressed: { backgroundColor: colors.cyan },
  symbol: { color: colors.text, fontFamily: font, fontSize: 18 },
  up: { left: 34, top: 0 },
  left: { left: 0, top: 34 },
  center: { backgroundColor: colors.panelRaised, height: 34, left: 34, position: "absolute", top: 34, width: 34 },
  right: { left: 68, top: 34 },
  down: { left: 34, top: 68 },
});
