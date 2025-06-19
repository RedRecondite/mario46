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
    
    // Base classes without cursor-pointer
    let rowClasses = "transition-opacity duration-10000 hover:bg-gray-50";

    if (seen.has(d.id)) {
      rowClasses += " opacity-80";
    } else {
      rowClasses += " opacity-100";
    }

    // Conditional click handler and cursor style based on d.url
    if (d.url && d.url.trim() !== "") {
      tr.onclick = () => window.open(d.url, "_blank");
      rowClasses += " cursor-pointer";
    }
    
    tr.className = rowClasses;

    const platformTd = document.createElement("td");
    platformTd.className = "px-6 py-4 whitespace-nowrap text-sm text-center"; // Emoji itself has color
    platformTd.textContent = d.platform;

    const priceTd = document.createElement("td");
    priceTd.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-700 min-w-[6rem]";
    priceTd.textContent = (d.price && d.price.trim() !== "") ? d.price : "N/A";

    const nameTd = document.createElement("td");
    nameTd.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-900";
    nameTd.textContent = d.name;

    tr.append(platformTd, priceTd, nameTd);
    tbody.appendChild(tr);

    if (!seen.has(d.id)) {
      setTimeout(() => {
        tr.classList.replace("opacity-100", "opacity-80");
        seen.add(d.id);
        newSeen.push(d.id);
        localStorage.setItem("seenDeals", JSON.stringify(newSeen));
      }, 0);
    }
  });
}

fetchAndRender();
setInterval(fetchAndRender, 60 * 1000);
