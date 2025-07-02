---
prefix: "HLR"
associations:
  ImplementedBy:
    target_prefix: "file"
    description: "Implemented by source files"
  TestedBy:
    target_prefix: "file"
    description: "Tested by unit tests"
---

# Wario64 Deals Requirements

This document outlines the high-level requirements for the Wario64 Deals application. It is divided into backend and frontend functionality, with specific requirements detailed in each section.

## Backend Functionality

This section outlines requirements for the server-side logic, including data fetching from the Bluesky API, processing of deal information (such as extracting URLs, prices, and names), and providing an API endpoint for the frontend to consume the processed deals.

### HLR-001

> The system shall fetch the author feed from the Bluesky API for the configured actor DID.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)
> **TestedBy:** [tests/deals.test.js](tests/deals.test.js)

### HLR-002

> The system shall request a specified limit of posts (e.g., 50) from the Bluesky API.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)
> **TestedBy:** [tests/deals.test.js](tests/deals.test.js)

### HLR-003

> The system shall return an HTTP 502 error response if the Bluesky API fetch is not successful.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)
> **TestedBy:** [tests/deals.test.js](tests/deals.test.js)

### HLR-004

> The system shall extract a unique ID for each deal from the `post.post.cid` field of the Bluesky API response.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)
> **TestedBy:** [tests/deals.test.js](tests/deals.test.js)

### HLR-005

> The system shall attempt to extract a deal URL from the `post.post.record.facets` array, prioritizing features of type `app.bsky.richtext.facet#link`.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)
> **TestedBy:** [tests/deals.test.js](tests/deals.test.js)

### HLR-006

> The system shall, if no link is found in facets, attempt to extract a deal URL from the `post.post.record.text` using a regular expression.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)
> **TestedBy:** [tests/deals.test.js](tests/deals.test.js)

### HLR-007

> The system shall extract the price of a deal from the text content by matching currency symbols (e.g., $, €) followed by digits.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)
> **TestedBy:** [tests/deals.test.js](tests/deals.test.js)

### HLR-008

> The system shall generate a deal name by taking the post text, removing the extracted deal URL (if present), and trimming whitespace.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)
> **TestedBy:** [tests/deals.test.js](tests/deals.test.js)

### HLR-009

> The system shall map keywords found in the deal name to corresponding platform emojis based on a predefined list.  
>
> | Emoji | Keywords                                                     |
> | :---- | :----------------------------------------------------------- |
> | 🔀    | "nintendo", "switch", "eShop", "game-key"                    |
> | 🟢    | "xbox series x", "xbox series s", "xbox"                     |
> | ♨    | "steam"                                                      |
> | 👴    | "gog", "good old games"                                      |
> | 🎮    | "ps4", "ps5", "playstation", "psn", "ps+", "game"            |
> | 📀    | "dvd", "blu-ray", "bluray", "4k uhd", "uhd", "film"          |
> | 👕    | "t-shirt", "shirt", "merch"                                  |
> | 💻    | "pc", "computer", "controller", "windows", "cable", "laptop" |
> | 📚    | "book"                                                       |
> | 📦    | "humble", "bundle", "box"                                    |
> | 🕴    | "figure"                                                     |
> | 🧱    | "LEGO" (lowest priority)                                     |
> | 📱    | "ios", "android" (previously listed, maintained)             |
> | 🎧    | "headphone", "headset" (previously listed, maintained)       |
> | 📺    | "tv", "monitor" (previously listed, maintained)              |
> | 🤖    | "robot" (previously listed, maintained)                      |
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)
> **TestedBy:** [tests/deals.test.js](tests/deals.test.js)

### HLR-010

> The system shall extract the creation timestamp for each deal from the `post.post.record.createdAt` field.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)
> **TestedBy:** [tests/deals.test.js](tests/deals.test.js)

### HLR-011

> The system shall sort the processed deals in descending order based on their timestamp.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)
> **TestedBy:** [tests/deals.test.js](tests/deals.test.js)

### HLR-012

> The system shall return the processed deals as a JSON array with a `Content-Type` header of `application/json`.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)
> **TestedBy:** [tests/deals.test.js](tests/deals.test.js)

## Frontend Functionality

This section details requirements for the client-side user interface. This includes periodically fetching deal data from the backend API, rendering deals in a user-friendly table format, handling user interactions like clicking on deals to open them in a new tab, and using local storage to remember which deals the user has already seen.

### HLR-013

> The system shall periodically fetch deal data from the `/deals` API endpoint.  
>
> **ImplementedBy:** [public/script.js](public/script.js)
> **TestedBy:** [tests/script.test.js](tests/script.test.js)

### HLR-014

> The system shall refresh the deal data by polling the API every 60 seconds.  
>
> **ImplementedBy:** [public/script.js](public/script.js)
> **TestedBy:** [tests/script.test.js](tests/script.test.js)

### HLR-015

> The system shall render fetched deals as rows in an HTML table with columns for platform, price, and item name.  
>
> **ImplementedBy:** [public/script.js](public/script.js), [public/index.html](public/index.html)
> **TestedBy:** [tests/script.test.js](tests/script.test.js)

### HLR-016

> The system shall display the platform emoji for each deal in the first column of the table.  
>
> **ImplementedBy:** [public/script.js](public/script.js)
> **TestedBy:** [tests/script.test.js](tests/script.test.js)

### HLR-017

> The system shall display the extracted price for each deal. If no price is available, it shall display "N/A".  
>
> **ImplementedBy:** [public/script.js](public/script.js)
> **TestedBy:** [tests/script.test.js](tests/script.test.js)

### HLR-018

> The system shall display the name of each deal.  
>
> **ImplementedBy:** [public/script.js](public/script.js)
> **TestedBy:** [tests/script.test.js](tests/script.test.js)

### HLR-019

> The system shall make deal rows clickable if a valid URL is associated with the deal.  
>
> **ImplementedBy:** [public/script.js](public/script.js)
> **TestedBy:** [tests/script.test.js](tests/script.test.js)

### HLR-020

> The system shall open the deal's URL in a new browser tab when a clickable deal row is clicked.  
>
> **ImplementedBy:** [public/script.js](public/script.js)
> **TestedBy:** [tests/script.test.js](tests/script.test.js)

### HLR-021

> The system shall ensure that deal rows without a valid URL are not clickable and do not show a pointer cursor.  
>
> **ImplementedBy:** [public/script.js](public/script.js)
> **TestedBy:** [tests/script.test.js](tests/script.test.js)

### HLR-022

> The system shall persist the set of seen deal IDs in `localStorage` to maintain state across page loads.  
>
> **ImplementedBy:** [public/script.js](public/script.js)
> **TestedBy:** [tests/script.test.js](tests/script.test.js)

### HLR-023

> The system shall initially display new (not previously seen) deals with full opacity.  
>
> **ImplementedBy:** [public/script.js](public/script.js)
> **TestedBy:** [tests/script.test.js](tests/script.test.js)

### HLR-024

> The system shall display previously seen deals with reduced opacity.  
>
> **ImplementedBy:** [public/script.js](public/script.js)
> **TestedBy:** [tests/script.test.js](tests/script.test.js)

### HLR-025

> The system shall mark a deal as seen (and update its visual representation and persisted state) after it has been rendered.  
>
> **ImplementedBy:** [public/script.js](public/script.js)
> **TestedBy:** [tests/script.test.js](tests/script.test.js)

### HLR-026

> The system shall display "Wario64 Deals" as the HTML page title.  
>
> **ImplementedBy:** [public/index.html](public/index.html)

### HLR-027

> The system shall display a main heading "Wario64 Deals" on the page.  
>
> **ImplementedBy:** [public/index.html](public/index.html)

### HLR-028

> The system shall use Tailwind CSS for styling the user interface elements.  
>
> **ImplementedBy:** [public/index.html](public/index.html)
