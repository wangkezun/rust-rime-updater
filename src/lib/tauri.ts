import { invoke } from "@tauri-apps/api/core";
import type {
  SchemeDefinition,
  RimeDirectoryInfo,
  AppConfig,
} from "./types";

export const api = {
  listSchemes: () => invoke<SchemeDefinition[]>("list_schemes"),

  getSchemeDetail: (schemeId: string) =>
    invoke<SchemeDefinition>("get_scheme_detail", { schemeId }),

  getSettings: () => invoke<AppConfig>("get_settings"),

  updateSettings: (config: AppConfig) =>
    invoke<void>("update_settings", { config }),

  getRimeDirectory: () => invoke<RimeDirectoryInfo>("get_rime_directory"),

  checkForUpdate: () => invoke<string>("check_for_update"),

  listBackups: () => invoke<string[]>("list_backups"),
};
