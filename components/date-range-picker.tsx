"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerWithRangeProps {
  className?: string
  onRangeChange?: (start: Date, end: Date) => void
}

export function DatePickerWithRange({ className, onRangeChange }: DatePickerWithRangeProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })

  // Usamos useRef para rastrear si ya notificamos este cambio
  const previousDateRef = React.useRef<DateRange | undefined>(date)

  // Cuando cambia el rango de fechas, notificar al componente padre
  React.useEffect(() => {
    // Solo notificar si realmente cambió la fecha y tenemos ambas fechas
    if (
      date?.from &&
      date?.to &&
      onRangeChange &&
      (!previousDateRef.current?.from ||
        !previousDateRef.current?.to ||
        previousDateRef.current.from.getTime() !== date.from.getTime() ||
        previousDateRef.current.to.getTime() !== date.to.getTime())
    ) {
      previousDateRef.current = date
      onRangeChange(date.from, date.to)
    }
  }, [date, onRangeChange])

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/yyyy")} - {format(date.to, "dd/MM/yyyy")}
                </>
              ) : (
                format(date.from, "dd/MM/yyyy")
              )
            ) : (
              <span>Seleccione un rango de fechas</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Exportar el mismo componente con un nombre alternativo para compatibilidad
export const DateRangePicker = DatePickerWithRange
