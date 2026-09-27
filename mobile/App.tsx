import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SaveProvider } from "@/state/SaveProvider";
import { NativeGame } from "@/game/NativeGame";

export default function App() {
  return (
    <SafeAreaProvider>
      <SaveProvider>
        <StatusBar hidden />
        <NativeGame />
      </SaveProvider>
    </SafeAreaProvider>
  );
}
