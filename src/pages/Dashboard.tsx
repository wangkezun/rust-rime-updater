import { useEffect, useState } from "react";
import { api } from "../lib/tauri";
import type { SchemeDefinition, RimeDirectoryInfo } from "../lib/types";
import { StatusBadge } from "../components/StatusBadge";

export function Dashboard() {
  const [schemes, setSchemes] = useState<SchemeDefinition[]>([]);
  const [rimeDir, setRimeDir] = useState<RimeDirectoryInfo | null>(null);
  const [rimeDirError, setRimeDirError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        <h3 className="text-sm font-medium text-slate-500 mb-3">
          Rime 环境
        </h3>
        {rimeDir ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge status="ok" label="已检测" />
              <span className="text-sm text-slate-700">
                {rimeDir.platform}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">{rimeDir.path}</p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <StatusBadge status="error" label="未检测到" />
            <span className="text-sm text-slate-600">
              {rimeDirError}
            </span>
          </div>
        )}
      </div>

      {/* Available Schemes */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-4">
        <h3 className="text-sm font-medium text-slate-500 mb-3">
          可用方案
        </h3>
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
                  <h4 className="font-medium text-slate-900">
                    {scheme.name}
                  </h4>
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
        <h3 className="text-sm font-medium text-slate-500 mb-3">
          快捷操作
        </h3>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
            检查更新
          </button>
          <button className="px-4 py-2 text-sm border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors">
            创建备份
          </button>
        </div>
      </div>
    </div>
  );
}
