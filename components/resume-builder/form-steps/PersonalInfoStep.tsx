import { UseFormRegister, FieldErrors } from "react-hook-form";
import { PhoneInputComponent } from "../components/PhoneInput";
import { FormValues } from "../types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// PersonalInfoStep Component
interface PersonalInfoStepProps {
    register: UseFormRegister<FormValues>;
    errors: FieldErrors<FormValues>;
  }
  
  export const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
    register,
    errors
  }) => {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input {...register("personalDetails.fullName")} className="w-full" />
          {errors.personalDetails?.fullName && 
            <p className="text-destructive text-sm">{errors.personalDetails.fullName.message}</p>}
        </div>
  
        <div className="space-y-2">
          <Label>Email</Label>
          <Input {...register("personalDetails.email")} className="w-full" />
          {errors.personalDetails?.email && 
            <p className="text-destructive text-sm">{errors.personalDetails.email.message}</p>}
        </div>
  
        <PhoneInputComponent register={register} errors={errors} />
  
        <div className="space-y-2">
          <Label>LinkedIn URL</Label>
          <Input {...register("personalDetails.linkedin")} className="w-full" />
          {errors.personalDetails?.linkedin && 
            <p className="text-destructive text-sm">{errors.personalDetails.linkedin.message}</p>}
        </div>
  
        <div className="space-y-2">
          <Label>GitHub URL</Label>
          <Input {...register("personalDetails.github")} className="w-full" />
          {errors.personalDetails?.github && 
            <p className="text-destructive text-sm">{errors.personalDetails.github.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Website Portfolio URL</Label>
          <Input {...register("personalDetails.website")} className="w-full" />
          {errors.personalDetails?.website && 
            <p className="text-destructive text-sm">{errors.personalDetails.website.message}</p>}
        </div>
  
        <div className="space-y-2">
          <Label>Location</Label>
          <Input {...register("personalDetails.location")} className="w-full" />
          {errors.personalDetails?.location && 
            <p className="text-destructive text-sm">{errors.personalDetails.location.message}</p>}
        </div>
      </div>
    );
  };