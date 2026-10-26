import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Department = "accesorios" | "maquillaje";

interface DepartmentContextType {
  department: Department;
  setDepartment: (dept: Department) => void;
  toggleDepartment: () => void;
  isMaquillaje: boolean;
  isAccesorios: boolean;
}

const STORAGE_KEY = "valcheck_active_department";

const DepartmentContext = createContext<DepartmentContextType | undefined>(undefined);

export function DepartmentProvider({ children }: { children: ReactNode }) {
  const [department, setDepartmentState] = useState<Department>("accesorios");

  // Al montar en el cliente, sincronizar preferencia guardada
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Department | null;
      if (stored === "accesorios" || stored === "maquillaje") {
        setDepartmentState(stored);
        applyTheme(stored);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const applyTheme = (dept: Department) => {
    if (typeof document !== "undefined") {
      if (dept === "maquillaje") {
        document.documentElement.setAttribute("data-theme", "maquillaje");
        document.documentElement.classList.add("theme-maquillaje", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
        document.documentElement.classList.remove("theme-maquillaje", "dark");
      }
    }
  };

  const setDepartment = (dept: Department) => {
    setDepartmentState(dept);
    applyTheme(dept);
    try {
      localStorage.setItem(STORAGE_KEY, dept);
    } catch {
      /* ignore */
    }
  };

  const toggleDepartment = () => {
    setDepartment(department === "accesorios" ? "maquillaje" : "accesorios");
  };

  return (
    <DepartmentContext.Provider
      value={{
        department,
        setDepartment,
        toggleDepartment,
        isMaquillaje: department === "maquillaje",
        isAccesorios: department === "accesorios",
      }}
    >
      {children}
    </DepartmentContext.Provider>
  );
}

export function useDepartment() {
  const ctx = useContext(DepartmentContext);
  if (!ctx) {
    throw new Error("useDepartment debe usarse dentro de DepartmentProvider");
  }
  return ctx;
}
