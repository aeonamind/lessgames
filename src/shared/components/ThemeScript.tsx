import { THEME_STORAGE_KEY } from "@/shared/lib/theme";

export function ThemeScript() {
  const script = `(function(){var k=${JSON.stringify(THEME_STORAGE_KEY)};var p=localStorage.getItem(k)||"system";var t=p;if(p==="system"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
