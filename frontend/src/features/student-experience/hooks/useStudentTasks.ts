import { useEffect, useState, useCallback } from 'react';
import type { StudentTask } from '../types/studentTask';
import { enrollTask, fetchEnrolledTasks, saveSubmission, submitFinal } from '../services/studentTaskService';
import type { EnrollPayload, SubmissionPayload } from '../types/studentTask';

interface UseStudentTasksResult {
  tasks: StudentTask[];
  loading: boolean;
  enroll: (payload: EnrollPayload) => Promise<StudentTask | undefined>;
  refresh: () => Promise<void>;
  saveDraft: (taskId: string, submission: SubmissionPayload) => Promise<StudentTask | undefined>;
  submitTask: (taskId: string) => Promise<StudentTask | undefined>;
}

export function useStudentTasks(): UseStudentTasksResult {
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetchEnrolledTasks();
    setTasks(response);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleEnroll = async (payload: EnrollPayload) => {
    const newTask = await enrollTask(payload);
    await load();
    return newTask;
  };

  const handleSave = async (taskId: string, submission: SubmissionPayload) => {
    const updated = await saveSubmission(taskId, submission);
    await load();
    return updated;
  };

  const handleSubmit = async (taskId: string) => {
    const updated = await submitFinal(taskId);
    await load();
    return updated;
  };

  return {
    tasks,
    loading,
    enroll: handleEnroll,
    refresh: load,
    saveDraft: handleSave,
    submitTask: handleSubmit,
  };
}
