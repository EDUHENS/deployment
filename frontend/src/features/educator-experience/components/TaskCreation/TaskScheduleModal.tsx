'use client';

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { DateTimePicker } from '../../../../shared/components/ui';
import CloseButton from '@/shared/components/ui/CloseButton';
import { getFinlandTime, toFinlandTime } from '../../../shared/hooks/useRealtimeDate';

interface TaskScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (startDate: Date | null, endDate: Date | null, startTime?: string, endTime?: string) => void;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
}

export default function TaskScheduleModal({ isOpen, onClose, onSave, initialStartDate, initialEndDate }: TaskScheduleModalProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [currentFinlandTime, setCurrentFinlandTime] = useState(getFinlandTime());

  // Initialize with existing schedule when modal opens
  useEffect(() => {
    if (isOpen) {
      setStartDate(initialStartDate ? new Date(initialStartDate) : undefined);
      setEndDate(initialEndDate ? new Date(initialEndDate) : undefined);
    }
  }, [isOpen, initialStartDate, initialEndDate]);

  // Update current Finland time every second for real-time validation
  useEffect(() => {
    if (!isOpen) return;
    
    setCurrentFinlandTime(getFinlandTime());
    const interval = setInterval(() => {
      setCurrentFinlandTime(getFinlandTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Get minimum date/time (current Finland time)
  const getMinDate = () => {
    return currentFinlandTime;
  };

  const handleSave = () => {
    // Guard: start date/time cannot be before current Finland time
    if (startDate) {
      const startFinland = toFinlandTime(startDate);
      const nowFinland = toFinlandTime(currentFinlandTime);
      
      if (startFinland < nowFinland) {
        alert('Start date and time cannot be before the current moment. Please select a future date and time.');
        return;
      }
    }
    
    // Guard: end date cannot be before start date
    if (startDate && endDate) {
      const startFinland = toFinlandTime(startDate);
      const endFinland = toFinlandTime(endDate);
      
      if (endFinland < startFinland) {
        alert('End date and time cannot be before start date and time.');
        return;
      }
    }
    
    const startTime = startDate ? startDate.toTimeString().slice(0, 5) : undefined;
    const endTime = endDate ? endDate.toTimeString().slice(0, 5) : undefined;
    onSave(startDate || null, endDate || null, startTime, endTime);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-8">
      <div className="bg-[#f8f8f8] border-4 border-[#cccccc] border-solid relative rounded-[32px] w-full max-w-3xl flex flex-col">
        {/* Close Button */}
        <CloseButton onClick={onClose} className="absolute right-4 top-4 z-10" size="sm" />

        {/* Content */}
        <div className="flex flex-col gap-8 p-12">
          {/* Title Section */}
          <div className="flex flex-col gap-3 items-center">
            <h2 className="font-['Helvetica_Neue:Bold',sans-serif] text-[#222222] text-[28px] text-center tracking-[0.56px]">
              Set Task Schedule
            </h2>
            <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#595959] text-[16px] text-center tracking-[0.32px] max-w-lg">
              Choose when the task starts and ends. Leave the dates empty if you don&rsquo;t want a time limit.
            </p>
          </div>

          {/* Date and Time Pickers - 2 Columns */}
          <div className="grid grid-cols-2 gap-8">
            {/* LEFT COLUMN - Opens on */}
            <div className="flex flex-col gap-3">
              <label className="font-['Helvetica_Neue:Medium',sans-serif] text-[#222222] text-[18px] tracking-[0.36px]">
                Opens on
              </label>
              <DateTimePicker 
                date={startDate}
                setDate={setStartDate}
                placeholder="Select start date and time"
                minDate={getMinDate()}
              />
            </div>

            {/* RIGHT COLUMN - Closes on */}
            <div className="flex flex-col gap-3">
              <label className="font-['Helvetica_Neue:Medium',sans-serif] text-[#222222] text-[18px] tracking-[0.36px]">
                Closes on
              </label>
              <DateTimePicker 
                date={endDate}
                setDate={setEndDate}
                placeholder="Select end date and time"
                minDate={startDate || new Date()}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center mt-4">
            <button
              onClick={onClose}
              className="bg-white border-2 border-[#cccccc] border-solid cursor-pointer flex items-center justify-center px-8 py-3 rounded-lg hover:bg-gray-50 hover:border-[#999999] transition-colors"
            >
              <span className="font-['Helvetica_Neue:Regular',sans-serif] text-[#595959] text-[16px]">
                Cancel
              </span>
            </button>
            <button
              onClick={handleSave}
              className="bg-[#484de6] border-2 border-[#6976eb] cursor-pointer flex gap-2 items-center justify-center px-8 py-3 rounded-lg hover:bg-[#3A3FE4] transition-colors"
            >
              <Calendar className="w-5 h-5 text-white" />
              <span className="font-['Helvetica_Neue:Regular',sans-serif] text-white text-[16px]">
                Set Schedule
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
