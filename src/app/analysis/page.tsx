import { DeepDiveDashboard } from "@/components/deep-dive-dashboard";
import { isDeepDiveDevelopmentMode } from "@/lib/server/security";

export default function AnalysisPage() {
  return <DeepDiveDashboard developmentMode={isDeepDiveDevelopmentMode(process.env)} />;
}
