import { LearnerLessonPage } from "@/components/learner/lesson-page";

export default async function LessonRoute({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  return <LearnerLessonPage courseId={courseId} lessonId={lessonId} />;
}
