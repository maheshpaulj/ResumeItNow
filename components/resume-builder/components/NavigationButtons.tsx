import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface NavigationButtonsProps {
  step: number;
  totalSteps: number;
  onPrevious: () => void;
  isSubmitting?: boolean;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  step,
  totalSteps,
  onPrevious,
  isSubmitting = false
}) => {
  const isLastStep = step === totalSteps - 1;

  return (
    <div className="flex justify-between mt-8 gap-4">
      {step > 0 ? (
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={isSubmitting}
        >
          Previous
        </Button>
      ) : <div />}

      <Button
        type="submit"
        disabled={isSubmitting}
        className={step === 0 ? "w-full" : ""}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isLastStep ? 'Saving...' : 'Processing...'}
          </>
        ) : (
          isLastStep ? 'Save Resume' : 'Next'
        )}
      </Button>
    </div>
  );
};