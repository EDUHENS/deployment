'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Sparkles, CheckCircle2, Paperclip, Clipboard, Star, Loader2 } from 'lucide-react';
import type { StudentSubmissionFile, StudentSubmissionLink } from '@/features/student-experience/types/studentTask';
import ModalFrame from '../shared/ModalFrame';
import HappyHensMascot from '../shared/HappyHensMascot';
import SeriousHensMascot from '../shared/SeriousHensMascot';
import SimpleToast from '@/shared/components/ui/SimpleToast';
import { getAIAssessment, type AIAssessment } from '@/features/student-experience/services/studentTaskService';

async function getToken(): Promise<string> {
  const r = await fetch('/api/auth/access-token', { credentials: 'include' });
  if (!r.ok) throw new Error('Failed to obtain access token');
  const j: any = await r.json();
  return j.accessToken || j.token;
}

interface SubmissionFormProps {
  taskId: string;
  initialFiles?: StudentSubmissionFile[];
  initialLinks?: StudentSubmissionLink[];
  initialNotes?: string;
  onSaveDraft?: (payload: { files: StudentSubmissionFile[]; links: StudentSubmissionLink[]; notes: string }) => void;
  onSubmitFinal?: (payload: { files: StudentSubmissionFile[]; links: StudentSubmissionLink[]; notes: string; clarityScore?: number | null }) => void;
  onUploadFile?: (file: File) => Promise<{ assetId: string; file_name: string; submissionId?: string } | void>;
  onDeleteAsset?: (assetId: string) => Promise<void> | void;
}

export default function SubmissionForm({
  taskId,
  initialFiles = [],
  initialLinks = [],
  initialNotes = '',
  onSaveDraft,
  onSubmitFinal,
  onUploadFile,
  onDeleteAsset,
  onNavigateToEnrollment,
}: SubmissionFormProps) {
  // Initialize with one default field each if arrays are empty
  const [files, setFiles] = useState<StudentSubmissionFile[]>(
    initialFiles.length > 0 ? initialFiles : [{ id: crypto.randomUUID(), name: '' }]
  );
  const [links, setLinks] = useState<StudentSubmissionLink[]>(
    initialLinks.length > 0 ? initialLinks : [{ id: crypto.randomUUID(), url: '' }]
  );
  const [notes, setNotes] = useState(initialNotes);
  const [clarityRating, setClarityRating] = useState<number | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  
  // Helper to get submission ID from backend (async)
  const getSubmissionId = async (): Promise<string | null> => {
    try {
      const { getLatestSubmission } = await import('../../services/studentTaskService');
      const latest = await getLatestSubmission(taskId);
      return latest?.id || null;
    } catch {
      return null;
    }
  };
  const [showHensModal, setShowHensModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isHensHovered, setIsHensHovered] = useState(false);
  const [focusedLinkId, setFocusedLinkId] = useState<string | null>(null);
  const [isLoadingAssessment, setIsLoadingAssessment] = useState(false);
  const [assessment, setAssessment] = useState<AIAssessment | null>(null);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; kind?: 'info' | 'success' | 'error' } | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const hasContent = (arr: any[], key: string) => Array.isArray(arr) && arr.some((x) => (x?.[key] || '').trim());
  // Allow assessment if there are uploaded files (with assetId - either from upload or existing), valid links, or notes
  // Files with assetId (from initialFiles after refresh) should be assessable
  const canAssess = files.some(f => f.assetId) || hasContent(links, 'url') || (notes || '').trim().length > 0;

  // Sync local state when props change (e.g., after refresh and async load)
  useEffect(() => {
    setFiles(initialFiles.length > 0 ? initialFiles : [{ id: crypto.randomUUID(), name: '' }]);
    setLinks(initialLinks.length > 0 ? initialLinks : [{ id: crypto.randomUUID(), url: '' }]);
    setNotes(initialNotes);
  }, [initialFiles, initialLinks, initialNotes]);

  const handleAddFile = () => {
    setFiles([...files, { id: crypto.randomUUID(), name: '' }]);
  };

  const handleUpdateFile = (id: string, value: string, status?: 'idle' | 'uploading' | 'success' | 'error', errorMessage?: string) => {
    setFiles(files.map((file) => (file.id === id ? { ...file, name: value, uploadStatus: status, errorMessage } : file)));
  };

  const handleRemoveFile = async (id: string) => {
    const target = files.find((f) => f.id === id);
    if (target?.assetId) {
      setIsDeleting(id);
      try {
        await onDeleteAsset?.(target.assetId);
        setToast({ message: 'File removed', kind: 'success' });
        // Remove from UI after successful delete
        if (files.length > 1) {
          setFiles(files.filter((file) => file.id !== id));
        } else {
          setFiles([{ id: crypto.randomUUID(), name: '' }]);
        }
      } catch (e) {
        console.error('[SubmissionForm] Delete asset failed:', e);
        setToast({ message: `Failed to delete file: ${(e as Error).message || 'Unknown error'}`, kind: 'error' });
      } finally {
        setIsDeleting(null);
      }
    } else {
      // No assetId - just remove from UI
      if (files.length > 1) {
        setFiles(files.filter((file) => file.id !== id));
      } else {
        setFiles([{ id: crypto.randomUUID(), name: '' }]);
      }
    }
  };

  const handleAddLink = () => {
    setLinks([...links, { id: crypto.randomUUID(), url: '' }]);
  };

  const handleUpdateLink = (id: string, value: string) => {
    setLinks(links.map((link) => (link.id === id ? { ...link, url: value } : link)));
  };

  const handleRemoveLink = async (id: string) => {
    const target = links.find((l) => l.id === id);
    if (target?.assetId) {
      setIsDeleting(id);
      try {
        await onDeleteAsset?.(target.assetId);
        setToast({ message: 'Link removed', kind: 'success' });
        // Remove from UI after successful delete
        if (links.length > 1) {
          setLinks(links.filter((link) => link.id !== id));
        } else {
          setLinks([{ id: crypto.randomUUID(), url: '' }]);
        }
      } catch (e) {
        console.error('[SubmissionForm] Delete asset failed:', e);
        setToast({ message: `Failed to delete link: ${(e as Error).message || 'Unknown error'}`, kind: 'error' });
      } finally {
        setIsDeleting(null);
      }
    } else {
      // No assetId - just remove from UI
      if (links.length > 1) {
        setLinks(links.filter((link) => link.id !== id));
      } else {
        setLinks([{ id: crypto.randomUUID(), url: '' }]);
      }
    }
  };

  const handleHensAssessment = async () => {
    if (!canAssess) return;
    setIsLoadingAssessment(true);
    setAssessmentError(null);
    setAssessment(null);
    setShowHensModal(true);
    try {
      const result = await getAIAssessment(taskId, {
        files: files.filter(f => f.name),
        links: links.filter(l => l.url),
        notes
      });
      setAssessment(result);
    } catch (e) {
      console.error('AI assessment error:', e);
      setAssessmentError((e as Error).message || 'Failed to get AI assessment');
    } finally {
      setIsLoadingAssessment(false);
    }
  };

  const handleSubmit = () => {
    setShowSubmitModal(true);
  };

  const handleSaveFromModal = () => {
    onSubmitFinal?.({ files: files.filter(f => f.name), links: links.filter(l => l.url), notes, clarityScore: clarityRating });
    setShowSubmitModal(false);
  };

  const handleSaveFromHensModal = () => {
    onSaveDraft?.({ files: files.filter((file) => file.name), links: links.filter((link) => link.url), notes });
    setShowHensModal(false);
  };

  const handleSubmitNowFromHens = () => {
    onSubmitFinal?.({ files: files.filter((file) => file.name), links: links.filter((link) => link.url), notes });
    setShowHensModal(false);
  };

  return (
    <div className="bg-[#f8f8f8] flex flex-col px-[32px] py-[24px] h-full">
      <div className="flex-1 flex flex-col gap-[32px] overflow-y-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col gap-[8px] w-full">
          <div className="flex gap-[8px] items-center pl-[8px] w-full">
            <p className="grow font-medium text-[#414651] text-[20px] leading-normal tracking-[0.4px] underline decoration-solid">
              Task Submission
            </p>
          </div>
          <div className="flex gap-[10px] items-center pl-[8px] w-full">
            <p className="grow font-normal text-[#414651] text-[16px] leading-[1.5] tracking-[0.32px]">
              Submit your work below. You can modify your submission until the deadline.
            </p>
          </div>
        </div>

        {/* Upload File and Add Link Container */}
        <div className="flex flex-col gap-[32px] w-full">
          {/* Upload File Section */}
          <div className="flex flex-col gap-[12px] w-full">
            <div className="flex gap-[8px] items-center pl-[8px] w-full">
              <p className="grow font-medium text-[#414651] text-[16px] leading-normal tracking-[0.32px]">
                Upload File
              </p>
            </div>
            <p className="text-xs text-gray-500 pl-[8px] -mt-2">Accepted up to 25 MB per file. Prefer PDFs, images, or zipped sources.</p>
            <div className="flex flex-col gap-[4px] w-full">
              {files.map((file) => (
                <div key={file.id} className="flex gap-[56px] w-full">
                  <div className="flex-1 flex gap-[8px] items-center">
                    <input
                      id={`file-input-${file.id}`}
                      type="file"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          // Show file name and set status to uploading
                          handleUpdateFile(file.id, f.name, 'uploading');
                          // Upload to Supabase immediately
                          if (onUploadFile) {
                            const result = await onUploadFile(f);
                            // Mark as success with asset ID
                            if (result && result.assetId) {
                              // Update file with asset ID, submission ID, and success status
                              setFiles(prevFiles => prevFiles.map((f) => (f.id === file.id ? { ...f, name: f.name, uploadStatus: 'success' as const, assetId: result.assetId, ...(result.submissionId && { submissionId: result.submissionId }) } : f)));
                              setToast({ message: 'File uploaded successfully', kind: 'success' });
                            } else {
                              handleUpdateFile(file.id, f.name, 'success');
                            }
                            console.log('[SubmissionForm] File uploaded successfully:', f.name);
                          } else {
                            handleUpdateFile(file.id, f.name, 'error', 'Upload handler not available');
                          }
                        } catch (error) {
                          console.error('[SubmissionForm] File upload failed:', error);
                          const errorMsg = (error as Error).message || 'Unknown error';
                          // Keep file name but mark as error
                          handleUpdateFile(file.id, f.name, 'error', errorMsg);
                        } finally {
                          try {
                            e.target.value = '';
                          } catch {}
                        }
                      }}
                    />
                    {file.uploadStatus === 'success' && file.assetId ? (
                      // Uploaded file - show with green checkmark and make clickable
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const token = await getToken();
                            const submissionId = file.submissionId || await getSubmissionId();
                            if (!submissionId) {
                              alert('Submission ID not found');
                              return;
                            }
                            const url = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/submissions/${submissionId}/assets/${file.assetId}/download`;
                            const resp = await fetch(url, {
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            if (!resp.ok) throw new Error('Download failed');
                            const blob = await resp.blob();
                            const downloadUrl = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = downloadUrl;
                            a.download = file.name || 'download';
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            window.URL.revokeObjectURL(downloadUrl);
                          } catch (e) {
                            console.error('Download error', e);
                            alert(`Failed to download file: ${(e as Error).message}`);
                          }
                        }}
                        className="flex-1 rounded-[6px] border-2 border-[#39b54a] bg-white px-[20px] py-[18px] text-left shadow-sm transition-all hover:border-[#2d8f3d] hover:shadow-md cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[14px] font-medium tracking-[0.28px] text-[#39b54a] truncate">
                                {file.name}
                              </p>
                              <CheckCircle2 className="size-4 text-[#39b54a] shrink-0" />
                            </div>
                            <p className="text-[12px] text-[#8c8f96]">Click to view</p>
                          </div>
                        </div>
                      </button>
                    ) : file.uploadStatus === 'uploading' ? (
                      // Uploading - show spinner
                      <div className="flex-1 rounded-[6px] border border-[#484de6] bg-white px-[20px] py-[18px] text-left shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[14px] font-medium tracking-[0.28px] text-[#353945] truncate">
                                {file.name}
                              </p>
                              <Loader2 className="size-4 text-[#484de6] animate-spin shrink-0" />
                            </div>
                            <p className="text-[12px] text-[#8c8f96]">Uploading...</p>
                          </div>
                        </div>
                      </div>
                    ) : file.uploadStatus === 'error' ? (
                      // Error state - show error message
                      <div className="flex-1 rounded-[6px] border-2 border-red-500 bg-red-50 px-[20px] py-[18px] text-left">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium tracking-[0.28px] text-red-700 truncate">
                              {file.name}
                            </p>
                            <p className="text-[12px] text-red-600">{file.errorMessage || 'Upload failed'}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Default state - attach file button
                      <button
                        type="button"
                        onClick={() => document.getElementById(`file-input-${file.id}`)?.click()}
                        className="flex-1 rounded-[6px] border border-[#e6e6e6] bg-white px-[20px] py-[18px] text-left shadow-sm transition-all hover:border-[#484de6] hover:shadow-md focus:border-[#484de6] cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[14px] font-medium tracking-[0.28px] text-[#353945]">
                              {file.name || 'Attach file'}
                            </p>
                            <p className="text-[12px] text-[#8c8f96]">PDF, DOCX, ZIP, PNG (max 25 MB)</p>
                          </div>
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f3ff]">
                            <Paperclip className="size-4 text-[#484de6]" />
                          </span>
                        </div>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.id)}
                      disabled={isDeleting === file.id}
                      className="shrink-0 size-5 text-[#535862] hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                    >
                      {isDeleting === file.id ? (
                        <Loader2 className="size-full animate-spin" />
                      ) : (
                        <Trash2 className="size-full" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddFile}
                className="bg-[#fdfdfd] border border-[#d5d7da] rounded-[4px] flex gap-[8px] items-center justify-center py-[20px] w-full hover:bg-white hover:border-[#484de6] transition-colors cursor-pointer"
              >
                <p className="font-normal text-[#535862] text-[14px] leading-normal tracking-[0.28px]">
                  add
                </p>
                <Plus className="size-[14px] text-[#535862]" />
              </button>
            </div>
          </div>

          {/* Add Link Section */}
          <div className="flex flex-col gap-[12px] w-full">
            <div className="flex gap-[8px] items-center pl-[8px] w-full">
              <p className="grow font-medium text-[#414651] text-[16px] leading-normal tracking-[0.32px]">
                Add link
              </p>
            </div>
            <div className="pl-[8px] pr-[8px]">
              <p className="text-xs text-gray-500">Provide a public GitHub repo URL and (optionally) a commit SHA/tag. If your repo is private, make it public for grading or include a token in the link. You may also add a YouTube video URL for demo.</p>
            </div>
            <div className="flex flex-col gap-[8px] w-full">
              {links.map((link) => (
                <div key={link.id} className="flex gap-[40px] w-full">
                  <div className="flex-1 flex gap-[8px] items-center">
                    <div className="group flex-1 rounded-[4px] border border-[#e6e6e6] bg-white px-[16px] py-[24px] transition-colors hover:border-[#484de6] focus-within:border-[#484de6]">
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={link.url}
                          onChange={(e) => handleUpdateLink(link.id, e.target.value)}
                          onFocus={() => setFocusedLinkId(link.id)}
                          onBlur={() => setFocusedLinkId((prev) => (prev === link.id ? null : prev))}
                          className="flex-1 bg-transparent font-normal text-[#535862] text-[14px] leading-normal tracking-[0.28px] outline-none placeholder:text-gray-300 group-hover:placeholder:text-gray-600"
                          placeholder={focusedLinkId === link.id ? '' : 'https://github.com/your-project'}
                        />
                        <Clipboard className="size-5 text-[#535862]" />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(link.id)}
                      className="shrink-0 size-5 text-[#535862] hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-full" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddLink}
                className="bg-[#fdfdfd] border border-[#d5d7da] rounded-[4px] flex gap-[8px] items-center justify-center py-[20px] w-full hover:bg-white hover:border-[#484de6] transition-colors cursor-pointer"
              >
                <p className="font-normal text-[#535862] text-[14px] leading-normal tracking-[0.28px]">
                  add
                </p>
                <Plus className="size-[14px] text-[#535862]" />
              </button>
            </div>
          </div>
        </div>

        {/* Additional Notes Section */}
        <div className="flex-1 flex flex-col gap-[8px] w-full min-h-[150px]">
          <div className="flex gap-[8px] items-center pl-[8px] w-full">
            <p className="grow font-medium text-[#414651] text-[16px] leading-normal tracking-[0.32px]">
              Additional notes
            </p>
          </div>
          <div className="flex-1 bg-white border border-[#e9eaeb] rounded-[4px] relative min-h-[100px]">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-full p-[16px] font-normal text-[#717680] text-[16px] leading-[1.5] tracking-[0.32px] bg-transparent rounded-[inherit] resize-none outline-none"
              placeholder="I've completed everything yet wanted to submit early so I can have time to modify."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-[8px] w-full">
          <button
            type="button"
            onClick={handleHensAssessment}
            onMouseEnter={() => setIsHensHovered(true)}
            onMouseLeave={() => setIsHensHovered(false)}
            className={`flex-1 border-2 rounded-[4px] flex gap-[10px] items-center justify-center px-[32px] py-[16px] transition-colors ${
              canAssess ? 'bg-[#f5f8ff] cursor-pointer' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            }`}
            style={
              canAssess
                ? { borderColor: isHensHovered ? '#FA906A' : '#8b96d8' }
                : undefined
            }
            disabled={!canAssess}
          >
            <Sparkles
              className={`size-4 text-[#484de6] transition-transform ${isHensHovered ? 'animate-bounce' : ''}`}
            />
            <p className="font-normal text-[16px] leading-[1.5] tracking-[0.32px]">
              <span className="font-bold italic text-[#484de6]">Hens </span>
              <span className="text-[#717680]">assessment</span>
            </p>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="bg-[#444ce7] rounded-[4px] flex gap-[7px] items-center justify-center px-[32px] py-[16px] w-[227.5px] hover:bg-[#3A3FE4] cursor-pointer"
          >
            <p className="font-normal text-[#f8f8f8] text-[16px] leading-normal">
              Submit
            </p>
            <CheckCircle2 className="size-4 text-[#f8f8f8]" />
          </button>
        </div>
      </div>

      <ModalFrame
        isOpen={showHensModal}
        onClose={() => setShowHensModal(false)}
        className="max-w-[896px] rounded-[32px] border-4 border-[#cccccc] bg-[#f8f8f8] max-h-[90vh] overflow-y-auto"
        contentClassName="flex flex-col items-center gap-[24px] px-[48px] py-[40px]"
        closeButtonClassName="absolute right-[16px] top-[16px] text-gray-400 transition-colors hover:text-gray-600 [&>svg]:h-6 [&>svg]:w-6"
      >
        <div className="flex w-full max-w-[800px] flex-col items-center gap-[24px]">
          {canAssess ? (
            <>
              {isLoadingAssessment ? (
                <div className="flex flex-col items-center gap-4">
                  <HappyHensMascot />
                  <Loader2 className="w-8 h-8 animate-spin text-[#484de6]" />
                  <p className="text-center text-[18px] text-[#414651]">Hens is assessing your submission...</p>
                </div>
              ) : assessmentError ? (
                <div className="flex flex-col items-center gap-4">
                  <HappyHensMascot />
                  <p className="text-center text-[18px] text-red-600">{assessmentError}</p>
                  <button onClick={handleHensAssessment} className="px-4 py-2 rounded border cursor-pointer">Try Again</button>
                </div>
              ) : assessment ? (
                <div className="flex w-full flex-col gap-[40px] items-center">
                  {/* Header with icon and title */}
                  <div className="flex flex-col gap-[32px] items-center">
                    {assessment.overall === 'pass' ? <HappyHensMascot /> : <SeriousHensMascot />}
                    <div className="flex flex-col gap-[24px] items-center w-[600px]">
                      <p className="font-['Nunito_Sans',sans-serif] font-bold italic leading-normal text-[#484de6] text-[24px] text-center tracking-[0.48px] whitespace-pre-wrap">
                        {assessment.overall === 'pass' ? 'Task Passed, Great work!' : 'Task Needs Improvement'}
                      </p>
                    </div>
                  </div>

                  {/* Pass/Fail Declaration - Matching Figma design */}
                  <div className="bg-[#f6fef9] border border-[#a6f4c5] rounded-[8px] p-[24px] w-full">
                    <div className="flex gap-[16px] items-end mb-[12px]">
                      <p className="font-['Helvetica_Neue:Regular',sans-serif] leading-normal not-italic text-[#717680] text-[16px] tracking-[0.32px]">
                        <span>{`Hens(AI) `}</span>Assessment
                      </p>
                      <div className="flex gap-[4px] items-center">
                        <CheckCircle2 className={`size-[16px] ${assessment.overall === 'pass' ? 'text-[#027a48]' : 'text-[#dc2626]'}`} />
                        <p className={`font-['Helvetica_Neue:Bold',sans-serif] leading-normal not-italic text-[16px] tracking-[0.32px] ${assessment.overall === 'pass' ? 'text-[#027a48]' : 'text-[#dc2626]'}`}>
                          {assessment.overall === 'pass' ? 'Pass' : 'Fail'}
                        </p>
                      </div>
                    </div>
                    {/* Criteria-based feedback matching Figma design */}
                    {assessment.criteria && assessment.criteria.length > 0 && (
                      <div className="flex flex-col gap-[16px]">
                        {assessment.criteria.map((criterion, index) => (
                          <div key={index} className="flex gap-[8px] items-start">
                            <ul className="block flex-1 font-['Helvetica_Neue:Medium',sans-serif] leading-[0] not-italic text-[#414651] text-[16px] tracking-[0.32px]">
                              <li className="leading-[25.888px] ms-[24px] whitespace-pre-wrap">
                                <span className="font-['Helvetica_Neue:Regular',sans-serif] not-italic text-[#181d27]">{criterion.name}:</span>
                                <span className="text-[#181d27]"> </span>
                                <span className="font-['Helvetica_Neue:Regular',sans-serif] not-italic">{criterion.level} — {criterion.comment}</span>
                              </li>
                            </ul>
                          </div>
                        ))}
                        {/* Overall summary */}
                        {assessment.summary && (
                          <div className="flex gap-[10px] items-center justify-center pl-[24px] pr-0 py-0">
                            <p className="flex-1 font-['Helvetica_Neue:Regular',sans-serif] leading-[25.9px] not-italic text-[#414651] text-[16px] tracking-[0.32px] whitespace-pre-wrap">
                              {assessment.summary}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* What went well - Green section (only if passed or has what_went_well) */}
                  {assessment.overall === 'pass' && assessment.what_went_well && (
                    <div className="flex flex-col gap-[24px] items-start w-full">
                      <p className="font-['Helvetica_Neue:Bold',sans-serif] leading-normal not-italic text-[#039855] text-[16px] tracking-[0.32px]">
                        What went well
                      </p>
                      <div className="flex gap-[8px] items-start w-full">
                        <ul className="block flex-1 font-['Helvetica_Neue:Regular',sans-serif] leading-[0] not-italic text-[#181d27] text-[16px] tracking-[0.32px]">
                          <li className="ms-[24px] whitespace-pre-wrap leading-[25.888px]">
                            {assessment.what_went_well}
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* What could be improved? - Orange section */}
                  {assessment.what_could_be_improved && (
                    <div className="flex flex-col gap-[24px] items-start w-full">
                      <p className="font-['Helvetica_Neue',sans-serif] font-bold leading-normal text-[#dc6803] text-[16px] tracking-[0.32px]">
                        What could be improved?
                      </p>
                      <div className="flex gap-[8px] items-start w-full">
                        <ul className="block flex-1 font-['Helvetica_Neue',sans-serif] font-normal text-[#181d27] text-[16px] tracking-[0.32px]">
                          <li className="ms-[24px] whitespace-pre-wrap leading-[25.888px]">
                            {assessment.what_could_be_improved}
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* What must be done? - Red section (only if failed) */}
                  {assessment.overall === 'fail' && assessment.how_to_pass && (
                    <div className="flex flex-col gap-[24px] items-start w-full">
                      <p className="font-['Helvetica_Neue',sans-serif] font-bold leading-normal text-[#dc2626] text-[16px] tracking-[0.32px]">
                        What must be done?
                      </p>
                      <div className="flex gap-[8px] items-start w-full">
                        <ul className="block flex-1 font-['Helvetica_Neue',sans-serif] font-normal text-[#181d27] text-[16px] tracking-[0.32px]">
                          <li className="ms-[24px] whitespace-pre-wrap leading-[25.888px]">
                            {assessment.how_to_pass}
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Additional failure details if failed */}
                  {assessment.overall === 'fail' && assessment.failure_reason && (
                    <div className="flex flex-col gap-[24px] items-start w-full">
                      <p className="font-['Helvetica_Neue',sans-serif] font-bold leading-normal text-[#dc6803] text-[16px] tracking-[0.32px]">
                        Why did it fail?
                      </p>
                      <div className="flex gap-[8px] items-start w-full">
                        <ul className="block flex-1 font-['Helvetica_Neue',sans-serif] font-normal text-[#181d27] text-[16px] tracking-[0.32px]">
                          <li className="ms-[24px] whitespace-pre-wrap leading-[25.888px] mb-3">
                            {assessment.failure_reason}
                          </li>
                          {assessment.what_is_missing && (
                            <li className="ms-[24px] whitespace-pre-wrap leading-[25.888px]">
                              <span className="font-semibold">What is missing: </span>
                              {assessment.what_is_missing}
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons - Matching Figma design */}
                  <div className="flex gap-[8px] items-start w-full cursor-pointer">
                    <button
                      onClick={() => setShowHensModal(false)}
                      className="bg-[#fdfdfd] border border-[#e9eaeb] rounded-[4px] shrink-0 w-[396px] py-[16px] px-0 flex items-center justify-center text-[#414651] text-[16px] font-['Helvetica_Neue',sans-serif] tracking-[0.32px] cursor-pointer hover:bg-[#f5f5f5] transition-colors"
                    >
                      Back to editing
                    </button>
                    <button
                      onClick={handleSaveFromHensModal}
                      className="bg-[#444ce7] rounded-[4px] shrink-0 w-[396px] py-[16px] px-0 flex gap-[8px] items-center justify-center text-white text-[16px] font-['Helvetica_Neue',sans-serif] tracking-[0.32px] cursor-pointer hover:bg-[#3A3FE4] transition-colors"
                    >
                      <span>Save Submission</span>
                      <CheckCircle2 className="size-[16px] shrink-0" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-center text-[18px] text-[#414651]">Click "Hens assessment" to get AI feedback on your submission.</p>
                </div>
              )}
            </>
          ) : (
            <div className="w-full">
              <h3 className="text-lg font-semibold mb-2">Before assessment, please provide:</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm text-[#414651]">
                <li>At least one link (GitHub repo/raw file, Google Docs, YouTube demo) or upload a file.</li>
                <li>For GitHub code: prefer raw links or include commit SHA. Example raw: https://raw.githubusercontent.com/&lt;user&gt;/&lt;repo&gt;/&lt;sha&gt;/path/file</li>
                <li>For a repo root link, include README and key files as raw links so Hens can read them.</li>
              </ul>
              <div className="mt-4 text-right">
                <button onClick={() => setShowHensModal(false)} className="px-4 py-2 rounded border cursor-pointer">Got it</button>
              </div>
            </div>
          )}
        </div>
      </ModalFrame>

      <ModalFrame
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        className="max-w-[896px] rounded-[32px] border-4 border-[#cccccc] bg-[#f8f8f8]"
        contentClassName="flex flex-col items-center gap-[120px] px-[48px] py-[40px]"
        closeButtonClassName="absolute right-[16px] top-[19px] text-gray-400 transition-colors hover:text-gray-600 [&>svg]:h-6 [&>svg]:w-6"
      >
        <div className="flex w-full flex-col items-start gap-[64px]">
          <div className="flex w-full flex-col items-center gap-[32px]">
            <HappyHensMascot />
            <div className="flex w-full flex-col items-center gap-[16px]">
              <div className="flex w-full max-w-[800px] flex-col items-center gap-[24px]">
                <p className="w-full max-w-[600px] text-center text-[24px] font-bold italic tracking-[0.48px] text-[#484de6]">
                  Submission Saved
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-[16px]">
            <div className="flex w-full max-w-[800px] flex-col items-center gap-[24px]">
              <p className="w-full max-w-[600px] text-center text-[24px] font-medium tracking-[0.48px] text-[#535862]">
                Clarity Score
              </p>
            </div>
            <p className="text-center text-[20px] font-normal leading-[1.5] tracking-[0.4px] text-[#414651]">
              Rate how clear the task instructions were.
            </p>
            <div 
              className="mt-6 flex items-center justify-center gap-[10px]"
              onMouseLeave={() => setHoveredStar(null)}
              role="radiogroup"
              aria-label="Rate task clarity from 1 to 5 stars"
            >
              {[1, 2, 3, 4, 5].map((rating) => {
                const isActive = hoveredStar !== null 
                  ? rating <= hoveredStar 
                  : clarityRating !== null && rating <= clarityRating;
                const isHovered = hoveredStar === rating;
                const isSelected = clarityRating === rating;
                
                return (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setClarityRating(rating)}
                    onMouseEnter={() => setHoveredStar(rating)}
                    className={`
                      relative w-[40px] h-[40px] flex items-center justify-center
                      transition-all duration-200 ease-in-out
                      cursor-pointer
                      focus:outline-none focus:ring-2 focus:ring-[#484de6] focus:ring-offset-2 rounded-full
                      ${isHovered ? 'scale-110' : 'scale-100'}
                      ${isSelected ? 'scale-105' : ''}
                      active:scale-95
                    `}
                    aria-label={`Rate clarity ${rating} out of 5 stars`}
                    aria-pressed={isSelected}
                  >
                    <Star 
                      className={`
                        w-[32px] h-[32px] transition-all duration-200 ease-in-out
                        ${isActive 
                          ? 'text-amber-400 fill-amber-400' 
                          : 'text-gray-300 fill-transparent'
                        }
                        ${isHovered && !isActive ? 'text-amber-400' : ''}
                        stroke-current
                        stroke-[1.5]
                      `}
                    />
                    {/* Visual feedback indicator */}
                    {isSelected && (
                      <span className="absolute inset-0 rounded-full bg-amber-400/10" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex w-full gap-[8px]">
          <button
            onClick={() => setShowSubmitModal(false)}
            className="flex w-[396px] items-center justify-center rounded-[4px] border border-[#e9eaeb] bg-[#fdfdfd] py-[16px] transition-colors hover:bg-white cursor-pointer"
          >
            <p className="text-[16px] tracking-[0.32px] text-[#414651]">Back to editing</p>
          </button>
          <button
            onClick={() => {
              handleSaveFromModal();
              onNavigateToEnrollment?.();
            }}
            className="flex w-[396px] items-center justify-center rounded-[4px] bg-[#444ce7] py-[16px] transition-colors hover:bg-[#3A3FE4] cursor-pointer"
          >
            <p className="text-[16px] tracking-[0.32px] text-white">Back to main dashboard</p>
          </button>
        </div>
      </ModalFrame>

      {/* Toast Notification */}
      {toast && (
        <SimpleToast
          message={toast.message}
          kind={toast.kind}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
