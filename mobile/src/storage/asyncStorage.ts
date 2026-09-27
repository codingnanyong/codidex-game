import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncSaveStorage } from "./saveStorage";

export const mobileSaveStorage = createAsyncSaveStorage(AsyncStorage);
