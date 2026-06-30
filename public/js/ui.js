// ===== Toast notifications =====
let wrap;
function ensureWrap() {
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "toast-wrap";
    document.body.appendChild(wrap);
  }
  return wrap;
}

export function toast(message, type = "ok") {
  const w = ensureWrap();
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.textContent = message;
  w.appendChild(el);
  setTimeout(() => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 200);
  }, 2600);
}
