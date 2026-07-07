import React from "react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useLayout } from "@/lib/layout-context";
import { LAYOUT_COMPONENTS } from "@/layouts";

export default function Dashboard() {
  const data = useDashboardData();
  const { layoutId } = useLayout();
  const LayoutComponent = LAYOUT_COMPONENTS[layoutId];

  return <LayoutComponent data={data} />;
}
