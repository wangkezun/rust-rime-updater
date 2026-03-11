import { invoke } from "@tauri-apps/api/core";
import type {
  SchemeDefinition,
  RimeDirectoryInfo,
  AppConfig,
  UpdateStatus,
  BackupMetadata,
} from "./types";

export const api = {
  listSchemes: () => invoke<SchemeDefinition[]>("list_schemes"),

  getSchemeDetail: (schemeId: string) =>
    invoke<SchemeDefinition>("get_scheme_detail", { schemeId }),

  getSettings: () => invoke<AppConfig>("get_settings"),

  updateSettings: (config: AppConfig) =>
    invoke<void>("update_settings", { config }),

  getRimeDirectory: () => invoke<RimeDirectoryInfo>("get_rime_directory"),

  checkForUpdate: () => invoke<UpdateStatus>("check_for_update"),

  installUpdate: (schemeId: string, variantId: string, version: string) =>
    invoke<void>("install_update", { schemeId, variantId, version }),

  listBackups: () => invoke<BackupMetadata[]>("list_backups"),

  createBackup: (note?: string) =>
    invoke<BackupMetadata>("create_backup", { note: note ?? null }),

  restoreBackup: (backupId: string) =>
    invoke<void>("restore_backup", { backupId }),

  deleteBackup: (backupId: string) =>
    invoke<void>("delete_backup", { backupId }),
};
