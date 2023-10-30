import { LabelHTMLAttributes } from "react";
import { UseLabelProps, UseLabelReturn } from "../useLabel/useLabel";

export type UseTextFieldProps = UseLabelProps & {
  // TODO: Add textarea support
  inputElementType?: "input" | undefined;
};
