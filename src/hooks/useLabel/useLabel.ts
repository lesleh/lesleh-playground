import { LabelHTMLAttributes, useId } from "react";

export type UseLabelProps = {
  id?: string | undefined;
  label?: string | undefined;
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
  labelElementType?: "label" | "span" | undefined;
};

export type UseLabelReturn = {
  labelProps: {
    id?: string | undefined;
  } & LabelHTMLAttributes<HTMLLabelElement>;
  fieldProps: LabellingProps;
};

export type LabellingProps = {
  id?: string | undefined;
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
  "aria-describedby"?: string | undefined;
  "aria-details"?: string | undefined;
};

export function useLabel({
  id: providedId,
  label,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  labelElementType = "label",
}: UseLabelProps) {
  let labelProps: UseLabelReturn["labelProps"] = {};
  let fieldProps: UseLabelReturn["fieldProps"] = {};

  const fallbackId = useId();
  const id = providedId || fallbackId;
  const labelId = useId();

  if (label) {
    ariaLabelledby = ariaLabelledby ? `${labelId} ${ariaLabelledby}` : labelId;
    labelProps = {
      id: labelId,
      htmlFor: labelElementType === "label" ? id : undefined,
    };
  } else if (!ariaLabelledby && !ariaLabel) {
    console.warn(
      "If you do not provide a visible label, you must specify an aria-label or aria-labelledby attribute for accessibility"
    );
  }

  fieldProps = {
    id,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledby,
  };

  return {
    labelProps,
    fieldProps,
  };
}
