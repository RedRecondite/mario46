if (typeof window.dealsScriptInitialized === 'undefined') {
  window.dealsScriptInitialized = true;

  // Polls /deals and renders with Tailwind styling + fade in/out
  const API = "/deals";
  const tbody = document.getElementById("deals-table");
  const filterMenuButton = document.getElementById("filter-menu-button");
  const filterPanel = document.getElementById("filter-panel");
  const filterOptionsContainer = document.getElementById("filter-options");

  let seen; // Declare, initialize in fetchAndRender
  let allDeals = []; // Store all fetched deals
  let activeFilters = new Set(); // Store active platform filters

  // Cookie handling functions
  function setCookie(name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
  }

  function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  function loadFiltersFromCookie() {
    const savedFilters = getCookie("platformFilters");
    if (savedFilters) {
      try {
        activeFilters = new Set(JSON.parse(savedFilters));
      } catch (e) {
        console.error("Error parsing filters from cookie:", e);
        activeFilters = new Set(); // Reset to empty if parsing fails
      }
    }
  }

  function saveFiltersToCookie() {
    setCookie("platformFilters", JSON.stringify(Array.from(activeFilters)), 7); // Save for 7 days
  }

  async function fetchAndRender() {
    seen = new Set(JSON.parse(localStorage.getItem("seenDeals") || "[]"));
    try {
      const data = await fetch(API).then((r) => r.json());
      allDeals = data; // Store all deals
      populateFilterOptions(allDeals); // Populate filters based on all deals
      render(allDeals); // Render with current filters
    } catch (e) {
      console.error("[script.js] Error fetching deals:", e);
    }
  }

  function populateFilterOptions(deals) {
    if (!filterOptionsContainer) return;

    const platforms = new Set(deals.map(d => d.platform).filter(p => p && p.trim() !== ""));
    // Sort platforms for consistent order, e.g., alphabetically or by frequency
    const sortedPlatforms = Array.from(platforms).sort();


    filterOptionsContainer.innerHTML = ""; // Clear existing options

    sortedPlatforms.forEach(platform => {
      const label = document.createElement("label");
      label.className = "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = platform;
      checkbox.className = "mr-2";
      checkbox.checked = activeFilters.has(platform); // Set checked based on loaded/active filters

      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          activeFilters.add(platform);
        } else {
          activeFilters.delete(platform);
        }
        saveFiltersToCookie();
        render(allDeals); // Re-render with new filters
      });

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(platform));
      filterOptionsContainer.appendChild(label);
    });
     if (sortedPlatforms.length === 0) {
        filterOptionsContainer.innerHTML = '<p class="px-4 py-2 text-sm text-gray-500">No platforms to filter.</p>';
    }
  }

  function render(deals) {
    if (!tbody) {
      console.error("[script.js] Table body ('tbody' variable) is null in render(). Ensure #deals-table exists when script loads.");
      return;
    }
    tbody.innerHTML = "";
    const newSeen = [...seen];

    const filteredDeals = deals.filter(deal => {
      // If no filters are active, show all deals
      if (activeFilters.size === 0) return true;
      // Otherwise, only show deals whose platform is in the activeFilters set
      return activeFilters.has(deal.platform);
    });

    filteredDeals.forEach((d) => {
      const tr = document.createElement("tr");
      tr.dataset.dealId = d.id;

      let rowClasses = "transition-opacity duration-1000 hover:bg-gray-50";
      if (seen.has(d.id)) {
        rowClasses += " opacity-50";
      } else {
        rowClasses += " opacity-100";
      }

      if (d.url && d.url.trim() !== "") {
        tr.onclick = () => window.open(d.url, "_blank");
        rowClasses += " cursor-pointer";
      } else {
        tr.style.cursor = "default";
      }
      tr.className = rowClasses;

      const platformTd = document.createElement("td");
      platformTd.className = "p-0 whitespace-nowrap text-2xl text-center";
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
        seen.add(d.id);
        newSeen.push(d.id);
      }
    });
    localStorage.setItem("seenDeals", JSON.stringify(Array.from(newSeen)));
  }

  // Event Listeners
  if (filterMenuButton && filterPanel) {
    filterMenuButton.addEventListener("click", () => {
      filterPanel.classList.toggle("hidden");
    });

    // Optional: Close filter panel when clicking outside
    document.addEventListener("click", (event) => {
      if (!filterPanel.contains(event.target) && !filterMenuButton.contains(event.target)) {
        filterPanel.classList.add("hidden");
      }
    });
  } else {
    console.error("[script.js] Filter menu button or panel not found.");
  }

  // Initial setup
  loadFiltersFromCookie(); // Load filters before the first fetch
  fetchAndRender(); // Initial fetch and render

  if (typeof jest === 'undefined') {
    setInterval(fetchAndRender, 60 * 1000);
  }

  // Expose for testing
  window.fetchAndRenderForTest = fetchAndRender;
  window.getCookieForTest = getCookie;
  window.setCookieForTest = setCookie;
  window.loadFiltersFromCookieForTest = loadFiltersFromCookie;
  window.saveFiltersToCookieForTest = saveFiltersToCookie;
  window.populateFilterOptionsForTest = populateFilterOptions;
  window.activeFiltersForTest = () => activeFilters; // Expose activeFilters for testing

} // End of initialization check
