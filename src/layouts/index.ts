import type { ComponentType } from "react";
import type { DashboardData } from "@/hooks/use-dashboard-data";
import type { LayoutId } from "@/lib/layout-context";
import { DetailedLayout } from "./detailed-layout";
import { FocusLayout } from "./focus-layout";
import { SimpleLayout } from "./simple-layout";

export type LayoutComponent = ComponentType<{ data: DashboardData }>;

export const LAYOUT_COMPONENTS: Record<LayoutId, LayoutComponent> = {
  detailed: DetailedLayout,
  focus: FocusLayout,
  simple: SimpleLayout,
};
