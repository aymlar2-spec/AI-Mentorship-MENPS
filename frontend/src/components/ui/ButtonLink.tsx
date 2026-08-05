import { forwardRef, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button-styles";

export interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

/**
 * ButtonLink — MENPS design-system primitive.
 * Renders a react-router <Link> styled identically to <Button>, for
 * "navigate to this route" actions. Never nest a Link inside a Button —
 * use this instead so the DOM stays a single interactive element.
 */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      leftIcon,
      rightIcon,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <Link ref={ref} className={buttonClasses({ variant, size, fullWidth, className })} {...rest}>
        {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </Link>
    );
  },
);

ButtonLink.displayName = "ButtonLink";
