import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
};

export const toast = {
  error: (options: string | ToastProps) => {
    if (typeof options === "string") {
      return sonnerToast.error(options);
    }
    
    const { title, description } = options;
    return sonnerToast.error(title || "Error", {
      description,
    });
  },
  
  success: (options: string | ToastProps) => {
    if (typeof options === "string") {
      return sonnerToast.success(options);
    }
    
    const { title, description } = options;
    return sonnerToast.success(title || "Success", {
      description,
    });
  },
  
  info: (options: string | ToastProps) => {
    if (typeof options === "string") {
      return sonnerToast(options);
    }
    
    const { title, description } = options;
    return sonnerToast(title || "Info", {
      description,
    });
  },
}; 