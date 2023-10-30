import { useLabel } from "../useLabel/useLabel";
import { UseTextFieldProps } from "./types";

export function useTextField(props: UseTextFieldProps) {
  const { labelProps, fieldProps: inputProps } = useLabel(props);

  return {
    labelProps,
    inputProps,
  };
}
