export function BackupManager() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">备份管理</h2>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-slate-500">备份列表</h3>
          <button className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
            创建备份
          </button>
        </div>
        <div className="text-center py-12 text-slate-400">
          <p className="text-sm">暂无备份</p>
          <p className="text-xs mt-1">更新方案前会自动创建备份</p>
        </div>
      </div>
    </div>
  );
}
