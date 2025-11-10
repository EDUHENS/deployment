'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Sparkles, CheckCircle2, Paperclip, Clipboard, Star } from 'lucide-react';
import type { StudentSubmissionFile, StudentSubmissionLink } from '@/features/student-experience/types/studentTask';
import ModalFrame from '../shared/ModalFrame';
import HappyHensMascot from '../shared/HappyHensMascot';

interface SubmissionFormProps {
  initialFiles?: StudentSubmissionFile[];
  initialLinks?: StudentSubmissionLink[];
  initialNotes?: string;
  onSaveDraft?: (payload: { files: StudentSubmissionFile[]; links: StudentSubmissionLink[]; notes: string }) => void;
  onSubmitFinal?: (payload: { files: StudentSubmissionFile[]; links: StudentSubmissionLink[]; notes: string }) => void;
  onUploadFile?: (file: File) => Promise<void> | void;
  onDeleteAsset?: (assetId: string) => Promise<void> | void;
}

export default function SubmissionForm({
  initialFiles = [],
  initialLinks = [],
  initialNotes = '',
  onSaveDraft,
  onSubmitFinal,
  onUploadFile,
  onDeleteAsset,
}: SubmissionFormProps) {
  // Initialize with one default field each if arrays are empty
  const [files, setFiles] = useState<StudentSubmissionFile[]>(
    initialFiles.length > 0 ? initialFiles : [{ id: crypto.randomUUID(), name: '' }]
  );
  const [links, setLinks] = useState<StudentSubmissionLink[]>(
    initialLinks.length > 0 ? initialLinks : [{ id: crypto.randomUUID(), url: '' }]
  );
  const [notes, setNotes] = useState(initialNotes);
  const [showHensModal, setShowHensModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const hasContent = (arr: any[], key: string) => Array.isArray(arr) && arr.some((x) => (x?.[key] || '').trim());
  const canAssess = hasContent(files, 'name') || hasContent(links, 'url') || (notes || '').trim().length > 0;

  // Sync local state when props change (e.g., after refresh and async load)
  useEffect(() => {
    setFiles(initialFiles.length > 0 ? initialFiles : [{ id: crypto.randomUUID(), name: '' }]);
    setLinks(initialLinks.length > 0 ? initialLinks : [{ id: crypto.randomUUID(), url: '' }]);
    setNotes(initialNotes);
  }, [initialFiles, initialLinks, initialNotes]);

  const handleAddFile = () => {
    setFiles([...files, { id: crypto.randomUUID(), name: '' }]);
  };

  const handleUpdateFile = (id: string, value: string) => {
    setFiles(files.map((file) => (file.id === id ? { ...file, name: value } : file)));
  };

  const handleRemoveFile = (id: string) => {
    // Keep at least one field
    if (files.length > 1) {
      const target = files.find((f) => f.id === id);
      if (target?.assetId) {
        try { onDeleteAsset?.(target.assetId); } catch {}
      }
      setFiles(files.filter((file) => file.id !== id));
    }
  };

  const handleAddLink = () => {
    setLinks([...links, { id: crypto.randomUUID(), url: '' }]);
  };

  const handleUpdateLink = (id: string, value: string) => {
    setLinks(links.map((link) => (link.id === id ? { ...link, url: value } : link)));
  };

  const handleRemoveLink = (id: string) => {
    // Keep at least one field
    if (links.length > 1) {
      const target = links.find((l) => l.id === id);
      if (target?.assetId) {
        try { onDeleteAsset?.(target.assetId); } catch {}
      }
      setLinks(links.filter((link) => link.id !== id));
    }
  };

  const handleHensAssessment = () => {
    setShowHensModal(true);
  };

  const handleSubmit = () => {
    setShowSubmitModal(true);
  };

  const handleSaveFromModal = () => {
    onSubmitFinal?.({ files: files.filter(f => f.name), links: links.filter(l => l.url), notes });
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
                    <div className="flex-1 bg-[#fdfdfd] border border-[#d5d7da] rounded-[4px] flex gap-[8px] items-center px-[16px] py-[24px] hover:bg-white hover:border-[#484de6] transition-colors">
                      <input
                        type="text"
                        value={file.name}
                        onChange={(e) => handleUpdateFile(file.id, e.target.value)}
                        className="flex-1 bg-transparent font-normal text-[#535862] text-[14px] leading-normal tracking-[0.28px] outline-none placeholder:text-[#535862]"
                        placeholder="Attach file"
                      />
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            try {
                              handleUpdateFile(file.id, f.name);
                              await onUploadFile?.(f);
                            } finally {
                              try { e.target.value = ''; } catch {}
                            }
                          }}
                        />
                        <Paperclip className="size-5 text-[#535862] hover:text-[#484de6]" />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.id)}
                      className="shrink-0 size-5 text-[#535862] hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="size-full" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddFile}
                className="bg-[#fdfdfd] border border-[#d5d7da] rounded-[4px] flex gap-[8px] items-center justify-center py-[20px] w-full hover:bg-white hover:border-[#484de6] transition-colors"
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
                    <div className="flex-1 bg-[#fdfdfd] border border-[#d5d7da] rounded-[4px] flex gap-[8px] items-center justify-center px-[16px] py-[24px] hover:bg-white hover:border-[#484de6] transition-colors">
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => handleUpdateLink(link.id, e.target.value)}
                        className="flex-1 bg-transparent font-normal text-[#535862] text-[14px] leading-normal tracking-[0.28px] outline-none placeholder:text-[#535862]"
                        placeholder="www.github-yourlink.com"
                      />
                      <Clipboard className="size-5 text-[#535862]" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(link.id)}
                      className="shrink-0 size-5 text-[#535862] hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="size-full" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddLink}
                className="bg-[#fdfdfd] border border-[#d5d7da] rounded-[4px] flex gap-[8px] items-center justify-center py-[20px] w-full hover:bg-white hover:border-[#484de6] transition-colors"
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
            className={`flex-1 border-2 rounded-[4px] flex gap-[7px] items-center justify-center px-[32px] py-[16px] ${canAssess ? 'bg-[#f5f8ff] border-[#c7d7fe] hover:bg-[#eef2ff] cursor-pointer' : 'bg-gray-100 border-gray-200 text-gray-400'}`}
          >
            <Sparkles className="size-[14px] text-[#484de6]" />
            <p className="font-normal text-[16px] leading-[1.5] tracking-[0.32px]">
              <span className="font-bold italic text-[#484de6]">Hens </span>
              <span className="text-[#717680]">assessment</span>
            </p>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="bg-[#444ce7] rounded-[4px] flex gap-[7px] items-center justify-center px-[32px] py-[16px] w-[227.5px] hover:bg-[#3A3FE4]"
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
              <HappyHensMascot />
              <p className="text-center text-[18px] text-[#414651]">This is a quick preview. Submit to get an actual AI assessment.</p>
              <div className="flex w-full gap-[8px] justify-center">
                <button onClick={() => setShowHensModal(false)} className="px-4 py-2 rounded border">Back</button>
                <button onClick={handleSaveFromHensModal} className="px-4 py-2 rounded border">Save Draft</button>
                <button onClick={handleSubmitNowFromHens} className="px-4 py-2 rounded bg-[#444ce7] text-white">Submit Now</button>
              </div>
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
                <button onClick={() => setShowHensModal(false)} className="px-4 py-2 rounded border">Got it</button>
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
            <div className="mt-4 flex items-center justify-center gap-[12px]">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button key={rating} className="size-[30px] text-gray-300 transition-colors hover:text-yellow-400" aria-label={`Rate clarity ${rating} out of 5`}>
                  <Star className="size-full fill-current" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex w-full gap-[8px]">
          <button
            onClick={() => setShowSubmitModal(false)}
            className="flex w-[396px] items-center justify-center rounded-[4px] border border-[#e9eaeb] bg-[#fdfdfd] py-[16px] transition-colors hover:bg-white"
          >
            <p className="text-[16px] tracking-[0.32px] text-[#414651]">Back to editing</p>
          </button>
          <button
            onClick={handleSaveFromModal}
            className="flex w-[396px] items-center justify-center rounded-[4px] bg-[#444ce7] py-[16px] transition-colors hover:bg-[#3A3FE4]"
          >
            <p className="text-[16px] tracking-[0.32px] text-white">Back to main dashboard</p>
          </button>
        </div>
      </ModalFrame>
    </div>
  );
}
