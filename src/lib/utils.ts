import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRolePath(role: string): string {
  switch (role) {
    case "admin": return "super-admin";
    case "trainer": return "training-admin";
    case "trainee": return "clinical-learner";
    case "user": return "individual-learner";
    default: return "app";
  }
}

export function getRoleFromPath(path: string): string | null {
  switch (path) {
    case "super-admin": return "admin";
    case "training-admin": return "trainer";
    case "clinical-learner": return "trainee";
    case "individual-learner": return "user";
    default: return null;
  }
}
