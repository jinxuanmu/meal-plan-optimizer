import { Analytics } from "@vercel/analytics/react";
import { DataEditorModal } from "@/components/DataEditorModal";
import { Header } from "@/components/Header";
import { Step1 } from "@/components/Step1";
import { Step2V2 } from "@/components/Step2V2";
import { Step3V2 } from "@/components/Step3V2";
import { StepBar } from "@/components/StepBar";
import { useMealPlanStore } from "@/store/mealPlanStore";

export default function App() {
  const step = useMealPlanStore((s) => s.step);

  return (
    <div className="min-h-screen">
      <Header />
      <DataEditorModal />
      <StepBar />
      {step === 1 && <Step1 />}
      {step === 2 && <Step2V2 />}
      {step === 3 && <Step3V2 />}
      <Analytics />
    </div>
  );
}
