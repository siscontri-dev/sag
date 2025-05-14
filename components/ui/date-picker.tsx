"use client"

import * as React from "react"
import { format } from "date-fns"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function DatePicker({ className, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) {
  const [selected, setSelected] = React.useState<Date>()
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn("w-[240px] pl-3 text-left font-normal", !selected && "text-muted-foreground", className)}
        >
          {selected ? format(selected, "PPP") : <span>Pick a date</span>}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={setSelected}
          disabled={{ from: new Date(2000, 1, 1), to: new Date() }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
