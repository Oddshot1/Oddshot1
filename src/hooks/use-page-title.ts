import { useEffect } from "react";

export function usePageTitle(title: string, suffix: string = "ODDSHOT") {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | ${suffix}` : suffix;
    
    return () => {
      document.title = previousTitle;
    };
  }, [title, suffix]);
}
