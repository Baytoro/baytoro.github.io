const mermaidLoader = document.currentScript;
const mermaidSource = mermaidLoader?.dataset.mermaidSrc;
let mermaidPromise;
let renderPromise = Promise.resolve();

function loadMermaid() {
  if (window.mermaid) return Promise.resolve(window.mermaid);
  if (mermaidPromise) return mermaidPromise;

  mermaidPromise = new Promise((resolve, reject) => {
    if (!mermaidSource) {
      reject(new Error("Missing Mermaid library URL"));
      return;
    }

    const script = document.createElement("script");
    script.src = mermaidSource;
    script.dataset.redefineMermaidLibrary = "";
    script.onload = () => {
      if (window.mermaid) {
        resolve(window.mermaid);
      } else {
        mermaidPromise = undefined;
        reject(new Error("Mermaid loaded without exposing window.mermaid"));
      }
    };
    script.onerror = () => {
      mermaidPromise = undefined;
      script.remove();
      reject(new Error(`Failed to load Mermaid from ${mermaidSource}`));
    };
    document.head.appendChild(script);
  });

  return mermaidPromise;
}

function saveOriginalCode(diagram) {
  if (!diagram.hasAttribute("data-original-code")) {
    diagram.setAttribute("data-original-code", diagram.innerHTML);
  }
}

async function renderCurrentPage(themeName) {
  let diagrams = document.querySelectorAll(".mermaid");
  if (diagrams.length === 0) return;

  diagrams.forEach(saveOriginalCode);
  const mermaid = await loadMermaid();

  // Swup may replace the page while the Mermaid library is downloading.
  diagrams = document.querySelectorAll(".mermaid");
  if (diagrams.length === 0) return;

  diagrams.forEach((diagram) => {
    saveOriginalCode(diagram);
    diagram.innerHTML = diagram.getAttribute("data-original-code");
    diagram.removeAttribute("data-processed");
  });

  mermaid.initialize({ startOnLoad: false, theme: themeName });
  await mermaid.init(undefined, diagrams);
}

window.redefineMermaid = {
  render(themeName) {
    renderPromise = renderPromise
      .catch(() => {})
      .then(() => renderCurrentPage(themeName));
    renderPromise.catch((error) => console.error("[Mermaid]", error));
    return renderPromise;
  },
};
