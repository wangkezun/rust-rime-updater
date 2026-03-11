import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/tauri";
import type { AppConfig, RimeDirectoryInfo } from "../lib/types";

export function Settings() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [rimeDir, setRimeDir] = useState<RimeDirectoryInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [configData, dirData] = await Promise.allSettled([
          api.getSettings(),
          api.getRimeDirectory(),
        ]);

        if (configData.status === "fulfilled") {
          setConfig(configData.value);
        }
        if (dirData.status === "fulfilled") {
          setRimeDir(dirData.value);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const updateField = useCallback(
    (updates: Partial<AppConfig>) => {
      if (!config) return;
      setConfig({ ...config, ...updates });
      setDirty(true);
      setMessage(null);
    },
    [config],
  );

  const handleSave = useCallback(async () => {
    if (!config) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.updateSettings(config);
      setMessage("设置已保存");
      setDirty(false);
    } catch (err) {
      setMessage(`保存失败: ${String(err)}`);
    } finally {
      setSaving(false);
    }
  }, [config]);

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">设置</h2>
        <div className="flex items-center gap-3">
          {message && (
            <span className="text-sm text-slate-600">{message}</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "保存中..." : "保存设置"}
          </button>
        </div>
      </div>

      {/* Rime Directory */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-4">
        <h3 className="text-sm font-medium text-slate-500 mb-3">
          Rime 用户目录
        </h3>
        {rimeDir ? (
          <div>
            <p className="text-sm text-slate-700">
              自动检测: <span className="font-mono">{rimeDir.path}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">{rimeDir.platform}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">未检测到 Rime 目录</p>
        )}
        <div className="mt-3">
          <label className="text-sm text-slate-600">自定义目录 (可选)</label>
          <input
            type="text"
            value={config.rime_dir_override || ""}
            onChange={(e) =>
              updateField({
                rime_dir_override: e.target.value || undefined,
              })
            }
            placeholder="留空则使用自动检测的目录"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {/* Backup Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-4">
        <h3 className="text-sm font-medium text-slate-500 mb-3">备份设置</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={config.auto_backup}
              onChange={(e) => updateField({ auto_backup: e.target.checked })}
              className="rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">更新前自动备份</span>
          </label>
          <div>
            <label className="text-sm text-slate-600">最大备份数量</label>
            <input
              type="number"
              value={config.max_backups}
              onChange={(e) =>
                updateField({
                  max_backups: parseInt(e.target.value) || 10,
                })
              }
              min={1}
              max={50}
              className="mt-1 block w-24 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Update Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-4">
        <h3 className="text-sm font-medium text-slate-500 mb-3">更新设置</h3>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={config.check_updates_on_launch}
            onChange={(e) =>
              updateField({ check_updates_on_launch: e.target.checked })
            }
            className="rounded border-slate-300"
          />
          <span className="text-sm text-slate-700">启动时检查更新</span>
        </label>
      </div>

      {/* Network Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
        <h3 className="text-sm font-medium text-slate-500 mb-3">网络设置</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-600">
              GitHub Token (可选，提高 API 速率限制)
            </label>
            <input
              type="password"
              value={config.github_token || ""}
              onChange={(e) =>
                updateField({
                  github_token: e.target.value || undefined,
                })
              }
              placeholder="ghp_..."
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">代理地址 (可选)</label>
            <input
              type="text"
              value={config.proxy_url || ""}
              onChange={(e) =>
                updateField({
                  proxy_url: e.target.value || undefined,
                })
              }
              placeholder="http://127.0.0.1:7890"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
