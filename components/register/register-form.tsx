"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

interface RegisterFormProps {
  onSubmit: (data: {
    username: string;
    email: string;
    password: string;
  }) => void;
}

const RegisterForm = ({ onSubmit }: RegisterFormProps) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const t = useTranslations("register");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!username) newErrors.username = t("errors.usernameRequired");
    if (!email) newErrors.email = t("errors.emailRequired");
    if (!password) newErrors.password = t("errors.passwordRequired");
    if (password !== confirmPassword)
      newErrors.confirmPassword = t("errors.passwordDontMatch");
    if (!agreeToTerms) newErrors.agreeToTerms = t("errors.privacyPolicy");

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit({ username, email, password });
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* Username */}
      <div className="space-y-1">
        <Label className="leading-5" htmlFor="username">
          {t("usernameLabel")}*
        </Label>
        <Input
          type="text"
          id="username"
          placeholder={t("usernameHint")}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        {errors.username && (
          <p className="text-red-500 text-sm">{errors.username}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1">
        <Label className="leading-5" htmlFor="userEmail">
          {t("emailLabel")}*
        </Label>
        <Input
          type="email"
          id="userEmail"
          placeholder={t("emailHint")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
      </div>

      {/* Password */}
      <div className="w-full space-y-1">
        <Label className="leading-5" htmlFor="password">
          {t("passwordLabel")}*
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={isPasswordVisible ? "text" : "password"}
            placeholder="••••••••••••••••"
            className="pr-9"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPasswordVisible((prev) => !prev)}
            className="text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent"
          >
            {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
            <span className="sr-only">
              {isPasswordVisible ? "Hide password" : "Show password"}
            </span>
          </Button>
        </div>
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="w-full space-y-1">
        <Label className="leading-5" htmlFor="confirmPassword">
          {t("confirmPasswordLabel")}*
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={isConfirmPasswordVisible ? "text" : "password"}
            placeholder="••••••••••••••••"
            className="pr-9"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsConfirmPasswordVisible((prev) => !prev)}
            className="text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent"
          >
            {isConfirmPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
            <span className="sr-only">
              {isConfirmPasswordVisible ? "Hide password" : "Show password"}
            </span>
          </Button>
        </div>
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Privacy policy */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="agreeToTerms"
          className="size-6"
          checked={agreeToTerms}
          onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
        />
        <Label htmlFor="agreeToTerms">
          <p className="text-muted-foreground text-center">
            {t.rich("privacyPolicy", {
              privacyPolicyLink: (chunks) => (
                <Link
                  href="/privacy-policy"
                  className="text-card-foreground hover:underline"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </Label>
      </div>
      {errors.agreeToTerms && (
        <p className="text-red-500 text-sm">{errors.agreeToTerms}</p>
      )}

      <Button className="w-full" type="submit">
        {t("signUp")}
      </Button>
    </form>
  );
};

export default RegisterForm;
