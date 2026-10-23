import { CourseWizard } from "@/components/creator/wizard/wizard";
import type { CourseStage } from "@/lib/services/courses";

const VALID_STAGES: CourseStage[] = ["details", "curriculum", "pricing", "review"];

export default async function EditCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ stage?: string }>;
}) {
  const { courseId } = await params;
  const { stage } = await searchParams;
  const initialStage = VALID_STAGES.includes(stage as CourseStage)
    ? (stage as CourseStage)
    : "details";
  return <CourseWizard courseId={courseId} initialStage={initialStage} />;
}
