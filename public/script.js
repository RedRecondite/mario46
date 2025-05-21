// Polls /deals and renders with Tailwind styling + fade in/out
const API = "/deals";
const tbody = document.getElementById("deals-table");
let seen = new Set(JSON.parse(localStorage.getItem("seenDeals") || "[]"));

async function fetchAndRender() {
  try {
    const data = await fetch(API).then((r) => r.json());
    render(data);
  } catch (e) {
    console.error(e);
  }
}

function render(deals) {
  tbody.innerHTML = "";
  const newSeen = [...seen];

  deals.forEach((d) => {
    const tr = document.createElement("tr");
    tr.className = "transition-opacity duration-10000 cursor-pointer hover:bg-gray-50";
    if (seen.has(d.id)) tr.classList.add("opacity-30"); else tr.classList.add("opacity-100");
    tr.onclick = () => window.open(d.url, "_blank");

    const nameTd = document.createElement("td");
    nameTd.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-900";
    nameTd.textContent = d.name;

    const priceTd = document.createElement("td");
    priceTd.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-700";
    priceTd.textContent = d.price;

    tr.append(nameTd, priceTd);
    tbody.appendChild(tr);

    if (!seen.has(d.id)) {
      setTimeout(() => {
        tr.classList.replace("opacity-100", "opacity-30");
        seen.add(d.id);
        newSeen.push(d.id);
        localStorage.setItem("seenDeals", JSON.stringify(newSeen));
      }, 0);
    }
  });
}

fetchAndRender();
setInterval(fetchAndRender, 60 * 1000);