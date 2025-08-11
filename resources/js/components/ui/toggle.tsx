import * as React from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface ToggleProps {
  id?: string
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  description?: string
}

const Toggle = React.forwardRef<HTMLDivElement, ToggleProps>(
  ({ id, label, checked, onCheckedChange, disabled = false, className, description }, ref) => {
    const toggleId = id || `toggle-${label.toLowerCase().replace(/\s+/g, '-')}`
    
    return (
      <div ref={ref} className={cn("flex items-center space-x-3", className)}>
        <Switch
          id={toggleId}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
        />
        <div className="flex flex-col space-y-1">
          <Label
            htmlFor={toggleId}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              disabled && "cursor-not-allowed opacity-70"
            )}
          >
            {label}
          </Label>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    )
  }
)

Toggle.displayName = "Toggle"

export { Toggle }
