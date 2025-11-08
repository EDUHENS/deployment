"use client"

import * as React from "react"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { cn } from "../../../lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

interface DateTimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  placeholder?: string
  minDate?: Date | undefined
}

export function DateTimePicker({ date, setDate, placeholder = "Pick a date and time", minDate }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [hourInput, setHourInput] = React.useState("")
  const [minuteInput, setMinuteInput] = React.useState("")
  const [showHourDropdown, setShowHourDropdown] = React.useState(false)
  const [showMinuteDropdown, setShowMinuteDropdown] = React.useState(false)
  
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 }, (_, i) => i)

  React.useEffect(() => {
    if (date) {
      setHourInput(date.getHours().toString().padStart(2, "0"))
      setMinuteInput(date.getMinutes().toString().padStart(2, "0"))
    } else {
      setHourInput("09")
      setMinuteInput("00")
    }
  }, [date])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const newDate = new Date(selectedDate)
      if (date) {
        newDate.setHours(date.getHours())
        newDate.setMinutes(date.getMinutes())
      } else {
        newDate.setHours(9)
        newDate.setMinutes(0)
      }
      setDate(newDate)
    } else {
      setDate(undefined)
    }
  }

  const handleHourChange = (value: string) => {
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 23) {
      const newDate = date ? new Date(date) : new Date()
      newDate.setHours(numValue)
      if (!date) newDate.setMinutes(0)
      setDate(newDate)
      setHourInput(value.padStart(2, "0"))
    }
    setShowHourDropdown(false)
  }

  const handleMinuteChange = (value: string) => {
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 59) {
      const newDate = date ? new Date(date) : new Date()
      newDate.setMinutes(numValue)
      if (!date) newDate.setHours(9)
      setDate(newDate)
      setMinuteInput(value.padStart(2, "0"))
    }
    setShowMinuteDropdown(false)
  }

  const handleHourInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setHourInput(value)
    if (value.length === 2) {
      handleHourChange(value)
    }
  }

  const handleMinuteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMinuteInput(value)
    if (value.length === 2) {
      handleMinuteChange(value)
    }
  }

  // Normalize minDate to start of day for calendar disable logic
  const minDay = React.useMemo(() => {
    if (!minDate) return undefined
    const d = new Date(minDate)
    d.setHours(0, 0, 0, 0)
    return d
  }, [minDate])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal h-12 px-4 border-2 border-[#cccccc] rounded-lg hover:bg-gray-50 hover:border-[#999999] transition-colors",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-5 w-5 text-[#595959]" />
          {date ? (
            <span className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[16px]">
              {format(date, "PPP 'at' p")}
            </span>
          ) : (
            <span className="font-['Helvetica_Neue:Regular',sans-serif] text-[#999999] text-[16px]">
              {placeholder}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 border-2 border-[#cccccc] bg-white shadow-lg rounded-lg" 
        align="start"
        sideOffset={8}
      >
        <div className="flex bg-white rounded-lg overflow-hidden">
          <div className="bg-white">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
              className="rounded-l-lg"
              disabled={minDay ? { before: minDay } : undefined}
            />
          </div>
          <div className="flex flex-col gap-3 p-4 border-l-2 border-[#e6e6e6] bg-[#f8f8f8] min-w-[160px]">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-[#595959]" />
              <span className="font-['Helvetica_Neue:Medium',sans-serif] text-[14px] text-[#222222]">
                Time
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Hour Input with Dropdown */}
              <div className="relative">
                <input
                  type="text"
                  value={hourInput}
                  onChange={handleHourInputChange}
                  onFocus={() => setShowHourDropdown(true)}
                  onBlur={() => setTimeout(() => setShowHourDropdown(false), 200)}
                  maxLength={2}
                  placeholder="00"
                  className="w-[70px] h-10 border border-gray-300 bg-white font-normal text-gray-700 text-base text-center rounded-md hover:border-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                />
                {showHourDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-[70px] max-h-[200px] overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg z-50">
                    {hours.map((hour) => (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => handleHourChange(hour.toString())}
                        className="w-full px-3 py-2 text-base text-gray-700 hover:bg-gray-100 text-center transition-colors"
                      >
                        {hour.toString().padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <span className="flex items-center text-gray-600 text-lg font-medium">:</span>
              
              {/* Minute Input with Dropdown */}
              <div className="relative">
                <input
                  type="text"
                  value={minuteInput}
                  onChange={handleMinuteInputChange}
                  onFocus={() => setShowMinuteDropdown(true)}
                  onBlur={() => setTimeout(() => setShowMinuteDropdown(false), 200)}
                  maxLength={2}
                  placeholder="00"
                  className="w-[70px] h-10 border border-gray-300 bg-white font-normal text-gray-700 text-base text-center rounded-md hover:border-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                />
                {showMinuteDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-[70px] max-h-[200px] overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg z-50">
                    {minutes.map((minute) => (
                      <button
                        key={minute}
                        type="button"
                        onClick={() => handleMinuteChange(minute.toString())}
                        className="w-full px-3 py-2 text-base text-gray-700 hover:bg-gray-100 text-center transition-colors"
                      >
                        {minute.toString().padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
