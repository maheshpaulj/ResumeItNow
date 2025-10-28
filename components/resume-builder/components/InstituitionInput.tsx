import { FieldErrors, UseFormRegister } from "react-hook-form";
import { FormValues } from "../types";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface InstituitionInputProps {
    register: UseFormRegister<FormValues>;
    errors: FieldErrors<FormValues>;
    index: number;
}
interface InstitutionData {
    name: string;
    country: string;
}

export const InstituitionInputComponent: React.FC<InstituitionInputProps> = ({ register, errors, index }) => {
    const storedData = localStorage.getItem("resumeitnow_form_data");
    const defaultInstitution = storedData ? JSON.parse(storedData)?.formData?.education?.[index]?.institution || "" : "";
    const [open, setOpen] = useState(false);
    const [institution, setInstitution] = useState<string | null>(null);
    const universitiesList: InstitutionData[] = [
        { name: "Harvard University", country: "United States" },
        { name: "Stanford University", country: "United States" },
        { name: "University of Oxford", country: "United Kingdom" },
        { name: "University of Cambridge", country: "United Kingdom" },
        { name: "Massachusetts Institute of Technology (MIT)", country: "United States" },
        { name: "University of Tokyo", country: "Japan" },
    ];
    return (
        <div className="space-y-2">
            <Label>Institution</Label>
            <div className="flex gap-2">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                        >
                            {institution ? institution : (defaultInstitution || "Select Institution")}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 max-h-64 overflow-y-auto">
                        <Command>
                            <CommandInput placeholder="Search for institution..." />
                            <CommandEmpty>No institution found.</CommandEmpty>
                            <CommandGroup>
                                {
                                    universitiesList.map((university) => (
                                        <CommandItem
                                            key={university.name}
                                            onSelect={(value) => {
                                                setInstitution(value);
                                                setOpen(false);
                                                register(`education.${index}.institution`).onChange({
                                                    target: { value: value, name: `education.${index}.institution` }
                                                });
                                                register(`education.${index}.location`).onChange({
                                                    target: { value: university.country, name: `education.${index}.location` }
                                                });
                                            }}
                                        >
                                            {university.name} ({university.country})
                                            <Check
                                                className={cn(
                                                    "ml-auto h-4 w-4",
                                                    institution === university.name ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                    ))
                                }
                            </CommandGroup>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
            {errors.education?.[index]?.institution &&
                <p className="text-destructive text-sm">{errors.education[index]?.institution?.message}</p>}
        </div>
    )
}