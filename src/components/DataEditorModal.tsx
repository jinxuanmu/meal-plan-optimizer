import { FoodLibEditor } from "@/components/FoodLibEditor";
import { PlanDayEditor } from "@/components/PlanDayEditor";
import { useMealPlanStore } from "@/store/mealPlanStore";

export function DataEditorModal() {
  const open = useMealPlanStore((s) => s.dataEditorOpen);
  const setOpen = useMealPlanStore((s) => s.setDataEditorOpen);
  const tab = useMealPlanStore((s) => s.dataEditorTab);
  const setTab = useMealPlanStore((s) => s.setDataEditorTab);
  const resetDataToDefaults = useMealPlanStore((s) => s.resetDataToDefaults);

  if (!open) return null;

  const confirmReset = () => {
    if (window.confirm("Reset to built-in default meal plans and food library? Your custom data will be overwritten.")) {
      resetDataToDefaults();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[400] flex justify-center overflow-y-auto bg-black/40 px-4 py-6"
      onClick={() => setOpen(false)}
      role="presentation"
    >
      <div
        className="my-auto w-full max-w-5xl rounded-lg border border-border bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="data-editor-title"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 id="data-editor-title" className="text-base font-semibold text-[#1a1917]">
            Meal plan & food library
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-ghost py-1.5 text-[12px] text-rose-700" onClick={confirmReset}>
              Reset to defaults
            </button>
            <button type="button" className="btn-primary py-1.5" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </div>
        <div className="flex border-b border-border px-5">
          <button
            type="button"
            onClick={() => setTab("plan")}
            className={`border-b-2 px-4 py-3 text-[13px] font-medium transition-colors ${
              tab === "plan" ? "border-ui text-ui" : "border-transparent text-[#8a8780] hover:text-[#1a1917]"
            }`}
          >
            Meal plan
          </button>
          <button
            type="button"
            onClick={() => setTab("foodlib")}
            className={`border-b-2 px-4 py-3 text-[13px] font-medium transition-colors ${
              tab === "foodlib" ? "border-ui text-ui" : "border-transparent text-[#8a8780] hover:text-[#1a1917]"
            }`}
          >
            Food library
          </button>
        </div>
        <div className="max-h-[min(78vh,900px)] overflow-y-auto p-5">
          {tab === "plan" ? <PlanDayEditor /> : <FoodLibEditor />}
        </div>
        <p className="border-t border-border bg-bg px-5 py-2.5 text-[11px] text-[#8a8780]">
          Changes are saved automatically to localStorage (key meal-plan-optimizer-v1).
        </p>
      </div>
    </div>
  );
}
