import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, User as UserIcon } from "lucide-react";
import { AuthLayout } from "@/components/layout";
import { Button, Card, Input, Select } from "@/components/ui";
import { FormErrorBanner } from "@/components/forms";
import { useAuth } from "@/hooks/useAuth";
import {
  loginSchema,
  registerSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from "@/schemas/auth";

type AuthMode = "sign-in" | "create-account";

const ROLE_OPTIONS = [
  { value: "mentee", label: "Mentee — I'm looking for a mentor" },
  { value: "mentor", label: "Mentor — I want to guide others" },
];

interface LocationState {
  from?: { pathname: string };
}

export default function Login() {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const {
    login,
    register: registerUser,
    isSubmitting,
    error,
    clearError,
    isAuthenticated,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    clearError();
  }

  return (
    <AuthLayout>
      <Card padding="lg">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-text">
            {mode === "sign-in" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-sm text-text-muted">
            {mode === "sign-in"
              ? "Sign in to continue your mentoring journey."
              : "Join MENPS as a mentor or mentee."}
          </p>
        </div>

        <FormErrorBanner message={error} />

        <div className={error ? "mt-4" : undefined}>
          {mode === "sign-in" ? (
            <SignInForm isSubmitting={isSubmitting} onSubmit={login} />
          ) : (
            <CreateAccountForm isSubmitting={isSubmitting} onSubmit={registerUser} />
          )}
        </div>

        <p className="mt-6 text-center text-sm text-text-muted">
          {mode === "sign-in" ? (
            <>
              New to MENPS?{" "}
              <button
                type="button"
                onClick={() => switchMode("create-account")}
                className="font-medium text-primary hover:underline"
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("sign-in")}
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </Card>
    </AuthLayout>
  );
}

function SignInForm({
  isSubmitting,
  onSubmit,
}: {
  isSubmitting: boolean;
  onSubmit: (values: LoginFormValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function submit(values: LoginFormValues) {
    try {
      await onSubmit(values);
    } catch {
      // Error surfaced via AuthContext.error / FormErrorBanner above.
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        leftIcon={<Mail className="h-4 w-4" />}
        required
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        leftIcon={<Lock className="h-4 w-4" />}
        required
        error={errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" fullWidth isLoading={isSubmitting}>
        Sign in
      </Button>
    </form>
  );
}

function CreateAccountForm({
  isSubmitting,
  onSubmit,
}: {
  isSubmitting: boolean;
  onSubmit: (values: {
    full_name: string;
    email: string;
    password: string;
    role: "mentor" | "mentee";
  }) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: "", email: "", password: "", confirmPassword: "", role: "mentee" },
  });

  async function submit(values: RegisterFormValues) {
    try {
      await onSubmit({
        full_name: values.full_name,
        email: values.email,
        password: values.password,
        role: values.role,
      });
    } catch {
      // Error surfaced via AuthContext.error / FormErrorBanner above.
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
      <Input
        label="Full name"
        autoComplete="name"
        placeholder="Jane Doe"
        leftIcon={<UserIcon className="h-4 w-4" />}
        required
        error={errors.full_name?.message}
        {...register("full_name")}
      />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        leftIcon={<Mail className="h-4 w-4" />}
        required
        error={errors.email?.message}
        {...register("email")}
      />
      <Select
        label="I am joining as a"
        required
        options={ROLE_OPTIONS}
        error={errors.role?.message}
        {...register("role")}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        leftIcon={<Lock className="h-4 w-4" />}
        required
        error={errors.password?.message}
        {...register("password")}
      />
      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        leftIcon={<Lock className="h-4 w-4" />}
        required
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <Button type="submit" fullWidth isLoading={isSubmitting}>
        Create account
      </Button>
    </form>
  );
}
