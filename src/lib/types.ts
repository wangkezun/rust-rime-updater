export interface SchemeDefinition {
  id: string;
  name: string;
  description: string;
  github_repo: string;
  variants: SchemeVariant[];
  extra_resources: ExtraResource[];
}

export interface SchemeVariant {
  id: string;
  name: string;
  asset_pattern: string;
  description: string;
}

export interface ExtraResource {
  id: string;
  name: string;
  description: string;
  category: "GrammarModel" | "PredictionDb";
  github_repo: string;
  release_tag: string;
  asset_name: string;
  approx_size_bytes: number;
  optional: boolean;
  dest_filename: string | null;
}

export interface RimeDirectoryInfo {
  path: string;
  platform: string;
}

export interface AppConfig {
  active_scheme_id?: string;
  active_variant_id?: string;
  rime_dir_override?: string;
  backup_dir_override?: string;
  max_backups: number;
  auto_backup: boolean;
  check_updates_on_launch: boolean;
  github_token?: string;
  proxy_url?: string;
}

export interface BackupMetadata {
  id: string;
  created_at: string;
  trigger: "Manual" | "PreUpdate" | "PreRollback";
  installed_version?: InstalledVersionInfo;
  size_bytes: number;
  file_count: number;
  note?: string;
}

export interface InstalledVersionInfo {
  scheme_id: string;
  variant_id: string;
  version: string;
}

export interface DownloadProgress {
  downloaded_bytes: number;
  total_bytes: number | null;
  speed_bytes_per_sec: number;
}
