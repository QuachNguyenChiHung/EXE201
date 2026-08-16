"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-semibold text-[var(--color-text)]",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 p-0 opacity-70 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell:
          "rounded-md w-8 font-normal text-[0.8rem] font-semibold uppercase text-[var(--color-text-muted)]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-[rgba(37,99,235,0.08)] [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100",
        ),
        day_range_start:
          "day-range-start aria-selected:bg-[var(--color-primary)] aria-selected:text-white",
        day_range_end:
          "day-range-end aria-selected:bg-[var(--color-primary)] aria-selected:text-white",
        day_selected:
          "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)] hover:text-white focus:bg-[var(--color-primary)] focus:text-white",
        day_today: "border border-[var(--color-primary)] font-semibold",
        day_outside:
          "day-outside opacity-40",
        day_disabled: "opacity-30 cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-[rgba(37,99,235,0.12)] aria-selected:text-[var(--color-text)]",
        day_hidden: "invisible",
        ...classNames,
      }}
      style={{
        color: 'var(--color-text)',
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };
