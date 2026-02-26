import { ComponentType } from "react";

export interface PlaygroundCardProps {
  title: string;
  description: string;
  href: string;
  preview: ComponentType;
  accentColor?: string;
}
