import { Card } from "@/components/ui/card";
import { UseFormRegister, FieldErrors, UseFieldArrayReturn, Controller, Control, UseFormSetValue } from "react-hook-form";
import DatePickerComponent from "../components/DatePicker";
import { FormValues } from "../types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import React from "react";
import { InstituitionInputComponent } from "@/components/resume-builder/components/InstituitionInput";

// EducationStep Component
interface EducationStepProps {
  register: UseFormRegister<FormValues>;
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  errors: FieldErrors<FormValues>;
  fields: UseFieldArrayReturn<FormValues, "education">["fields"];
  append: UseFieldArrayReturn<FormValues, "education">["append"];
  remove: UseFieldArrayReturn<FormValues, "education">["remove"];
}

export const EducationStep: React.FC<EducationStepProps> = ({
  register,
  control,
  setValue,
  errors,
  fields,
  append,
  remove
}) => {
  return (
    <div className="space-y-6">
      {fields.map((field, index) => (
        <Card key={field.id} className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Education {index + 1}</h3>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => remove(index)}
            >
              Remove
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Degree</Label>
              <Input {...register(`education.${index}.degree`)} />
              {errors.education?.[index]?.degree &&
                <p className="text-destructive text-sm">{errors.education[index]?.degree?.message}</p>}
            </div>

            <InstituitionInputComponent register={register} setValue={setValue} errors={errors} index={index} />

            <div className="space-y-2">
              <Label>Location</Label>
              <Controller
                name={`education.${index}.location`}
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Location will be auto-filled when selecting institution"
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePickerComponent
                  label="Start Date"
                  register={register}
                  schema={`education.${index}.startDate`}
                />
                <div className="">
                  <DatePickerComponent
                    label="End Date"
                    register={register}
                    schema={`education.${index}.endDate`}
                    end={true}
                  />
                  {errors.education?.[index]?.endDate &&
                    <p className="text-destructive text-sm">{errors.education[index]?.endDate?.message}</p>}
                </div>
              </div>
              {errors.education?.[index]?.startDate &&
                <p className="text-destructive text-sm">{errors.education[index]?.startDate?.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input {...register(`education.${index}.description`)} placeholder='GPA: 9.0/10' />
            </div>
          </div>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => append({
          degree: "",
          institution: "",
          location: "",
          startDate: "",
          endDate: "",
          description: ""
        })}
      >
        Add Education
      </Button>
    </div>
  );
};
