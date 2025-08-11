import * as React from "react"
import { cn } from "@/lib/utils"

interface FormSectionProps {
  title: string
  children: React.ReactNode
  className?: string
  description?: string
}

const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ title, children, className, description }, ref) => {
    return (
      <div ref={ref} className={cn("rounded-lg border bg-muted/30 p-6", className)}>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {children}
      </div>
    )
  }
)

FormSection.displayName = "FormSection"

export { FormSection }
