// Draft service for backend integration
import type { TaskFormData } from '../features/educator-experience/types';

export interface DraftTask {
  id: number;
  title: string;
  dueDate: number;
  submissions: number;
  timeLeft: string;
  clarityScore: number;
  isDraft: boolean;
  formData?: TaskFormData;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SaveDraftRequest {
  taskId?: number;
  formData: TaskFormData;
  title: string;
}

export interface SaveDraftResponse {
  success: boolean;
  taskId: number;
  message: string;
}

// Mock service functions - replace with actual API calls when backend is ready
export const draftService = {
  // Save draft to backend
  async saveDraft(request: SaveDraftRequest): Promise<SaveDraftResponse> {
    // TODO: Replace with actual API call
    // Example: const response = await fetch('/api/drafts', { method: 'POST', body: JSON.stringify(request) });
    
    console.log('Saving draft to backend:', request);
    
    // Mock response
    return {
      success: true,
      taskId: request.taskId || Date.now(),
      message: request.taskId ? 'Draft updated successfully' : 'Draft saved successfully'
    };
  },

  // Get all drafts from backend
  async getDrafts(): Promise<DraftTask[]> {
    // TODO: Replace with actual API call
    // Example: const response = await fetch('/api/drafts');
    
    console.log('Fetching drafts from backend');
    
    // Mock response
    return [];
  },

  // Delete draft from backend
  async deleteDraft(taskId: number): Promise<boolean> {
    // TODO: Replace with actual API call
    // Example: const response = await fetch(`/api/drafts/${taskId}`, { method: 'DELETE' });
    
    console.log('Deleting draft from backend:', taskId);
    
    // Mock response
    return true;
  },

  // Update draft in backend
  async updateDraft(taskId: number, request: SaveDraftRequest): Promise<SaveDraftResponse> {
    // TODO: Replace with actual API call
    // Example: const response = await fetch(`/api/drafts/${taskId}`, { method: 'PUT', body: JSON.stringify(request) });
    
    console.log('Updating draft in backend:', taskId, request);
    
    // Mock response
    return {
      success: true,
      taskId,
      message: 'Draft updated successfully'
    };
  }
};
