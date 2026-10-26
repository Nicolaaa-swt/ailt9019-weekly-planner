import type { Metadata } from "next";
import "./planner.css";
import "./entries.css";
import "./viewport.css";
import "./navigation.css";
import "./toolbar.css";
import "./quick-add.css";
import "./scheduler.css";

export const metadata: Metadata = {
  title: "Weekspace — Weekly Planner",
  description: "A little structure. More room to focus. Your minimal weekly calendar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
