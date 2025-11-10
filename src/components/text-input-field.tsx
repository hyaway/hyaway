"use client";
import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/20/solid";
import { Description, FieldError, Label } from "./ui/field";
import { Input, InputGroup } from "./ui/input";
import { TextField } from "./ui/text-field";
import { Button } from "./ui/button";
import type {
  TextFieldProps as AriaTextFieldProps,
  ValidationResult,
} from "react-aria-components";

export interface TextFieldProps extends AriaTextFieldProps {
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  placeholder?: string;
}

export function TextInputField({
  label,
  description,
  errorMessage,
  placeholder,
  ...props
}: TextFieldProps) {
  return (
    <TextField {...props}>
      {label && <Label>{label}</Label>}
      <Input placeholder={placeholder} />
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </TextField>
  );
}

export function SecretInputField({
  label,
  description,
  errorMessage,
  placeholder,
  ...props
}: TextFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible((prevState) => !prevState);
  return (
    <TextField {...props}>
      {label && <Label>{label}</Label>}
      <InputGroup className="[--input-gutter-end:--spacing(12)]">
        <Input
          placeholder={placeholder}
          type={isVisible ? "text" : "password"}
        />
        <Button
          intent="secondary"
          aria-pressed={isVisible}
          onPress={toggleVisibility}
          aria-label={isVisible ? "Hide API access key" : "Show API access key"}
        >
          {isVisible ? <EyeSlashIcon /> : <EyeIcon />}
        </Button>
      </InputGroup>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </TextField>
  );
}
