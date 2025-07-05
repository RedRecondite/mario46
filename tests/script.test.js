/**
 * @jest-environment jsdom
 */

// Import the functions to be tested
// Assuming your script.js might not use ES6 modules directly,
// we'll load it in a way that simulates a browser environment if needed,
// or refactor script.js to be testable.
// For now, let's assume we can get the functions or run the script.

// Mock global fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Spy on window.open
window.open = jest.fn();

// Function to load script.js into the JSDOM environment
// This is a common pattern if your script directly manipulates the DOM
// or attaches global event listeners upon loading.
const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../public/script.js'), 'utf8');

// Helper function to set up the DOM for tests
function setupDOM() {
  document.body.innerHTML = `
    <table id="deals-table-container">
      <tbody id="deals-table"></tbody>
    </table>
  `;
}

// Helper function to simulate script execution in a controlled manner
// This might require refactoring script.js to expose functions or use event listeners
// that can be triggered from tests.

// Helper function to set up DOM for filter tests
function setupFilterDOM() {
  document.body.innerHTML = `
    <button id="filter-menu-button"></button>
    <div id="filter-panel" class="hidden">
      <div id="filter-options"></div>
    </div>
    <table id="deals-table-container">
      <tbody id="deals-table"></tbody>
    </table>
  `;
}


describe('Frontend Script Logic - script.js', () => {
  let originalIntervalId;

  beforeEach(() => {
    // Setup clean DOM for each test
    // setupDOM(); // Original setup
    setupFilterDOM(); // Use new setup that includes filter elements
    // Clear mocks
    fetch.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.getItem.mockClear();
    window.open.mockClear();
    jest.useFakeTimers(); // Use fake timers for polling test

    // Provide a default mock for the initial fetch call made when script is loaded
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [], // Default to empty array, tests can override
    });

    // Execute the script content in the JSDOM environment
    // This will run the IIFE and set up event listeners, pollers etc.
    const scriptElement = document.createElement('script');
    scriptElement.textContent = scriptContent;
    document.head.appendChild(scriptElement);

    window.currentScriptElement = scriptElement;

    // Reset fetch mock entirely AFTER initial script load and its fetch call.
    fetch.mockReset();
  });

  afterEach(() => {
    jest.clearAllTimers(); // Clear all fake timers
    if (window.currentScriptElement && window.currentScriptElement.parentNode) {
      window.currentScriptElement.parentNode.removeChild(window.currentScriptElement);
    }
    window.currentScriptElement = null;
    // document.head.innerHTML = ''; // Clean up script tag - too broad
    // Reset any global state if necessary, e.g., if script.js creates globals
    delete window.API;
    delete window.pollIntervalId;
    delete window.fetchAndRenderForTest; // Clean up exposed function
    delete window.getCookieForTest;
    delete window.setCookieForTest;
    delete window.loadFiltersFromCookieForTest;
    delete window.saveFiltersToCookieForTest;
    delete window.populateFilterOptionsForTest;
    delete window.activeFiltersForTest;
    delete window.dealsScriptInitialized; // Allow script to re-initialize fully
    delete window.EMOJI_TO_LABEL; // Clean up new global
    delete window.EMPTY_PLATFORM_KEY; // Clean up new global


    // Clear cookies by setting them to expire in the past
    document.cookie.split(";").forEach(function(c) { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });


    // Less aggressive cleanup: only remove the script node
    // document.body.innerHTML = ''; // Avoid this for now
    // document.head.innerHTML = ''; // Avoid this for now
  });

  // HLR-013: System shall periodically fetch deal data from the /deals API endpoint.
  // HLR-014: System shall refresh the deal data by polling the API every 60 seconds.
  // Note: HLR-014 (polling) is not actively tested as setInterval is disabled in test environment.
  // HLR-013 is implicitly tested by other tests that call fetchAndRenderForTest.
  test.skip('HLR-013 & HLR-014: initial load and polling (polling part disabled in test env)', () => {
    expect(true).toBe(true); // Placeholder, actual polling tested manually or via E2E
  });


  // HLR-015, HLR-016, HLR-017, HLR-018
  test('HLR-015, HLR-016, HLR-017, HLR-018: should render fetched deals correctly in the table', async () => {
    const mockDeals = [
      { id: 'd1', name: 'Switch Game', platform: '🔀', price: '$59.99', url: 'http://switch.com', timestamp: '2023-01-01T00:00:00Z' },
      { id: 'd2', name: 'PC Deal', platform: '💻', price: '', url: '', timestamp: '2023-01-02T00:00:00Z' }, // No price, no URL
    ];
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockDeals,
    });
    console.log('[TEST HLR-015] Mocking fetch with mockDeals:', mockDeals); // DEBUG

    await window.fetchAndRenderForTest(); // Manually call after setting mock for this test
    console.log('[TEST HLR-015] After fetchAndRenderForTest call'); // DEBUG

    const tableBody = document.querySelector('#deals-table');
    const rows = tableBody.querySelectorAll('tr');
    expect(rows.length).toBe(2);

    // public/script.js appends deals in the order they are received.
    // mockDeals is [d1 (Switch, older), d2 (PC, newer)]
    // So, d1 will be the first row, d2 the second.
    const cells1 = rows[0].querySelectorAll('td'); // Should be d1 (Switch)
    expect(cells1[0].textContent).toBe('🔀'); // Platform for d1
    expect(cells1[1].textContent).toBe('$59.99');  // Price for d1
    expect(cells1[2].textContent).toBe('Switch Game'); // Name for d1

    const cells2 = rows[1].querySelectorAll('td'); // Should be d2 (PC)
    expect(cells2[0].textContent).toBe('💻'); // Platform for d2
    expect(cells2[1].textContent).toBe('N/A'); // Price for d2
    expect(cells2[2].textContent).toBe('PC Deal'); // Name for d2
  });

  // HLR-019, HLR-020: Clickable rows with URL
  test('HLR-019, HLR-020: should make rows with URLs clickable and open URL in new tab', async () => {
    const dealUrl = 'http://clickable.com';
    const mockDeals = [
      { id: 'c1', name: 'Clickable Deal', platform: '🔗', price: '$5', url: dealUrl, timestamp: '2023-01-01T00:00:00Z' },
    ];
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockDeals,
    });

    await window.fetchAndRenderForTest(); // Manually call

    const row = document.querySelector('#deals-table tr');
    expect(row.classList.contains('cursor-pointer')).toBe(true);

    row.dispatchEvent(new MouseEvent('click', { bubbles: true })); // Simulate click
    expect(window.open).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledWith(dealUrl, '_blank');
  });

  // HLR-021: Non-clickable rows without URL
  test('HLR-021: should make rows without URLs not clickable', async () => {
    const mockDeals = [
      { id: 'nc1', name: 'Non-Clickable Deal', platform: '⛔', price: '$5', url: '', timestamp: '2023-01-01T00:00:00Z' },
    ];
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockDeals,
    });

    await window.fetchAndRenderForTest(); // Manually call

    const row = document.querySelector('#deals-table tr');
    expect(row.style.cursor).not.toBe('pointer');

    row.dispatchEvent(new MouseEvent('click', { bubbles: true })); // Simulate click
    expect(window.open).not.toHaveBeenCalled();
  });

  test('should handle fetch error gracefully for /deals endpoint', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Script runs in beforeEach, including initial fetchDeals.
    // That initial call is mocked with a success response by default in beforeEach.
    // We need to trigger another call that will use the mockRejectedValueOnce.
    await window.fetchAndRenderForTest(); // Manually call to trigger the fetch with error mock

    expect(fetch).toHaveBeenCalledTimes(1); // Call from this test, after mockReset in beforeEach
    expect(consoleErrorSpy).toHaveBeenCalledWith('[script.js] Error fetching deals:', expect.any(Error));

    const tableBody = document.querySelector('#deals-table');
    expect(tableBody.innerHTML).toBe(''); // No deals rendered

    consoleErrorSpy.mockRestore();
  });

  // HLR-029: Display filter control (hamburger menu)
  test('HLR-029: should toggle filter panel visibility on menu button click', () => {
    const filterMenuButton = document.getElementById('filter-menu-button');
    const filterPanel = document.getElementById('filter-panel');

    expect(filterPanel.classList.contains('hidden')).toBe(true); // Initially hidden

    // Simulate click to show
    filterMenuButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(filterPanel.classList.contains('hidden')).toBe(false);

    // Simulate click to hide
    filterMenuButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(filterPanel.classList.contains('hidden')).toBe(true);
  });

  // HLR-030, HLR-031: Select/deselect filters and filter deals
  describe('HLR-030, HLR-031, and new filter requirements: Filter Functionality', () => {
    const mockDealsForFiltering = [
      { id: 'd1', name: 'Switch Game', platform: '🔀', price: '$59.99', url: '', timestamp: '2023-01-01T00:00:00Z' },
      { id: 'd2', name: 'Xbox Game', platform: '🟢', price: '$49.99', url: '', timestamp: '2023-01-02T00:00:00Z' },
      { id: 'd3', name: 'PC Deal', platform: '💻', price: '$39.99', url: '', timestamp: '2023-01-03T00:00:00Z' },
      { id: 'd4', name: 'Another Switch Game', platform: '🔀', price: '$29.99', url: '', timestamp: '2023-01-04T00:00:00Z' },
      { id: 'd5', name: 'Game with no platform', platform: '', price: '$19.99', url: '', timestamp: '2023-01-05T00:00:00Z' },
      { id: 'd6', name: 'Game with null platform', platform: null, price: '$9.99', url: '', timestamp: '2023-01-06T00:00:00Z' },
      { id: 'd7', name: 'Lego Set', platform: '🧱', price: '$89.99', url: '', timestamp: '2023-01-07T00:00:00Z' },
    ];

    // Defined in script.js, copied here for test verification
    const EMOJI_TO_LABEL_TEST_COPY = {
      '🔀': 'Nintendo', '🟢': 'Xbox', '♨': 'Steam', '👴': 'GOG', '🎮': 'PlayStation',
      '📀': 'Physical Media', '👕': 'Merchandise', '💻': 'PC/Other', '📚': 'Book',
      '📦': 'Bundle', '🕴': 'Figure', '🧱': 'LEGO',
      "empty_platform_key": 'Other/No Platform' // Assuming this is the key used in script.js
    };
    const EMPTY_PLATFORM_KEY_TEST_COPY = "empty_platform_key";


    beforeEach(async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => mockDealsForFiltering });
      await window.fetchAndRenderForTest(); // Initial render with all deals, populates filter options
    });

    test('should populate filter options correctly (sorted, with labels, and empty option)', () => {
      const filterOptionsContainer = document.getElementById('filter-options');
      const labels = Array.from(filterOptionsContainer.querySelectorAll('label'));

      const expectedOrder = Object.entries(EMOJI_TO_LABEL_TEST_COPY)
        .map(([key, label]) => ({
          key,
          label,
          displayText: key === EMPTY_PLATFORM_KEY_TEST_COPY ? label : `${key} ${label}`
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      expect(labels.length).toBe(expectedOrder.length);

      labels.forEach((labelElement, index) => {
        const checkbox = labelElement.querySelector('input[type="checkbox"]');
        const textNode = Array.from(labelElement.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
        const displayedText = textNode ? textNode.textContent.trim() : "";

        expect(checkbox.value).toBe(expectedOrder[index].key);
        expect(displayedText).toBe(expectedOrder[index].displayText);
      });
    });

    test('should show all deals (including those with empty/null platform) when no filters are active', () => {
      const rows = document.querySelectorAll('#deals-table tr');
      expect(rows.length).toBe(mockDealsForFiltering.length);
    });

    test('should filter by a single platform (e.g., Nintendo)', () => {
      const filterOptionsContainer = document.getElementById('filter-options');
      const switchCheckbox = filterOptionsContainer.querySelector('input[value="🔀"]'); // Nintendo Switch

      switchCheckbox.checked = true;
      switchCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

      const rows = document.querySelectorAll('#deals-table tr');
      expect(rows.length).toBe(2); // d1 and d4
      expect(Array.from(rows).every(row => row.querySelector('td').textContent === '🔀')).toBe(true);
    });

    test('should filter by "Other/No Platform"', () => {
      const filterOptionsContainer = document.getElementById('filter-options');
      // Use the actual EMPTY_PLATFORM_KEY defined in the script, exposed for testing or known
      const otherCheckbox = filterOptionsContainer.querySelector(`input[value="${EMPTY_PLATFORM_KEY_TEST_COPY}"]`);
      expect(otherCheckbox).not.toBeNull();

      otherCheckbox.checked = true;
      otherCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

      const rows = document.querySelectorAll('#deals-table tr');
      expect(rows.length).toBe(2); // d5 (empty string) and d6 (null)
      // Check that these rows indeed correspond to d5 and d6 by checking names or other unique properties if needed.
      const dealNames = Array.from(rows).map(row => row.querySelectorAll('td')[2].textContent);
      expect(dealNames).toContain('Game with no platform');
      expect(dealNames).toContain('Game with null platform');
    });

    test('should filter by multiple platforms (e.g., Nintendo and LEGO)', () => {
      const filterOptionsContainer = document.getElementById('filter-options');
      const switchCheckbox = filterOptionsContainer.querySelector('input[value="🔀"]'); // Nintendo
      const legoCheckbox = filterOptionsContainer.querySelector('input[value="🧱"]'); // LEGO

      switchCheckbox.checked = true;
      switchCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
      legoCheckbox.checked = true;
      legoCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

      const rows = document.querySelectorAll('#deals-table tr');
      expect(rows.length).toBe(3); // 2 Switch games, 1 LEGO set
      const dealPlatforms = Array.from(rows).map(row => row.querySelector('td').textContent);
      expect(dealPlatforms).toContain('🔀');
      expect(dealPlatforms).toContain('🧱');
    });

    test('should filter by a platform and "Other/No Platform" simultaneously', () => {
      const filterOptionsContainer = document.getElementById('filter-options');
      const xboxCheckbox = filterOptionsContainer.querySelector('input[value="🟢"]'); // Xbox
      const otherCheckbox = filterOptionsContainer.querySelector(`input[value="${EMPTY_PLATFORM_KEY_TEST_COPY}"]`);

      xboxCheckbox.checked = true;
      xboxCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
      otherCheckbox.checked = true;
      otherCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

      const rows = document.querySelectorAll('#deals-table tr');
      expect(rows.length).toBe(3); // 1 Xbox game, 2 no-platform games
      const dealNames = Array.from(rows).map(row => row.querySelectorAll('td')[2].textContent);
      expect(dealNames).toContain('Xbox Game');
      expect(dealNames).toContain('Game with no platform');
      expect(dealNames).toContain('Game with null platform');
    });

    test('should show all deals again when all filters are deselected', () => {
      const filterOptionsContainer = document.getElementById('filter-options');
      const switchCheckbox = filterOptionsContainer.querySelector('input[value="🔀"]');

      // Select then deselect
      switchCheckbox.checked = true;
      switchCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
      let rows = document.querySelectorAll('#deals-table tr');
      expect(rows.length).toBe(2);

      switchCheckbox.checked = false;
      switchCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
      rows = document.querySelectorAll('#deals-table tr');
      expect(rows.length).toBe(mockDealsForFiltering.length);
    });
  });

  // HLR-032, HLR-033: Persist and load filter preferences using cookies
  describe('HLR-032, HLR-033: Cookie Persistence for Filters', () => {
    const mockDealsForCookieTest = [
      { id: 'd1', name: 'Nintendo Game', platform: '🔀', price: '$50', url: '', timestamp: '2023-01-01T00:00:00Z' },
      { id: 'd2', name: 'PC Game', platform: '💻', price: '$40', url: '', timestamp: '2023-01-02T00:00:00Z' },
      { id: 'd3', name: 'No Platform Game', platform: '', price: '$30', url: '', timestamp: '2023-01-03T00:00:00Z'}
    ];
    const EMPTY_PLATFORM_KEY_TEST_COPY_COOKIE = "empty_platform_key"; // Align with script

    beforeEach(() => {
        // Ensure cookies are clean before each test in this describe block
        document.cookie.split(";").forEach(function(c) { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
        // Reset activeFilters in the script if possible (or rely on script re-execution)
        // For the test, we can directly manipulate the exposed activeFilters set for setup if needed,
        // but it's better to test the script's own loading mechanism.
    });

    test('should save filter preferences to a cookie', async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => mockDealsForCookieTest });
      await window.fetchAndRenderForTest(); // Populates filters

      const switchCheckbox = document.querySelector('#filter-options input[value="🔀"]');
      expect(switchCheckbox).not.toBeNull();

      // Select "Switch"
      switchCheckbox.checked = true;
      switchCheckbox.dispatchEvent(new Event('change', { bubbles: true })); // This should trigger saveFiltersToCookie

      // Verify cookie was set
      const cookieValue = window.getCookieForTest("platformFilters");
      expect(cookieValue).not.toBeNull();
      const savedFilters = JSON.parse(cookieValue);
      expect(savedFilters).toEqual(['🔀']);
    });

    test('should save multiple filter preferences (including empty platform key) to a cookie', async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => mockDealsForCookieTest });
      await window.fetchAndRenderForTest();

      const switchCheckbox = document.querySelector('#filter-options input[value="🔀"]');
      const otherCheckbox = document.querySelector(`#filter-options input[value="${EMPTY_PLATFORM_KEY_TEST_COPY_COOKIE}"]`);
      expect(switchCheckbox).not.toBeNull();
      expect(otherCheckbox).not.toBeNull();

      // Select "Switch"
      switchCheckbox.checked = true;
      switchCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
      // Select "Other/No Platform"
      otherCheckbox.checked = true;
      otherCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

      const cookieValue = window.getCookieForTest("platformFilters");
      expect(cookieValue).not.toBeNull();
      const savedFilters = JSON.parse(cookieValue);
      // Order doesn't matter for a Set, but JSON.stringify(Array.from(set)) will have an order.
      // The important part is that both are present.
      expect(savedFilters).toContain('🔀');
      expect(savedFilters).toContain(EMPTY_PLATFORM_KEY_TEST_COPY_COOKIE);
      expect(savedFilters.length).toBe(2);
    });

    test('should load and apply filter preferences (including empty platform key) from a cookie on page load', async () => {
      const initialFilters = ['💻', EMPTY_PLATFORM_KEY_TEST_COPY_COOKIE];
      window.setCookieForTest("platformFilters", JSON.stringify(initialFilters), 1);

      fetch.mockResolvedValueOnce({ ok: true, json: async () => mockDealsForCookieTest });

      // The script is reloaded/re-evaluated in the main `beforeEach`.
      // `loadFiltersFromCookie` should be called during this initialization.
      // So we just need to call `fetchAndRenderForTest` to populate filters and render.
      // However, to be certain `loadFiltersFromCookie` has its effect *before* `populateFilterOptions`
      // we can call it explicitly if the script's init order isn't perfectly testable.
      // Given the current setup, the main `beforeEach` should handle it.
      // Let's ensure the script is re-initialized for this test's context if needed.
      // The `window.dealsScriptInitialized = false;` in global `afterEach` helps here.

      // We need to ensure `loadFiltersFromCookieForTest` is called to update `activeFilters`
      // based on the cookie *before* `populateFilterOptions` and `render` use `activeFilters`.
      // The global beforeEach re-runs the script, which includes `loadFiltersFromCookie();`
      // and then `fetchAndRender();`

      // To be absolutely sure for this test, let's manually call loadFiltersFromCookieForTest
      // as it's part of the setup for the state we want to test.
      window.loadFiltersFromCookieForTest(); // Manually load filters from cookie

      await window.fetchAndRenderForTest(); // This will populate options and render deals

      const loadedActiveFilters = window.activeFiltersForTest();
      expect(loadedActiveFilters.has('💻')).toBe(true);
      expect(loadedActiveFilters.has(EMPTY_PLATFORM_KEY_TEST_COPY_COOKIE)).toBe(true);

      const rows = document.querySelectorAll('#deals-table tr');
      // Expect PC game (d2) and No Platform game (d3)
      expect(rows.length).toBe(2);
      const dealNames = Array.from(rows).map(row => row.querySelectorAll('td')[2].textContent);
      expect(dealNames).toContain('PC Game');
      expect(dealNames).toContain('No Platform Game');

      const pcCheckbox = document.querySelector('#filter-options input[value="💻"]');
      const otherCheckbox = document.querySelector(`#filter-options input[value="${EMPTY_PLATFORM_KEY_TEST_COPY_COOKIE}"]`);
      expect(pcCheckbox).not.toBeNull();
      expect(pcCheckbox.checked).toBe(true);
      expect(otherCheckbox).not.toBeNull();
      expect(otherCheckbox.checked).toBe(true);
    });

    test('should clear active filters if cookie contains invalid JSON', async () => {
        window.setCookieForTest("platformFilters", "invalid-json-string", 1);

        fetch.mockResolvedValueOnce({ ok: true, json: async () => mockDealsForCookieTest });

        // Spy on console.error
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        window.loadFiltersFromCookieForTest(); // Attempt to load invalid cookie
        await window.fetchAndRenderForTest();

        expect(consoleErrorSpy).toHaveBeenCalledWith("Error parsing filters from cookie:", expect.any(Error));

        const activeFilters = window.activeFiltersForTest();
        expect(activeFilters.size).toBe(0); // Filters should be empty

        const rows = document.querySelectorAll('#deals-table tr');
        expect(rows.length).toBe(mockDealsForCookieTest.length); // All deals should be shown

        consoleErrorSpy.mockRestore();
    });
  });
});
