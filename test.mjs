// Self-contained API test — token stays in-process, only prints PASS/FAIL
const B = "http://127.0.0.1:3001/api";
const ts = Date.now();
const email = `test${ts}@spectra.id`;
const slug = `tester${ts}`.slice(0, 28);

let pass = 0, fail = 0;
function check(name, ok, detail = "") {
  if (ok) { pass++; console.log(`✅ ${name}`); }
  else { fail++; console.log(`❌ ${name} ${detail}`); }
}

async function j(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(B + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = null;
  try { data = await r.json(); } catch {}
  return { status: r.status, data };
}

(async () => {
  // 1. Register
  const reg = await j("POST", "/auth/register", { email, name: "Tester", password: "secret123" });
  check("register", reg.status === 201 && reg.data?.token, JSON.stringify(reg.data));
  const token = reg.data?.token;

  // 2. Me
  const me = await j("GET", "/auth/me", null, token);
  check("auth/me", me.status === 200 && me.data?.user?.email === email, JSON.stringify(me.data));

  // 3. Create invoice
  const inv = await j("POST", "/invoices", { client_name: "PT Maju", items: [{ desc: "Design", qty: 2, price: 500000 }], currency: "IDR" }, token);
  check("create invoice", inv.status === 201 && inv.data?.number === "INV-0001", JSON.stringify(inv.data));

  // 4. List invoices
  const list = await j("GET", "/invoices", null, token);
  check("list invoices", list.status === 200 && Array.isArray(list.data) && list.data.length === 1, JSON.stringify(list.data));

  // 5. Create bio
  const bio = await j("PUT", "/bio", { slug, title: "Tester Page", bio: "Hello", links: [{ label: "GitHub", url: "https://github.com" }] }, token);
  check("create bio", (bio.status === 200 || bio.status === 201) && bio.data?.slug === slug, JSON.stringify(bio.data));

  // 6. Public bio (no auth)
  const pub = await j("GET", `/bio/${slug}`, null, null);
  check("public bio (no auth)", pub.status === 200 && pub.data?.title === "Tester Page", JSON.stringify(pub.data));

  // 7. Create habit
  const hab = await j("POST", "/habits", { name: "Minum air", color: "green" }, token);
  check("create habit", hab.status === 201 && hab.data?.id, JSON.stringify(hab.data));
  const hid = hab.data?.id;

  // 8. Toggle habit
  const tog = await j("POST", `/habits/${hid}/toggle`, null, token);
  check("toggle habit", tog.status === 200 && tog.data?.doneToday === true, JSON.stringify(tog.data));

  // 9. Stats
  const stats = await j("GET", "/habits/stats", null, token);
  check("habit stats", stats.status === 200 && stats.data?.[0]?.streak === 1, JSON.stringify(stats.data));

  // 10. Negative (no auth)
  const neg = await j("GET", "/invoices", null, null);
  check("reject no-auth", neg.status === 401, JSON.stringify(neg.data));

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
