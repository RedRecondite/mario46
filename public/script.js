if (typeof window.dealsScriptInitialized === 'undefined') {
  window.dealsScriptInitialized = true;

  // Polls /deals and renders with Tailwind styling + fade in/out
  const API = "/deals";
  const tbody = document.getElementById("deals-table");
  const cardsContainer = document.getElementById("deals-cards");
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
  function setCookie(name, value) {
    const farFutureDate = "expires=Fri, 31 Dec 9999 23:59:59 GMT";
    document.cookie = `${name}=${value || ""}; ${farFutureDate}; path=/; SameSite=Lax`;
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
    setCookie("platformFilters", JSON.stringify(Array.from(activeFilters)));
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
    if (!tbody || !cardsContainer) {
      console.error("[script.js] Table body or cards container is null in render(). Ensure #deals-table and #deals-cards exist when script loads.");
      return;
    }
    tbody.innerHTML = "";
    cardsContainer.innerHTML = "";

    const filteredDeals = deals.filter(deal => {
      if (activeFilters.size === 0) return true;
      const platformKey = (deal.platform && deal.platform.trim() !== "") ? deal.platform : EMPTY_PLATFORM_KEY;
      return activeFilters.has(platformKey);
    });

    filteredDeals.forEach((d) => {
      // Render desktop table row
      const tr = document.createElement("tr");
      tr.dataset.dealId = d.id;

      let rowClasses = "hover:bg-gray-50 transition-colors";

      if (d.url && d.url.trim() !== "") {
        tr.onclick = () => window.open(d.url, "_blank");
        rowClasses += " cursor-pointer";
      } else {
        tr.style.cursor = "default";
      }
      tr.className = rowClasses;

      const platformTd = document.createElement("td");
      platformTd.className = "px-2 py-3 text-2xl text-center";
      platformTd.textContent = d.platform || "";

      const priceTd = document.createElement("td");
      priceTd.className = "px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900";
      priceTd.textContent = (d.price && d.price.trim() !== "") ? d.price : "N/A";

      const nameTd = document.createElement("td");
      nameTd.className = "px-3 py-3 text-sm text-gray-700 break-words";
      nameTd.textContent = d.name;

      tr.append(platformTd, priceTd, nameTd);
      tbody.appendChild(tr);

      // Render mobile card
      const card = document.createElement("div");
      card.dataset.dealId = d.id;
      card.className = "bg-white rounded-lg shadow-md overflow-hidden transition-shadow hover:shadow-lg";

      if (d.url && d.url.trim() !== "") {
        card.onclick = () => window.open(d.url, "_blank");
        card.className += " cursor-pointer active:scale-[0.98] transition-transform";
      }

      const cardContent = document.createElement("div");
      cardContent.className = "p-4";

      const header = document.createElement("div");
      header.className = "flex items-start gap-3 mb-2";

      const platformSpan = document.createElement("span");
      platformSpan.className = "text-3xl flex-shrink-0";
      platformSpan.textContent = d.platform || "📦";

      const nameDiv = document.createElement("div");
      nameDiv.className = "flex-1 min-w-0";

      const nameText = document.createElement("p");
      nameText.className = "text-sm font-medium text-gray-900 leading-snug break-words";
      nameText.textContent = d.name;

      nameDiv.appendChild(nameText);
      header.append(platformSpan, nameDiv);

      const priceDiv = document.createElement("div");
      priceDiv.className = "mt-2 pt-2 border-t border-gray-100";

      const priceText = document.createElement("p");
      priceText.className = "text-lg font-semibold text-gray-900";
      priceText.textContent = (d.price && d.price.trim() !== "") ? d.price : "N/A";

      priceDiv.appendChild(priceText);
      cardContent.append(header, priceDiv);
      card.appendChild(cardContent);
      cardsContainer.appendChild(card);
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
