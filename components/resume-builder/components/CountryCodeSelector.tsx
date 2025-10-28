import { useState } from "react";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check } from "lucide-react";
import callingCodes from "@/data/calling_code.json";
import { cn } from "@/lib/utils";

interface CountryCodeSelectorProps {
    value: string; // e.g. "US" (the cca2)
    onChange: (value: string, code: string) => void;
}

export const CountryCodeSelector = ({ value, onChange }: CountryCodeSelectorProps) => {
    const [open, setOpen] = useState(false);

    const selectedCountry = callingCodes.find((c) => c.country === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[140px] justify-between"
                >
                    {selectedCountry ? `${selectedCountry.code}` : "Select code"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[260px] p-0">
                <Command>
                    <CommandInput placeholder="Search country or code..." />
                    <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup>
                            {callingCodes.map((c) => (
                                <CommandItem
                                    key={c.country}
                                    value={c.country}
                                    onSelect={() => {
                                        onChange(c.country, c.code);
                                        setOpen(false);
                                    }}
                                >
                                    <span className="mr-2">{c.country}</span>
                                    <span className="text-muted-foreground">{c.code}</span>
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            value === c.country ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
