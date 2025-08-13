"use client"

import { useDebounce } from "@/hooks/use-debounce"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface AsyncComboboxOption {
  value: string
  label: string
  [key: string]: any // Allow additional properties
}

interface AsyncComboboxProps {
  value?: string
  onValueChange: (value: string, selectedOption?: AsyncComboboxOption) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  loadingMessage?: string
  disabled?: boolean
  className?: string
  displayValue?: string
  fetchOptions: (query: string) => Promise<AsyncComboboxOption[]>
  debounceMs?: number
}

export function AsyncCombobox({
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  loadingMessage = "Loading...",
  disabled = false,
  className,
  displayValue,
  fetchOptions,
  debounceMs = 300,
}: AsyncComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [options, setOptions] = React.useState<AsyncComboboxOption[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedOption, setSelectedOption] = React.useState<AsyncComboboxOption | null>(null)

  const debouncedSearchQuery = useDebounce(searchQuery, debounceMs)

  // Fetch options when search query changes
  React.useEffect(() => {
    const loadOptions = async () => {
      if (!open) return

      setIsLoading(true)
      try {
        const fetchedOptions = await fetchOptions(debouncedSearchQuery)
        setOptions(fetchedOptions)
      } catch (error) {
        console.error('Failed to fetch options:', error)
        setOptions([])
      } finally {
        setIsLoading(false)
      }
    }

    loadOptions()
  }, [debouncedSearchQuery, open, fetchOptions])

  // Load initial options when opening
  React.useEffect(() => {
    if (open && options.length === 0 && !isLoading) {
      const loadInitialOptions = async () => {
        setIsLoading(true)
        try {
          const fetchedOptions = await fetchOptions("")
          setOptions(fetchedOptions)
        } catch (error) {
          console.error('Failed to fetch initial options:', error)
          setOptions([])
        } finally {
          setIsLoading(false)
        }
      }

      loadInitialOptions()
    }
  }, [open, options.length, isLoading, fetchOptions])

  // Find selected option when value changes
  React.useEffect(() => {
    if (value && options.length > 0) {
      const found = options.find(option => option.value === value)
      setSelectedOption(found || null)
    } else {
      setSelectedOption(null)
    }
  }, [value, options])

  const displayText = displayValue || (selectedOption ? selectedOption.label : placeholder)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {displayText}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">{loadingMessage}</span>
              </div>
            ) : (
              <>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={(currentValue) => {
                        const selectedValue = currentValue === value ? "" : currentValue
                        const selectedOption = selectedValue ? option : undefined
                        onValueChange(selectedValue, selectedOption)
                        setOpen(false)
                        setSearchQuery("")
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
