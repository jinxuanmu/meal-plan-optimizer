import { useMealPlanStore } from "@/store/mealPlanStore";

export function Header() {
  const currentDay = useMealPlanStore((s) => s.currentDay);
  const setDay = useMealPlanStore((s) => s.setDay);
  const setDataEditorOpen = useMealPlanStore((s) => s.setDataEditorOpen);

  return (
    <header className="sticky top-0 z-[200] flex flex-wrap items-center justify-between gap-3 border-b border-border bg-white px-6 py-3.5">
      <div className="flex items-center gap-2 text-[15px] font-semibold">
        <span className="inline-block h-2 w-2 rounded-full bg-ui" />
        Meal Plan Optimizer
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setDataEditorOpen(true)}
          className="rounded-md border border-border bg-white px-3 py-1.5 text-[12px] font-medium text-[#1a1917] shadow-sm hover:bg-bg"
        >
          Edit plan / food library
        </button>
        <div className="flex rounded-md border border-border bg-bg p-0.5">
          <button
            type="button"
            onClick={() => setDay("training")}
            className={`rounded px-4 py-1.5 text-[13px] font-medium transition-all ${
              currentDay === "training" ? "bg-white text-[#1a1917] shadow" : "text-[#8a8780]"
            }`}
          >
            Training Day
          </button>
          <button
            type="button"
            onClick={() => setDay("nontraining")}
            className={`rounded px-4 py-1.5 text-[13px] font-medium transition-all ${
              currentDay === "nontraining" ? "bg-white text-[#1a1917] shadow" : "text-[#8a8780]"
            }`}
          >
            Non-Training Day
          </button>
        </div>
      </div>
    </header>
  );
}
