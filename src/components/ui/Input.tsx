import { InputHTMLAttributes, forwardRef, ReactNode } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, hint, error, leading, trailing, className = "", ...rest }, ref) => (
    <label className="block">
      {label && (
        <span className="t-label-m text-ink-secondary block mb-2">
          {label}
        </span>
      )}
      <span
        className={`flex items-center gap-2 h-12 px-3 rounded-[var(--radius-m)] bg-sunken focus-within:bg-raised border ${
          error
            ? "border-error"
            : "border-hairline/40 focus-within:border-postage focus-within:border-[1.5px]"
        }`}
      >
        {leading && <span className="text-ink-tertiary">{leading}</span>}
        <input
          ref={ref}
          className={`flex-1 bg-transparent outline-none t-body-l placeholder:text-ink-tertiary ${className}`}
          {...rest}
        />
        {trailing && <span className="text-ink-tertiary">{trailing}</span>}
      </span>
      {(hint || error) && (
        <span
          className={`t-body-s mt-1.5 block ${
            error ? "text-error" : "text-ink-tertiary"
          }`}
        >
          {error ?? hint}
        </span>
      )}
    </label>
  ),
);
Input.displayName = "Input";
