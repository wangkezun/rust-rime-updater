import { useEffect, useState, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { api } from "../lib/tauri";
import type {
  SchemeDefinition,
  ExtraResource,
  DownloadProgress,
  InstalledVersionInfo,
} from "../lib/types";
import { ProgressBar } from "../components/ProgressBar";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ResourceCard({ resource }: { resource: ExtraResource }) {
  const categoryLabel =
    resource.category === "GrammarModel" ? "语法模型" : "预测数据库";
  const categoryColor =
    resource.category === "GrammarModel"
      ? "bg-purple-100 text-purple-700"
      : "bg-blue-100 text-blue-700";

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-md border border-slate-200">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-900">{resource.name}</p>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${categoryColor}`}
          >
            {categoryLabel}
          </span>
          {resource.optional && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
              可选
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">{resource.description}</p>
        <p className="text-xs text-slate-400 mt-1">
          来源: {resource.github_repo} ({resource.release_tag}) |{" "}
          {formatSize(resource.approx_size_bytes)}
        </p>
      </div>
      <button className="ml-3 shrink-0 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
        下载
      </button>
    </div>
  );
}

export function SchemeSelector() {
  const [schemes, setSchemes] = useState<SchemeDefinition[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [installedVersion, setInstalledVersion] =
    useState<InstalledVersionInfo | null>(null);

  const [installing, setInstalling] = useState(false);
  const [installingVariant, setInstallingVariant] = useState<string | null>(
    null,
  );
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);
  const [installSuccess, setInstallSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [schemesData, versionData] = await Promise.allSettled([
          api.listSchemes(),
          api.getInstalledVersion(),
        ]);
        if (schemesData.status === "fulfilled") {
          setSchemes(schemesData.value);
        }
        if (versionData.status === "fulfilled") {
          setInstalledVersion(versionData.value);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const unlisten = listen<DownloadProgress>("download-progress", (event) => {
      setProgress(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    const unlisten = listen<InstalledVersionInfo>(
      "install-complete",
      (event) => {
        setInstalling(false);
        setInstallingVariant(null);
        setProgress(null);
        setInstalledVersion(event.payload);
        setInstallSuccess(
          `${event.payload.variant_id} @ ${event.payload.version} 安装成功`,
        );
      },
    );
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleInstall = useCallback(
    async (schemeId: string, variantId: string, version: string) => {
      setInstalling(true);
      setInstallingVariant(variantId);
      setInstallError(null);
      setInstallSuccess(null);
      setProgress(null);
      try {
        await api.installUpdate(schemeId, variantId, version);
      } catch (err) {
        setInstallError(String(err));
        setInstalling(false);
        setInstallingVariant(null);
        setProgress(null);
      }
    },
    [],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">加载中...</p>
      </div>
    );
  }

  const activeScheme = schemes.find((s) => s.id === selectedScheme);

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">方案管理</h2>

      {installError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          安装失败: {installError}
        </div>
      )}

      {installSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {installSuccess}
        </div>
      )}

      {installing && progress && (
        <div className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-slate-200">
          <p className="text-sm text-slate-600 mb-2">
            正在下载 {installingVariant}...
          </p>
          <ProgressBar
            downloaded={progress.downloaded_bytes}
            total={progress.total_bytes}
            speed={progress.speed_bytes_per_sec}
          />
        </div>
      )}

      <div className="space-y-4">
        {schemes.map((scheme) => {
          const isExpanded = activeScheme?.id === scheme.id;
          const grammarModels = scheme.extra_resources.filter(
            (r) => r.category === "GrammarModel",
          );
          const predictionDbs = scheme.extra_resources.filter(
            (r) => r.category === "PredictionDb",
          );

          return (
            <div
              key={scheme.id}
              className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
            >
              <button
                onClick={() =>
                  setSelectedScheme(
                    selectedScheme === scheme.id ? null : scheme.id,
                  )
                }
                className="w-full p-5 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {scheme.name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {scheme.description}
                    </p>
                    <div className="flex gap-3 text-xs text-slate-400 mt-2">
                      <span>GitHub: {scheme.github_repo}</span>
                      <span>{scheme.variants.length} 个变体</span>
                      {scheme.extra_resources.length > 0 && (
                        <span>
                          {scheme.extra_resources.length} 个附加资源
                        </span>
                      )}
                    </div>
                    {installedVersion &&
                      installedVersion.scheme_id === scheme.id && (
                        <p className="text-xs text-green-600 mt-1">
                          已安装: {installedVersion.variant_id} @{" "}
                          {installedVersion.version}
                        </p>
                      )}
                  </div>
                  <span className="text-slate-400">
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-200 p-5 bg-slate-50 space-y-5">
                  {/* Variants */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-3">
                      输入方案变体
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">
                      选择一个变体进行安装。需要先在仪表盘检查最新版本。
                    </p>
                    <div className="grid gap-2">
                      {scheme.variants.map((variant) => {
                        const isInstalled =
                          installedVersion?.scheme_id === scheme.id &&
                          installedVersion?.variant_id === variant.id;
                        const isThisInstalling =
                          installing && installingVariant === variant.id;

                        return (
                          <div
                            key={variant.id}
                            className={`flex items-center justify-between p-3 bg-white rounded-md border ${isInstalled ? "border-green-300" : "border-slate-200"}`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-900">
                                  {variant.name}
                                </p>
                                {isInstalled && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                                    已安装
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500">
                                {variant.description}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                handleInstall(
                                  scheme.id,
                                  variant.id,
                                  installedVersion?.version || "latest",
                                )
                              }
                              disabled={installing}
                              className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isThisInstalling ? "安装中..." : "安装"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grammar Models */}
                  {grammarModels.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">
                        语法模型
                      </h4>
                      <p className="text-xs text-slate-500 mb-3">
                        语法模型可提升整句输入的准确度，所有变体通用。完整版和精简版二选一即可。
                      </p>
                      <div className="grid gap-2">
                        {grammarModels.map((r) => (
                          <ResourceCard key={r.id} resource={r} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prediction Database */}
                  {predictionDbs.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">
                        预测数据库
                      </h4>
                      <p className="text-xs text-slate-500 mb-3">
                        启用输入预测功能，需要前端支持 librime-predict 插件。
                      </p>
                      <div className="grid gap-2">
                        {predictionDbs.map((r) => (
                          <ResourceCard key={r.id} resource={r} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
