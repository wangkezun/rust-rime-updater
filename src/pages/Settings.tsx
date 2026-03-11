import { useEffect, useState } from "react";
import { api } from "../lib/tauri";
import type { AppConfig, RimeDirectoryInfo } from "../lib/types";

export function Settings() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [rimeDir, setRimeDir] = useState<RimeDirectoryInfo | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">设置</h2>

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
      </div>

      {/* Backup Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-4">
        <h3 className="text-sm font-medium text-slate-500 mb-3">
          备份设置
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={config.auto_backup}
              onChange={(e) =>
                setConfig({ ...config, auto_backup: e.target.checked })
              }
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
                setConfig({
                  ...config,
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
        <h3 className="text-sm font-medium text-slate-500 mb-3">
          更新设置
        </h3>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={config.check_updates_on_launch}
            onChange={(e) =>
              setConfig({
                ...config,
                check_updates_on_launch: e.target.checked,
              })
            }
            className="rounded border-slate-300"
          />
          <span className="text-sm text-slate-700">启动时检查更新</span>
        </label>
      </div>

      {/* Network Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
        <h3 className="text-sm font-medium text-slate-500 mb-3">
          网络设置
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-600">
              GitHub Token (可选，提高 API 速率限制)
            </label>
            <input
              type="password"
              value={config.github_token || ""}
              onChange={(e) =>
                setConfig({
                  ...config,
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
                setConfig({
                  ...config,
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
