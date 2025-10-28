import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { FormValues } from "../types";

interface InstitutionInputProps {
    register: UseFormRegister<FormValues>
    setValue: UseFormSetValue<FormValues>
    errors: FieldErrors<FormValues>
    index: number
}

interface Institution {
    name: string;
    country: string;
}

export const InstituitionInputComponent = ({ register, setValue, errors, index }: InstitutionInputProps) => {
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState<Institution[]>([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [institution, setInstitution] = useState<string | null>(null);
    const storedData = localStorage.getItem("resumeitnow_form_data");
    const defaultInstitution = storedData ? JSON.parse(storedData)?.formData?.education?.[index]?.institution || "" : "";

    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        const fetchUniversities = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/universities?q=${debouncedQuery}`);
                if (response.ok) {
                    const data = await response.json();
                    setResults(data || []);
                } else {
                    setResults([]);
                }
            } catch (error) {
                console.error('Error fetching universities:', error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        fetchUniversities();
    }, [debouncedQuery]);

    return (
        <div className="space-y-2">
            <Label>Institution</Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                        {institution ? institution : (defaultInstitution || "Select Institution")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 max-h-64 overflow-y-auto">
                    <Command>
                        <CommandInput
                            placeholder="Search institution..."
                            value={query}
                            onValueChange={setQuery}
                        />
                        <CommandEmpty>
                            {loading ? "Loading..." : "No results found"}
                        </CommandEmpty>
                        {!loading && results.length > 0 && (
                            <CommandGroup>
                                {results.map((u) => (
                                    <CommandItem
                                        key={`${u.name}-${u.country}`}
                                        value={u.name}
                                        onSelect={() => {
                                            setInstitution(u.name);
                                            setOpen(false);
                                            setValue(`education.${index}.institution`, u.name, { shouldValidate: true });
                                            setValue(`education.${index}.location`, u.country, { shouldValidate: true });
                                        }}
                                    >
                                        {u.name} ({u.country})
                                        <Check className={cn("ml-auto h-4 w-4", institution === u.name ? "opacity-100" : "opacity-0")} />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </Command>
                </PopoverContent>
            </Popover>
            {errors.education?.[index]?.institution && (
                <p className="text-destructive text-sm">
                    {errors.education[index]?.institution?.message}
                </p>
            )}
        </div>
    );
};
