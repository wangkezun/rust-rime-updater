import { useEffect, useState } from "react";
import { api } from "../lib/tauri";
import type { SchemeDefinition, ExtraResource } from "../lib/types";

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

  useEffect(() => {
    api.listSchemes().then((data) => {
      setSchemes(data);
      setLoading(false);
    });
  }, []);

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

      <div className="space-y-4">
        {schemes.map((scheme) => {
          const isExpanded = activeScheme?.id === scheme.id;
          const grammarModels = scheme.extra_resources.filter(
            (r) => r.category === "GrammarModel"
          );
          const predictionDbs = scheme.extra_resources.filter(
            (r) => r.category === "PredictionDb"
          );

          return (
            <div
              key={scheme.id}
              className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
            >
              <button
                onClick={() =>
                  setSelectedScheme(
                    selectedScheme === scheme.id ? null : scheme.id
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
                    <div className="grid gap-2">
                      {scheme.variants.map((variant) => (
                        <div
                          key={variant.id}
                          className="flex items-center justify-between p-3 bg-white rounded-md border border-slate-200"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {variant.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {variant.description}
                            </p>
                          </div>
                          <button className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                            安装
                          </button>
                        </div>
                      ))}
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
