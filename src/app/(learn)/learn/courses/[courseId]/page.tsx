import { LearnerCoursePage } from "@/components/learner/course-page";

export default async function CourseDetailRoute({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return <LearnerCoursePage courseId={courseId} />;
}
