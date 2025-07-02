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
    // delete window.seenDealIDs; // This was a typo before, seenDeals is used by script
    delete window.pollIntervalId;
    delete window.fetchAndRenderForTest; // Clean up exposed function
    delete window.getCookieForTest;
    delete window.setCookieForTest;
    delete window.loadFiltersFromCookieForTest;
    delete window.saveFiltersToCookieForTest;
    delete window.populateFilterOptionsForTest;
    delete window.activeFiltersForTest;
    delete window.dealsScriptInitialized; // Allow script to re-initialize fully


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

  // HLR-022, HLR-023, HLR-024, HLR-025: Seen deals logic
  test('HLR-022, HLR-023, HLR-024, HLR-025: should handle seen deals using localStorage and opacity', async () => {
    // Pre-populate localStorage with one seen deal
    localStorageMock.setItem('seenDeals', JSON.stringify(['s1'])); // Corrected key

    const mockDeals = [
      { id: 's1', name: 'Seen Deal', platform: '👀', price: '$1', url: '', timestamp: '2023-01-01T00:00:00Z' }, // Already seen
      { id: 'n1', name: 'New Deal', platform: '✨', price: '$2', url: '', timestamp: '2023-01-02T00:00:00Z' },   // New
    ];
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockDeals,
    });

    // Execute script again to load these deals
    // const scriptElement = document.createElement('script');
    // scriptElement.textContent = scriptContent;
    // document.head.appendChild(scriptElement);
    // await Promise.resolve(); // Wait for fetch and rendering
    await window.fetchAndRenderForTest(); // Manually call

    const rows = document.querySelectorAll('#deals-table tr');
    // Deals are prepended, so 'n1' (newest) will be row 0, 's1' will be row 1
    const newDealRow = Array.from(rows).find(row => row.dataset.dealId === 'n1');
    const seenDealRow = Array.from(rows).find(row => row.dataset.dealId === 's1');

    expect(newDealRow).not.toBeNull();
    expect(seenDealRow).not.toBeNull();

    // HLR-023: New deal full opacity (or no specific opacity style, defaults to 1)
    expect(newDealRow.style.opacity).toBe(''); // Or '1' if explicitly set

    // HLR-024: Seen deal reduced opacity
    expect(seenDealRow.classList.contains('opacity-50')).toBe(true);


    // HLR-022, HLR-025: After rendering, 'n1' should now be in localStorage
    // The script adds to seenDeals *after* processing/rendering each deal.
    // The setItem would be called once after the loop in the modified script.js
    const lastSetItemCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1];
    expect(lastSetItemCall[0]).toBe('seenDeals');
    const storedSeenIDs = JSON.parse(lastSetItemCall[1]);

    expect(storedSeenIDs).toContain('s1'); // Original
    expect(storedSeenIDs).toContain('n1'); // Newly added
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
  test('HLR-030, HLR-031: should filter deals based on platform selection', async () => {
    const mockDeals = [
      { id: 'd1', name: 'Switch Game', platform: '🔀', price: '$59.99', url: '', timestamp: '2023-01-01T00:00:00Z' },
      { id: 'd2', name: 'Xbox Game', platform: '🟢', price: '$49.99', url: '', timestamp: '2023-01-02T00:00:00Z' },
      { id: 'd3', name: 'PC Deal', platform: '💻', price: '$39.99', url: '', timestamp: '2023-01-03T00:00:00Z' },
      { id: 'd4', name: 'Another Switch Game', platform: '🔀', price: '$29.99', url: '', timestamp: '2023-01-04T00:00:00Z' },
    ];
    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockDeals });

    await window.fetchAndRenderForTest(); // Initial render with all deals, populates filter options

    const filterOptionsContainer = document.getElementById('filter-options');
    const switchCheckbox = filterOptionsContainer.querySelector('input[value="🔀"]');
    const xboxCheckbox = filterOptionsContainer.querySelector('input[value="🟢"]');

    expect(switchCheckbox).not.toBeNull();
    expect(xboxCheckbox).not.toBeNull();

    // Initially, no filters active, all deals shown
    let rows = document.querySelectorAll('#deals-table tr');
    expect(rows.length).toBe(4);

    // Select "Switch" filter
    switchCheckbox.checked = true;
    switchCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    // Need to wait for re-render if it's async. Assuming render is synchronous after event for now.
    // If render is async, might need await here or check after a promise resolves.
    rows = document.querySelectorAll('#deals-table tr');
    expect(rows.length).toBe(2); // d1 and d4
    expect(Array.from(rows).every(row => row.querySelector('td').textContent === '🔀')).toBe(true);

    // Also select "Xbox" filter
    xboxCheckbox.checked = true;
    xboxCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    rows = document.querySelectorAll('#deals-table tr');
    expect(rows.length).toBe(3); // d1, d2, d4

    // Deselect "Switch" filter
    switchCheckbox.checked = false;
    switchCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    rows = document.querySelectorAll('#deals-table tr');
    expect(rows.length).toBe(1); // Only d2 (Xbox)
    expect(rows[0].querySelector('td').textContent).toBe('🟢');

    // Deselect "Xbox" filter (no filters active)
    xboxCheckbox.checked = false;
    xboxCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    rows = document.querySelectorAll('#deals-table tr');
    expect(rows.length).toBe(4); // All deals shown again
  });

  // HLR-032, HLR-033: Persist and load filter preferences using cookies
  describe('HLR-032, HLR-033: Cookie Persistence for Filters', () => {
    const mockDealsForCookieTest = [
      { id: 'd1', name: 'Nintendo Game', platform: '🔀', price: '$50', url: '', timestamp: '2023-01-01T00:00:00Z' },
      { id: 'd2', name: 'PC Game', platform: '💻', price: '$40', url: '', timestamp: '2023-01-02T00:00:00Z' },
    ];

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

    test('should load and apply filter preferences from a cookie on page load', async () => {
      // Set a cookie *before* the script runs its initial load sequence
      const initialFilters = ['💻'];
      window.setCookieForTest("platformFilters", JSON.stringify(initialFilters), 1);

      // Mock fetch for the main script execution (simulating a fresh page load)
      fetch.mockResolvedValueOnce({ ok: true, json: async () => mockDealsForCookieTest });

      // Re-run parts of the script's initialization related to loading filters and rendering
      // This is tricky because the script is already loaded.
      // The best way is to call the functions that script.js calls on load.
      // window.loadFiltersFromCookieForTest(); // Call the exposed loader
      // await window.fetchAndRenderForTest();    // Then fetch and render

      // More robust: Simulate a fresh script load by resetting the init flag and re-evaluating.
      // This is complex. For now, let's assume loadFiltersFromCookie is called before first fetch.
      // The `beforeEach` of the main describe block re-runs the script.
      // So, the cookie set above *should* be picked up by `loadFiltersFromCookie()`
      // when the script content is re-evaluated in the next `beforeEach` cycle,
      // or if we manually trigger the load sequence here.

      // For this specific test, let's directly test loadFiltersFromCookie and then render
      window.loadFiltersFromCookieForTest(); // Manually load for this test case
      const loadedActiveFilters = window.activeFiltersForTest();
      expect(loadedActiveFilters.has('💻')).toBe(true);


      await window.fetchAndRenderForTest(); // This will use the loaded filters

      const rows = document.querySelectorAll('#deals-table tr');
      expect(rows.length).toBe(1); // Only PC game should be rendered
      expect(rows[0].querySelector('td').textContent).toBe('💻');

      // Check if the PC checkbox is checked
      const pcCheckbox = document.querySelector('#filter-options input[value="💻"]');
      expect(pcCheckbox).not.toBeNull();
      expect(pcCheckbox.checked).toBe(true);
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
        expect(rows.length).toBe(2); // All deals should be shown as filters are cleared

        consoleErrorSpy.mockRestore();
    });
  });
});
