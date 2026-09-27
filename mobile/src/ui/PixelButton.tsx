import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, type PressableProps } from "react-native";
import { colors, font } from "./theme";

interface PixelButtonProps extends PropsWithChildren, Pick<PressableProps, "accessibilityLabel" | "disabled" | "onPress"> {
  compact?: boolean;
  variant?: "primary" | "secondary" | "quiet" | "danger";
}

export function PixelButton({ accessibilityLabel, children, compact = false, disabled, onPress, variant = "primary" }: PixelButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled ?? false }}
      disabled={disabled ?? false}
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles[variant], compact && styles.compact, disabled && styles.disabled, pressed && styles.pressed]}
    >
      <Text style={[styles.label, variant === "primary" && styles.primaryLabel]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", borderRadius: 8, borderWidth: 2, justifyContent: "center", minHeight: 48, paddingHorizontal: 18, paddingVertical: 10 },
  compact: { minHeight: 38, paddingHorizontal: 12, paddingVertical: 6 },
  primary: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  secondary: { backgroundColor: colors.panelRaised, borderColor: colors.border },
  quiet: { backgroundColor: "transparent", borderColor: colors.border },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.72, transform: [{ translateY: 2 }] },
  label: { color: colors.text, fontFamily: font, fontSize: 13, fontWeight: "700", textAlign: "center" },
  primaryLabel: { color: colors.background },
});
