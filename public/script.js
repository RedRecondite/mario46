if (typeof window.dealsScriptInitialized === 'undefined') {
  window.dealsScriptInitialized = true;

  // Polls /deals and renders with Tailwind styling + fade in/out
  const API = "/deals";
  const tbody = document.getElementById("deals-table"); // Use specific ID for tbody
  let seen; // Declare, initialize in fetchAndRender

  async function fetchAndRender() {
    // Re-initialize 'seen' from localStorage each time deals are fetched
    seen = new Set(JSON.parse(localStorage.getItem("seenDeals") || "[]"));
    try {
      const data = await fetch(API).then((r) => r.json());
      render(data);
    } catch (e) {
      console.error("[script.js] Error fetching deals:", e);
    }
  }

  function render(deals) {
    if (!tbody) {
      console.error("[script.js] Table body ('tbody' variable) is null in render(). Ensure #deals-table exists when script loads.");
      return;
    }
    tbody.innerHTML = "";
    const newSeen = [...seen]; // Create a new array to avoid modifying the set while iterating indirectly

    deals.forEach((d) => {
      const tr = document.createElement("tr");
      tr.dataset.dealId = d.id; // Add data-id for easier selection in tests

      // Base classes without cursor-pointer
      let rowClasses = "transition-opacity duration-1000 hover:bg-gray-50"; // Reduced duration for faster tests if it was an issue

      if (seen.has(d.id)) {
        rowClasses += " opacity-50"; // Made it more distinct for testing
      } else {
        rowClasses += " opacity-100";
      }

      // Conditional click handler and cursor style based on d.url
      if (d.url && d.url.trim() !== "") {
        tr.onclick = () => window.open(d.url, "_blank");
        rowClasses += " cursor-pointer";
      } else {
        tr.style.cursor = "default"; // Explicitly set default cursor
      }

      tr.className = rowClasses;

      const platformTd = document.createElement("td");
      platformTd.className = "p-0 px-6 py-4 whitespace-nowrap text-xl text-center";
      platformTd.textContent = d.platform;

      const priceTd = document.createElement("td");
      priceTd.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-700 min-w-[6rem]";
      priceTd.textContent = (d.price && d.price.trim() !== "") ? d.price : "N/A";

      const nameTd = document.createElement("td");
      nameTd.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-900";
      nameTd.textContent = d.name;

      tr.append(platformTd, priceTd, nameTd);
      tbody.appendChild(tr);

      // Mark as seen after rendering
      if (!seen.has(d.id)) {
        // For testing, we might want to avoid setTimeout if it complicates things,
        // but for now, let's keep it to reflect original behavior.
        // The visual update will happen, then seen status.
        seen.add(d.id);
        newSeen.push(d.id);
      }
    });
    // Update localStorage once after processing all deals for the current render cycle
    localStorage.setItem("seenDeals", JSON.stringify(Array.from(newSeen)));
  }

  // Initial fetch and render
  fetchAndRender();
  // Set up polling if not in a test environment or if explicitly allowed
  if (typeof jest === 'undefined') { // Simple check; could be more robust
    setInterval(fetchAndRender, 60 * 1000);
  }

  // Expose for testing
  window.fetchAndRenderForTest = fetchAndRender;

} // End of initialization check
