import { OnboardingStep } from "@/lib/domain-enums";

export function getOnboardingStepPath(step: OnboardingStep) {
  switch (step) {
    case OnboardingStep.BUSINESS:
      return "/onboarding/business";
    case OnboardingStep.SERVICES:
      return "/onboarding/services";
    case OnboardingStep.AVAILABILITY:
      return "/onboarding/availability";
    case OnboardingStep.LINK:
      return "/onboarding/link";
    case OnboardingStep.COMPLETED:
      return "/onboarding/completed";
    default:
      return "/onboarding/business";
  }
}
