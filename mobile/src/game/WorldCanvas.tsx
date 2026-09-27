import { Canvas, Circle, Group, Line, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import { StyleSheet, View } from "react-native";
import { colors } from "@/ui/theme";

export interface WorldPosition { x: number; y: number }

interface WorldCanvasProps {
  height: number;
  position: WorldPosition;
  width: number;
}

export function WorldCanvas({ height, position, width }: WorldCanvasProps) {
  const px = position.x * width;
  const py = position.y * height;
  return (
    <View accessibilityLabel="네이티브 게임 월드" style={[styles.frame, { height, width }]}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Rect height={height} width={width}>
          <LinearGradient colors={["#143c38", "#09272a"]} end={vec(width, height)} start={vec(0, 0)} />
        </Rect>
        <Rect color={colors.path} height={height * 0.22} width={width} x={0} y={height * 0.4} />
        <Rect color="#1e5146" height={height * 0.3} width={width * 0.18} x={width * 0.68} y={0} />
        <Circle color="#164759" cx={width * 0.78} cy={height * 0.22} r={Math.min(width, height) * 0.11} />
        <Circle color="#60d8cc" cx={width * 0.78} cy={height * 0.22} r={Math.min(width, height) * 0.075} />
        {Array.from({ length: 8 }, (_, index) => (
          <Group key={index}>
            <Rect color="#0b211d" height={height * 0.13} width={width * 0.035} x={width * (0.05 + index * 0.12)} y={height * (index % 2 ? 0.7 : 0.08)} />
            <Circle color="#276148" cx={width * (0.067 + index * 0.12)} cy={height * (index % 2 ? 0.69 : 0.07)} r={height * 0.075} />
          </Group>
        ))}
        <Line color="#c7a46d" p1={vec(width * 0.12, height * 0.51)} p2={vec(width * 0.9, height * 0.51)} strokeWidth={3} />
        <Circle color={colors.amber} cx={width * 0.83} cy={height * 0.5} r={height * 0.055} />
        <Circle color="#fff2a6" cx={width * 0.83} cy={height * 0.5} r={height * 0.025} />
        <Group>
          <Rect color="#102a45" height={height * 0.09} width={height * 0.08} x={px - height * 0.04} y={py - height * 0.01} />
          <Circle color={colors.cyan} cx={px} cy={py - height * 0.035} r={height * 0.035} />
          <Rect color="#e6f7ff" height={height * 0.018} width={height * 0.05} x={px - height * 0.025} y={py - height * 0.04} />
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderColor: colors.cyan, borderRadius: 12, borderWidth: 2, overflow: "hidden" },
});
