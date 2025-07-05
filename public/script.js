if (typeof window.dealsScriptInitialized === 'undefined') {
  window.dealsScriptInitialized = true;

  // Polls /deals and renders with Tailwind styling + fade in/out
  const API = "/deals";
  const tbody = document.getElementById("deals-table");
  const filterMenuButton = document.getElementById("filter-menu-button");
  const filterPanel = document.getElementById("filter-panel");
  const filterOptionsContainer = document.getElementById("filter-options");

  const EMPTY_PLATFORM_KEY = "empty_platform_key";
  const EMOJI_TO_LABEL = {
    '🔀': 'Nintendo',
    '🟢': 'Xbox',
    '♨': 'Steam',
    '👴': 'GOG',
    '🎮': 'PlayStation',
    '📀': 'Physical Media', // (DVD, Blu-ray, 4K UHD)
    '👕': 'Merchandise', // (Shirt, Merch)
    '💻': 'PC/Other', // (PC, Computer, Controller, Windows, Cable, Laptop)
    '📚': 'Book',
    '📦': 'Bundle', // (Humble Bundle)
    '🕴': 'Figure',
    '🧱': 'LEGO',
    [EMPTY_PLATFORM_KEY]: 'Other/No Platform'
  };

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

    const platformKeys = Object.keys(EMOJI_TO_LABEL);

    let filterOptions = platformKeys.map(key => {
      const label = EMOJI_TO_LABEL[key];
      let displayText = label; // Default to label
      if (key !== EMPTY_PLATFORM_KEY) {
        // For emojis, prepend the emoji to the label, otherwise it's just the label (e.g. "Other/No Platform")
        displayText = `${key} ${label}`;
      }
      return { key, label, displayText };
    });

    // Sort by label alphabetically
    filterOptions.sort((a, b) => a.label.localeCompare(b.label));

    filterOptionsContainer.innerHTML = ""; // Clear existing options

    filterOptions.forEach(option => {
      const labelElement = document.createElement("label");
      labelElement.className = "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = option.key; // Use the key (emoji or EMPTY_PLATFORM_KEY) as the value
      checkbox.className = "mr-2";
      checkbox.checked = activeFilters.has(option.key);

      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          activeFilters.add(option.key);
        } else {
          activeFilters.delete(option.key);
        }
        saveFiltersToCookie();
        render(allDeals); // Re-render with new filters
      });

      labelElement.appendChild(checkbox);
      labelElement.appendChild(document.createTextNode(option.displayText));
      filterOptionsContainer.appendChild(labelElement);
    });

    if (filterOptions.length === 0) { // Should not happen if EMOJI_TO_LABEL is populated
        filterOptionsContainer.innerHTML = '<p class="px-4 py-2 text-sm text-gray-500">No platforms to filter.</p>';
    }
  }

  function render(deals) {
    if (!tbody) {
      console.error("[script.js] Table body ('tbody' variable) is null in render(). Ensure #deals-table exists when script loads.");
      return;
    }
    tbody.innerHTML = "";

    const filteredDeals = deals.filter(deal => {
      if (activeFilters.size === 0) return true;
      const platformKey = (deal.platform && deal.platform.trim() !== "") ? deal.platform : EMPTY_PLATFORM_KEY;
      return activeFilters.has(platformKey);
    });

    filteredDeals.forEach((d) => {
      const tr = document.createElement("tr");
      tr.dataset.dealId = d.id;

      let rowClasses = "hover:bg-gray-50"; // Removed transition-opacity and opacity classes

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
      priceTd.className = "px-3 py-2 whitespace-nowrap text-sm text-gray-700 min-w-[6rem]";
      priceTd.textContent = (d.price && d.price.trim() !== "") ? d.price : "N/A";

      const nameTd = document.createElement("td");
      nameTd.className = "px-3 py-2 whitespace-nowrap text-sm text-gray-900";
      nameTd.textContent = d.name;

      tr.append(platformTd, priceTd, nameTd);
      tbody.appendChild(tr);
    });
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
