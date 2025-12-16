import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  { label: "Ít nhất 8 ký tự", test: (p) => p.length >= 8 },
  { label: "Có chữ hoa (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "Có chữ thường (a-z)", test: (p) => /[a-z]/.test(p) },
  { label: "Có số (0-9)", test: (p) => /[0-9]/.test(p) },
  { label: "Có ký tự đặc biệt (!@#$%^&*)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const { strength, passedCount } = useMemo(() => {
    const passed = requirements.filter((req) => req.test(password));
    const count = passed.length;
    
    let strengthLevel: "weak" | "fair" | "good" | "strong" = "weak";
    if (count >= 5) strengthLevel = "strong";
    else if (count >= 4) strengthLevel = "good";
    else if (count >= 2) strengthLevel = "fair";
    
    return { strength: strengthLevel, passedCount: count };
  }, [password]);

  if (!password) return null;

  const strengthColors = {
    weak: "bg-destructive",
    fair: "bg-orange-500",
    good: "bg-yellow-500",
    strong: "bg-green-500",
  };

  const strengthLabels = {
    weak: "Yếu",
    fair: "Trung bình",
    good: "Khá tốt",
    strong: "Mạnh",
  };

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              passedCount >= level + 1 ? strengthColors[strength] : "bg-muted"
            )}
          />
        ))}
      </div>
      
      {/* Strength label */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">Độ mạnh:</span>
        <span className={cn(
          "text-xs font-medium",
          strength === "strong" && "text-green-500",
          strength === "good" && "text-yellow-500",
          strength === "fair" && "text-orange-500",
          strength === "weak" && "text-destructive"
        )}>
          {strengthLabels[strength]}
        </span>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1">
        {requirements.map((req, index) => {
          const passed = req.test(password);
          return (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                passed ? "text-green-500" : "text-muted-foreground"
              )}
            >
              {passed ? (
                <Check className="w-3 h-3" />
              ) : (
                <X className="w-3 h-3" />
              )}
              <span>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
