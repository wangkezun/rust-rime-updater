import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/tauri";
import type { BackupMetadata } from "../lib/types";
import { ConfirmDialog } from "../components/ConfirmDialog";

export function BackupManager() {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadBackups = useCallback(async () => {
    try {
      const data = await api.listBackups();
      setBackups(data);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  const handleCreateBackup = useCallback(async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const meta = await api.createBackup();
      setMessage(
        `备份创建成功 (${meta.file_count} 个文件, ${formatSize(meta.size_bytes)})`,
      );
      await loadBackups();
    } catch (err) {
      setMessage(`备份失败: ${String(err)}`);
    } finally {
      setActionLoading(false);
    }
  }, [loadBackups]);

  const handleRestore = useCallback(
    async (backupId: string) => {
      setConfirmRestore(null);
      setActionLoading(true);
      setMessage(null);
      try {
        await api.restoreBackup(backupId);
        setMessage("恢复成功");
        await loadBackups();
      } catch (err) {
        setMessage(`恢复失败: ${String(err)}`);
      } finally {
        setActionLoading(false);
      }
    },
    [loadBackups],
  );

  const handleDelete = useCallback(
    async (backupId: string) => {
      setConfirmDelete(null);
      setActionLoading(true);
      setMessage(null);
      try {
        await api.deleteBackup(backupId);
        setMessage("备份已删除");
        await loadBackups();
      } catch (err) {
        setMessage(`删除失败: ${String(err)}`);
      } finally {
        setActionLoading(false);
      }
    },
    [loadBackups],
  );

  const triggerLabel = (trigger: BackupMetadata["trigger"]): string => {
    switch (trigger) {
      case "Manual":
        return "手动";
      case "PreUpdate":
        return "更新前";
      case "PreRollback":
        return "回滚前";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">备份管理</h2>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-slate-500">备份列表</h3>
          <button
            onClick={handleCreateBackup}
            disabled={actionLoading}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? "处理中..." : "创建备份"}
          </button>
        </div>

        {message && (
          <p className="text-sm text-slate-600 mb-3 bg-slate-50 rounded p-2">
            {message}
          </p>
        )}

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        {backups.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">暂无备份</p>
            <p className="text-xs mt-1">更新方案前会自动创建备份</p>
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className="p-3 rounded-md bg-slate-50 border border-slate-100"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">
                        {formatDate(backup.created_at)}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded">
                        {triggerLabel(backup.trigger)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {backup.file_count} 个文件 |{" "}
                      {formatSize(backup.size_bytes)}
                    </p>
                    {backup.installed_version && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {backup.installed_version.scheme_id} /{" "}
                        {backup.installed_version.variant_id} @{" "}
                        {backup.installed_version.version}
                      </p>
                    )}
                    {backup.note && (
                      <p className="text-xs text-slate-500 mt-1 italic">
                        {backup.note}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmRestore(backup.id)}
                      disabled={actionLoading}
                      className="px-3 py-1 text-xs border border-indigo-300 text-indigo-600 rounded hover:bg-indigo-50 transition-colors disabled:opacity-50"
                    >
                      恢复
                    </button>
                    <button
                      onClick={() => setConfirmDelete(backup.id)}
                      disabled={actionLoading}
                      className="px-3 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmRestore && (
        <ConfirmDialog
          title="确认恢复"
          message="将从此备份恢复 Rime 配置，当前配置会先自动备份。是否继续？"
          onConfirm={() => handleRestore(confirmRestore)}
          onCancel={() => setConfirmRestore(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="确认删除"
          message="删除后无法恢复此备份。是否继续？"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
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

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
