import { useEffect, useState, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { api } from "../lib/tauri";
import type {
  SchemeDefinition,
  RimeDirectoryInfo,
  UpdateStatus,
  DownloadProgress,
} from "../lib/types";
import { StatusBadge } from "../components/StatusBadge";
import { ProgressBar } from "../components/ProgressBar";

export function Dashboard() {
  const [schemes, setSchemes] = useState<SchemeDefinition[]>([]);
  const [rimeDir, setRimeDir] = useState<RimeDirectoryInfo | null>(null);
  const [rimeDirError, setRimeDirError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);

  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [schemesData, dirData] = await Promise.allSettled([
          api.listSchemes(),
          api.getRimeDirectory(),
        ]);

        if (schemesData.status === "fulfilled") {
          setSchemes(schemesData.value);
        }
        if (dirData.status === "fulfilled") {
          setRimeDir(dirData.value);
        } else {
          setRimeDirError("未检测到 Rime 用户目录");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Listen for download progress events
  useEffect(() => {
    const unlisten = listen<DownloadProgress>("download-progress", (event) => {
      setProgress(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // Listen for install complete events
  useEffect(() => {
    const unlisten = listen("install-complete", () => {
      setInstalling(false);
      setProgress(null);
      setUpdateStatus({ type: "UpToDate" });
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleCheckUpdate = useCallback(async () => {
    setChecking(true);
    setCheckError(null);
    try {
      const status = await api.checkForUpdate();
      setUpdateStatus(status);
    } catch (err) {
      setCheckError(String(err));
    } finally {
      setChecking(false);
    }
  }, []);

  const handleInstallUpdate = useCallback(
    async (schemeId: string, variantId: string, version: string) => {
      setInstalling(true);
      setInstallError(null);
      setProgress(null);
      try {
        await api.installUpdate(schemeId, variantId, version);
      } catch (err) {
        setInstallError(String(err));
        setInstalling(false);
        setProgress(null);
      }
    },
    [],
  );

  const handleCreateBackup = useCallback(async () => {
    setBackupLoading(true);
    setBackupMessage(null);
    try {
      const meta = await api.createBackup();
      setBackupMessage(
        `备份创建成功 (${meta.file_count} 个文件, ${formatSize(meta.size_bytes)})`,
      );
    } catch (err) {
      setBackupMessage(`备份失败: ${String(err)}`);
    } finally {
      setBackupLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">仪表盘</h2>

      {/* Rime Directory Status */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-4">
        <h3 className="text-sm font-medium text-slate-500 mb-3">Rime 环境</h3>
        {rimeDir ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge status="ok" label="已检测" />
              <span className="text-sm text-slate-700">{rimeDir.platform}</span>
            </div>
            <p className="text-xs text-slate-500 font-mono">{rimeDir.path}</p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <StatusBadge status="error" label="未检测到" />
            <span className="text-sm text-slate-600">{rimeDirError}</span>
          </div>
        )}
      </div>

      {/* Update Status */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-4">
        <h3 className="text-sm font-medium text-slate-500 mb-3">更新状态</h3>

        {updateStatus?.type === "UpToDate" && (
          <div className="flex items-center gap-2 mb-3">
            <StatusBadge status="ok" label="已是最新" />
            <span className="text-sm text-slate-600">当前已是最新版本</span>
          </div>
        )}

        {updateStatus?.type === "UpdateAvailable" && (
          <div className="mb-3 space-y-3">
            <div className="flex items-center gap-2">
              <StatusBadge status="warning" label="有更新" />
              <span className="text-sm text-slate-700">
                {updateStatus.current
                  ? `${updateStatus.current} → ${updateStatus.latest}`
                  : `最新版本: ${updateStatus.latest}`}
              </span>
            </div>

            {updateStatus.release.body && (
              <div className="bg-slate-50 rounded p-3 text-xs text-slate-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
                {updateStatus.release.body.slice(0, 500)}
              </div>
            )}

            {!installing && schemes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {schemes[0].variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() =>
                      handleInstallUpdate(
                        schemes[0].id,
                        variant.id,
                        updateStatus.latest,
                      )
                    }
                    className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    安装 {variant.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {installing && progress && (
          <div className="mb-3">
            <ProgressBar
              downloaded={progress.downloaded_bytes}
              total={progress.total_bytes}
              speed={progress.speed_bytes_per_sec}
            />
          </div>
        )}

        {installing && !progress && (
          <p className="text-sm text-slate-500 mb-3">正在准备安装...</p>
        )}

        {checkError && (
          <p className="text-sm text-red-500 mb-3">{checkError}</p>
        )}

        {installError && (
          <p className="text-sm text-red-500 mb-3">安装失败: {installError}</p>
        )}

        {!updateStatus && !checking && (
          <p className="text-sm text-slate-400 mb-3">点击下方按钮检查更新</p>
        )}
      </div>

      {/* Available Schemes */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-4">
        <h3 className="text-sm font-medium text-slate-500 mb-3">可用方案</h3>
        {schemes.length === 0 ? (
          <p className="text-sm text-slate-400">暂无可用方案</p>
        ) : (
          <div className="space-y-3">
            {schemes.map((scheme) => (
              <div
                key={scheme.id}
                className="flex items-start justify-between p-3 rounded-md bg-slate-50"
              >
                <div>
                  <h4 className="font-medium text-slate-900">{scheme.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {scheme.description}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {scheme.variants.length} 个变体
                    {scheme.extra_resources.length > 0 &&
                      ` | ${scheme.extra_resources.length} 个附加资源 (语法模型/预测数据库)`}
                  </p>
                </div>
                <StatusBadge status="unknown" label="未安装" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
        <h3 className="text-sm font-medium text-slate-500 mb-3">快捷操作</h3>
        <div className="flex gap-3">
          <button
            onClick={handleCheckUpdate}
            disabled={checking || installing}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checking ? "检查中..." : "检查更新"}
          </button>
          <button
            onClick={handleCreateBackup}
            disabled={backupLoading || installing}
            className="px-4 py-2 text-sm border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {backupLoading ? "备份中..." : "创建备份"}
          </button>
        </div>
        {backupMessage && (
          <p className="text-sm text-slate-600 mt-2">{backupMessage}</p>
        )}
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
