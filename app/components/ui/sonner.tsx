import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        style: {
          fontSize: "13px",
          padding: "12px 16px",
          borderRadius: "6px",
          border: "1px solid rgb(var(--border))",
          backgroundColor: "rgb(var(--background))",
          color: "rgb(var(--foreground))",
          minWidth: 300,
          maxWidth: 380,
        },
        className: "shadow-lg",
      }}
      {...props}
    />
  );
};

export { Toaster };
