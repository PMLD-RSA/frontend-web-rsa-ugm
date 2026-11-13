import Image from "next/image";
import type { IconType } from "react-icons";
import {
  LuBell,
  LuCalendarDays,
  LuCheck,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuCircle,
  LuCircleAlert,
  LuCircleCheck,
  LuClock3,
  LuDatabase,
  LuDownload,
  LuFileSpreadsheet,
  LuFileText,
  LuSearch,
  LuSlidersHorizontal,
  LuTriangleAlert,
  LuX,
} from "react-icons/lu";

const icons: Record<string, IconType> = {
  search: LuSearch,
  notification: LuBell,
  download: LuDownload,
  filter: LuSlidersHorizontal,
  calendar: LuCalendarDays,
  "calendar-down": LuChevronDown,
  "calendar-left": LuChevronLeft,
  "calendar-right": LuChevronRight,
  "chevron-down": LuChevronDown,
  "select-chevron": LuChevronDown,
  "close-download": LuX,
  "close-filter": LuX,
  "report-calendar": LuCalendarDays,
  "report-date": LuCalendarDays,
  "report-tank": LuDatabase,
  "report-tank-chevron": LuChevronDown,
  "report-tick": LuCheck,
  "format-radio": LuCircle,
  "file-excel": LuFileSpreadsheet,
  "file-pdf": LuFileText,
  "filter-normal": LuCircleCheck,
  "filter-warning": LuTriangleAlert,
  "filter-critical": LuCircleAlert,
  "stat-normal": LuCircleCheck,
  "stat-warning": LuTriangleAlert,
  "stat-critical": LuCircleAlert,
  "dot-normal": LuCircle,
  "dot-warning": LuCircle,
  "dot-critical": LuCircle,
  "login-clock-figma": LuClock3,
};
const colors: Record<string, string> = {
  "filter-normal": "#42a132",
  "filter-warning": "#eab308",
  "filter-critical": "#ef4444",
  "stat-normal": "#42a132",
  "stat-warning": "#eab308",
  "stat-critical": "#ef4444",
  "dot-normal": "#42a132",
  "dot-warning": "#eab308",
  "dot-critical": "#ef4444",
  "file-excel": "#15803d",
  "file-pdf": "#dc2626",
};

/** Shared dashboard icons. Only the custom tank illustration remains an image. */
export function DashboardIcon({
  name,
  width,
  height = width,
}: {
  name: string;
  width: number;
  height?: number;
}) {
  if (name === "tank-total")
    return (
      <Image
        src="/images/dashboard/tank-total.svg"
        alt=""
        width={width}
        height={height}
        unoptimized
      />
    );
  if (name.endsWith("divider"))
    return (
      <span
        aria-hidden="true"
        style={{
          display: "block",
          width,
          maxWidth: "100%",
          height,
          background: "#d1d5db",
          flexShrink: 0,
        }}
      />
    );
  const Icon = icons[name];
  if (!Icon) throw new Error(`Unknown dashboard icon: ${name}`);
  return (
    <Icon
      aria-hidden="true"
      focusable="false"
      size={width}
      style={{ width, height, flexShrink: 0, color: colors[name] }}
      fill={name.startsWith("dot-") ? "currentColor" : "none"}
    />
  );
}
