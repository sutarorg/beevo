"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getCourseService } from "@/lib/services/courses";
import { FailedState } from "@/components/creator/ui";
import { FullPageLoader, UnavailablePanel } from "@/components/states";
import { Button } from "@/components/ui/button";

/**
 * Create Course entry point: requests a fresh draft through the course
 * service and opens the editor for it. The draft already exists in the
 * service from here on — leaving and resuming later works naturally.
 */
export default function NewCoursePage() {
  const router = useRouter();
  const service = getCourseService();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!service || started.current) return;
    started.current = true;
    service.createDraft().then((result) => {
      if (!result.ok) {
        setError(result.error.message);
        started.current = false;
        return;
      }
      router.replace(`/creator/courses/${result.data.id}/edit`);
    });
  }, [service, router, attempt]);

  if (!service) {
    return (
      <UnavailablePanel
        title="Course services aren't connected yet"
        message="Draft creation needs the backend, which connects in Prompt 5."
      />
    );
  }

  if (error) {
    return (
      <div className="space-y-4 pt-6">
        <FailedState
          title="Couldn't create a draft"
          body={error}
          onRetry={() => {
            setError(null);
            setAttempt((n) => n + 1);
          }}
        />
        <Button href="/creator/courses" variant="outline" size="sm">
          Back to My Courses
        </Button>
      </div>
    );
  }

  return <FullPageLoader label="Creating your draft" />;
}
