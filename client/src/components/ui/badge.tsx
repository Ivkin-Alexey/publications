import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Добавляем варианты для категорий
        q1: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
        q2: "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
        q3: "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        q4: "border-transparent bg-orange-100 text-orange-800 hover:bg-orange-200",
        vak: "border-transparent bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
        rinc: "border-transparent bg-cyan-100 text-cyan-800 hover:bg-cyan-200",
        patent: "border-transparent bg-purple-100 text-purple-800 hover:bg-purple-200",
        dissertation: "border-transparent bg-pink-100 text-pink-800 hover:bg-pink-200",
        neutral: "border-transparent bg-neutral-100 text-neutral-800 hover:bg-neutral-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
