import type { TextareaProps } from "@chakra-ui/react";
import { Textarea } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { useField } from "./ActionContextProvider";
import type { CustomFormControlProps } from "./CustomFormControl";
import CustomFormControl from "./CustomFormControl";

interface Props extends TextareaProps {
  label: string
  formControlProps?: Omit<CustomFormControlProps, "label" | "children" | "error">
}
export function CustomTextArea (props: Props) {
  const { label, formControlProps, name, ...restOfProps } = props;
  const ref = useRef<HTMLTextAreaElement>(null);
  const { value, error } = useField(name!);

  useEffect(() => {
    if (error) {
      ref.current?.scrollIntoView();
    }
  }, [error]);

  return (
    <CustomFormControl
      py={1}
      {...formControlProps}
      label={label}
      error={error?.join(", ")}
      labelProps={{
        ...formControlProps?.labelProps,
        htmlFor: formControlProps?.labelProps?.htmlFor || props.id || props.name,
      }}
    >
      <Textarea name={name} defaultValue={value} {...restOfProps} />
    </CustomFormControl>
  )
}