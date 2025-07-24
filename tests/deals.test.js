import { onRequest } from '../functions/deals.js';

// Mock global fetch
global.fetch = jest.fn();

describe('onRequest handler for /deals', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    fetch.mockClear();
  });

  // HLR-001, HLR-002
  test('HLR-001, HLR-002: should fetch author feed from Bluesky API with correct actor DID and limit', async () => {
    const mockSuccessResponse = {
      feed: [],
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    });

    await onRequest({});
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=did%3Aplc%3Aknj5sw5al3sukl6vhkpi7637&limit=50'
    );
  });

  // HLR-003
  test('HLR-003: should return HTTP 502 if Bluesky API fetch is not successful', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const response = await onRequest({});
    expect(response.status).toBe(502);
    const text = await response.text();
    expect(text).toBe('Bluesky fetch error (500)');
  });

  const mockPostBuilder = (overrides = {}) => {
    const defaultCid = `cid-${Math.random().toString(36).substring(7)}`;
    const defaultText = 'Default post text with link http://example.com and price $19.99';
    const defaultCreatedAt = new Date().toISOString();

    const recordOverrides = overrides.record || {};
    let postOverrides = overrides.post || {};

    // Ensure that if postOverrides has 'cid', it doesn't wipe out 'record'
    // by merging with a default structure for 'post' that includes 'record'.
    const finalPost = {
      cid: defaultCid,
      record: { // Default record structure
        text: defaultText,
        facets: [],
        createdAt: defaultCreatedAt,
        ...recordOverrides, // Apply specific record overrides
      },
      ...postOverrides, // Apply post overrides (e.g., cid, but also ensure record is merged, not replaced)
    };

    // If postOverrides included its own 'record', it would have been merged above.
    // If postOverrides did not include 'record', the default one (with its own overrides) is used.

    return {
      post: finalPost,
      // Apply top-level overrides if any (e.g. 'reply', 'reason')
      // This structure assumes overrides are primarily for 'post' or 'record' inside 'post'
      ...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== 'post' && key !== 'record'))
    };
  };

  // HLR-004
  test('HLR-004: should extract unique ID from post.post.cid', async () => {
    const uniqueCid = 'bafyreibmj2nnsaozjwprfxbpk6h2fhemslhkza6y5mhr4trarbkscuxr5e';
    const mockData = {
      feed: [mockPostBuilder({ post: { cid: uniqueCid } })],
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const response = await onRequest({});
    const deals = await response.json();
    expect(deals[0].id).toBe(uniqueCid);
  });

  // HLR-005
  test('HLR-005: should extract deal URL from facets if available', async () => {
    const facetLink = 'http://facet-link.com/deal';
    const mockData = {
      feed: [
        mockPostBuilder({
          record: {
            text: 'Text without link.',
            facets: [
              {
                features: [{ $type: 'app.bsky.richtext.facet#link', uri: facetLink }],
              },
            ],
          },
        }),
      ],
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });
    const response = await onRequest({});
    const deals = await response.json();
    expect(deals[0].url).toBe(facetLink);
  });

  // HLR-005 (empty facet uri)
  test('HLR-005: should ignore empty or whitespace-only facet URIs', async () => {
    const mockData = {
      feed: [
        mockPostBuilder({
          record: {
            text: 'Text with link http://example.com',
            facets: [
              {
                features: [{ $type: 'app.bsky.richtext.facet#link', uri: '   ' }], // whitespace only
              },
               {
                features: [{ $type: 'app.bsky.richtext.facet#link', uri: '' }], // empty
              }
            ],
          },
        }),
      ],
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });
    const response = await onRequest({});
    const deals = await response.json();
    // Should fallback to regex
    expect(deals[0].url).toBe('http://example.com');
  });


  // HLR-006
  test('HLR-006: should extract deal URL from text using regex if no facet link', async () => {
    const textLink = 'http://text-link.com/anotherdeal';
    const mockData = {
      feed: [
        mockPostBuilder({
          record: { text: `Check this out: ${textLink}`, facets: [] },
        }),
      ],
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });
    const response = await onRequest({});
    const deals = await response.json();
    expect(deals[0].url).toBe(textLink);
  });

  test('HLR-006: should extract deal URL from text with various TLDs', async () => {
    const links = [
        'test.com/path', 'sub.test.org/another', 'my.test.dev', 'deal.shop', 'game.store', 'cool.app', 'short.link', 'info.xyz', 'my.me', 'stream.tv', 'test.co.uk'
    ];
    // Ensure timestamps are unique and in a specific order for predictable sorting,
    // or make the test robust to sorting.
    const feedItems = links.map((link, i) => mockPostBuilder({
      record: {
        text: `Link: ${link} Price: $${i}`,
        facets: [],
        // Timestamps are now clearly distinct seconds apart
        createdAt: `2023-01-01T10:00:${i < 10 ? '0' : ''}${i}Z`
      }
    }));
    const mockData = { feed: feedItems };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });
    const response = await onRequest({});
    const deals = await response.json();

    // Deals are sorted by timestamp (newest first by default in script).
    // The mock timestamps are oldest first, so after sorting, the order will be reversed.
    const sortedLinks = [...links].reverse(); // As mock timestamps are ascending, sort will reverse them

    expect(deals.length).toBe(sortedLinks.length);
    deals.forEach((deal, index) => {
        // Find the original link that should correspond to this deal
        // This is more robust than assuming order if other factors change sorting
        const originalLinkText = sortedLinks[index];
        expect(deal.url).toBe(originalLinkText);
    });
  });

  // HLR-007
  test('HLR-007: should extract price from text content', async () => {
    const mockData = {
      feed: [mockPostBuilder({ record: { text: 'Amazing deal for $29.99 only!' } })],
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });
    const response = await onRequest({});
    const deals = await response.json();
    expect(deals[0].price).toBe('$29.99');
  });

  test('HLR-007: should extract price with Euro symbol', async () => {
    const mockData = {
      feed: [mockPostBuilder({ record: { text: 'Price is €50.00' } })],
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });
    const response = await onRequest({});
    const deals = await response.json();
    expect(deals[0].price).toBe('€50.00');
  });

  test('HLR-007: should return empty string if no price found', async () => {
    const mockData = {
      feed: [mockPostBuilder({ record: { text: 'No price here' } })],
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });
    const response = await onRequest({});
    const deals = await response.json();
    expect(deals[0].price).toBe('');
  });

  // HLR-008
  test('HLR-008: should generate deal name by removing URL and trimming whitespace', async () => {
    const urlInText = 'http://buy.com/item';
    const mockData = {
      feed: [
        mockPostBuilder({
          record: { text: `  Great item available at ${urlInText} for cheap!  ` },
        }),
      ],
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });
    const response = await onRequest({});
    const deals = await response.json();
    expect(deals[0].name).toBe('Great item available at for cheap!'); // URL removed
    expect(deals[0].url).toBe(urlInText); // URL correctly extracted
  });

  test('HLR-008: should generate deal name correctly when URL is from facet', async () => {
    const facetUrl = 'http://facet-item.com/purchase';
    const textContent = `  Another great item! ${facetUrl} is the link.  `;
    const mockData = {
      feed: [
        mockPostBuilder({
          record: {
            text: textContent,
            facets: [{ features: [{ $type: 'app.bsky.richtext.facet#link', uri: facetUrl }] }],
          },
        }),
      ],
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });
    const response = await onRequest({});
    const deals = await response.json();
    expect(deals[0].name).toBe('Another great item! is the link.');
    expect(deals[0].url).toBe(facetUrl);
  });

  // HLR-009
  test('HLR-009: should map keywords in deal name to platform emojis', async () => {
    const testCases = [
      // Existing
      { name: 'Nintendo Switch Game', expectedEmoji: '🔀' },
      { name: 'Xbox Series X bundle', expectedEmoji: '🟢' },
      { name: 'XBO game', expectedEmoji: '🟢' },
      { name: 'Steam key for PC game', expectedEmoji: '♨' },
      { name: 'GOG classic title', expectedEmoji: '👴' },
      { name: 'PS5 new release', expectedEmoji: '🎮' },
      { name: 'Blu-ray movie collection', expectedEmoji: '📀' },
      { name: 'Awesome gaming T-Shirt', expectedEmoji: '👕' },
      { name: 'PC Controller Offer', expectedEmoji: '💻' },
      { name: 'Art Book limited edition', expectedEmoji: '📚' },
      { name: 'Humble Bundle for charity', expectedEmoji: '📦' },
      { name: 'Collectible Figure', expectedEmoji: '🕴' },
      // New Keywords for existing emojis from previous updates
      { name: 'PS+ discount', expectedEmoji: '🎮' },
      { name: 'eShop card for Nintendo', expectedEmoji: '🔀' },
      { name: 'Game-key for Switch', expectedEmoji: '🔀' },
      { name: 'Official Merch store', expectedEmoji: '👕' },
      { name: 'Film on Blu-ray', expectedEmoji: '📀' },
      { name: 'LEGO Star Wars set', expectedEmoji: '🧱' },
      // Keywords for this request
      { name: 'Kindle edition book', expectedEmoji: '📚' },
      { name: 'Hardcover novel', expectedEmoji: '📚' },
      { name: 'Cute Plush toy', expectedEmoji: '🕴' },
      { name: 'Halloween costume figure', expectedEmoji: '🕴' },
      { name: 'Action figure toy', expectedEmoji: '🕴' },
      { name: 'Christmas ornament figure', expectedEmoji: '🕴' },
      { name: 'amiibo figure for Switch', expectedEmoji: '🕴' },
      { name: 'Gaming Monitors on sale', expectedEmoji: '💻' },
      // New keywords from this batch
      { name: 'PC Gaming Accessories', expectedEmoji: '💻' },
      { name: 'New Apple Macbook Air', expectedEmoji: '💻' },
      { name: 'Movie night Blu-ray', expectedEmoji: '📀' },
      { name: 'Youtube streaming device', expectedEmoji: '📀' },
      { name: 'Classic Animation Collection DVD', expectedEmoji: '📀' },
      { name: 'Nanoblock Pokemon set', expectedEmoji: '🧱' },
      // LEGO Priority Test
      { name: 'Nintendo Switch LEGO Game', expectedEmoji: '🔀' }, // Switch has higher priority than LEGO
      { name: 'LEGO PS5 Controller', expectedEmoji: '🎮' }, // PS5 has higher priority than LEGO
      { name: 'Just a LEGO brick', expectedEmoji: '🧱' }, // LEGO only
      { name: 'No relevant keywords here', expectedEmoji: '' },
    ];

    for (const tc of testCases) {
      // Ensure each mock builder call has a unique cid and timestamp if they affect sorting or identification,
      // though for this specific test, only the text matters for platform emoji.
      const mockData = { feed: [mockPostBuilder({ record: { text: tc.name, createdAt: new Date().toISOString() } })] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });
      const response = await onRequest({});
      const deals = await response.json();
      expect(deals[0].platform).toBe(tc.expectedEmoji);
    }
  });

  // HLR-010
  test('HLR-010: should extract creation timestamp from post.post.record.createdAt', async () => {
    const timestamp = '2023-01-01T12:00:00.000Z';
    const mockData = {
      feed: [mockPostBuilder({ record: { createdAt: timestamp } })],
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });
    const response = await onRequest({});
    const deals = await response.json();
    expect(deals[0].timestamp).toBe(timestamp);
  });

  // HLR-011
  test('HLR-011: should sort deals in descending order by timestamp', async () => {
    const t1 = '2023-01-01T10:00:00.000Z'; // oldest
    const t2 = '2023-01-01T12:00:00.000Z';
    const t3 = '2023-01-01T14:00:00.000Z'; // newest
    const mockData = {
      feed: [
        mockPostBuilder({ record: { createdAt: t1, text: 'Deal 1' } }), // Sent out of order
        mockPostBuilder({ record: { createdAt: t3, text: 'Deal 3' } }),
        mockPostBuilder({ record: { createdAt: t2, text: 'Deal 2' } }),
      ],
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });
    const response = await onRequest({});
    const deals = await response.json();
    expect(deals.length).toBe(3);
    expect(deals[0].timestamp).toBe(t3); // Newest first
    expect(deals[1].timestamp).toBe(t2);
    expect(deals[2].timestamp).toBe(t1); // Oldest last
  });

  // HLR-012
  test('HLR-012: should return processed deals as JSON with correct Content-Type', async () => {
    const mockData = {
      feed: [mockPostBuilder({ record: { text: 'A deal' } })],
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const response = await onRequest({});
    expect(response.headers.get('Content-Type')).toBe('application/json');
    const deals = await response.json();
    expect(Array.isArray(deals)).toBe(true);
    expect(deals.length).toBe(1);
    expect(deals[0]).toHaveProperty('id');
    expect(deals[0]).toHaveProperty('name');
    expect(deals[0]).toHaveProperty('price');
    expect(deals[0]).toHaveProperty('url');
    expect(deals[0]).toHaveProperty('platform');
    expect(deals[0]).toHaveProperty('timestamp');
  });

  test('should handle empty feed gracefully', async () => {
    const mockData = { feed: [] };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });
    const response = await onRequest({});
    const deals = await response.json();
    expect(deals).toEqual([]);
  });

  test('should handle posts with missing text, facets, or other fields', async () => {
    const mockData = {
      feed: [
        { // Post with completely empty record
          post: {
            cid: 'cid1',
            record: { /* empty */ }
          }
        },
        { // Post with null text and facets
           post: {
            cid: 'cid2',
            record: {
              text: null,
              facets: null,
              createdAt: new Date().toISOString()
            }
          }
        }
      ]
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });
    const response = await onRequest({});
    const deals = await response.json();
    expect(deals.length).toBe(2);
    expect(deals[0].id).toBe('cid1');
    expect(deals[0].name).toBe('');
    expect(deals[0].url).toBe('');
    expect(deals[0].price).toBe('');
    // deals[0].timestamp will be undefined as createdAt is missing

    expect(deals[1].id).toBe('cid2');
    expect(deals[1].name).toBe('');
    expect(deals[1].url).toBe('');
    expect(deals[1].price).toBe('');
  });
});
