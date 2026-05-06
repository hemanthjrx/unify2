import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

document.documentElement.classList.add("dark");
document.documentElement.style.colorScheme = "dark";

// Remove Clerk's "Development mode" badge whenever it appears in the DOM
const hideClerkDevBadge = () => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    if (node.textContent?.trim() === "Development mode") {
      // Walk up to the closest block-level container and hide it
      let el: HTMLElement | null = node.parentElement;
      while (el && el.tagName !== "BODY") {
        const tag = el.tagName.toLowerCase();
        if (tag === "a" || tag === "div" || tag === "span") {
          el.style.setProperty("display", "none", "important");
          break;
        }
        el = el.parentElement;
      }
    }
  }
};
const observer = new MutationObserver(hideClerkDevBadge);
observer.observe(document.body, { childList: true, subtree: true });

createRoot(document.getElementById("root")!).render(<App />);
