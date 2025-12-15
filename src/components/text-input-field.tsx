"use client";
import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/20/solid";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "./ui-primitives/field";
import { InputGroup, InputGroupInput } from "./ui-primitives/input-group";
import { Button } from "./ui-primitives/button";
import { Input } from "./ui-primitives/input";
import type {
  TextFieldProps as AriaTextFieldProps,
  ValidationResult,
} from "react-aria-components";

export interface TextFieldProps extends AriaTextFieldProps {
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  placeholder?: string;
  defaultValue?: string;
  value?: string;
}

export function TextInputField({
  label,
  description,
  errorMessage,
  placeholder,
  defaultValue,
  value,
  ...props
}: TextFieldProps) {
  return (
    <Field {...props}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Input
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{errorMessage}</FieldError>
    </Field>
  );
}

export function SecretInputField({
  label,
  description,
  errorMessage,
  placeholder,
  defaultValue,
  value,
  ...props
}: TextFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible((prevState) => !prevState);
  return (
    <Field {...props}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <InputGroup className="[--input-gutter-end:--spacing(12)]">
        <InputGroupInput
          placeholder={placeholder}
          type={isVisible ? "text" : "password"}
          defaultValue={defaultValue}
          value={value}
        />
        <Button
          variant={"secondary"}
          aria-pressed={isVisible}
          onClick={toggleVisibility}
          aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
        >
          {isVisible ? <EyeSlashIcon /> : <EyeIcon />}
        </Button>
      </InputGroup>
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{errorMessage}</FieldError>
    </Field>
  );
}
