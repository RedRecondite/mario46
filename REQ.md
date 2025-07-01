---
prefix: "HLR"
associations:
  ImplementedBy:
    target_prefix: "file"
    description: "Implemented by source files"
---

# Wario64 Deals Requirements

## Backend Functionality

### HLR-001

> The system shall fetch the author feed from the Bluesky API for the configured actor DID.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)

### HLR-002

> The system shall request a specified limit of posts (e.g., 50) from the Bluesky API.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)

### HLR-003

> The system shall return an HTTP 502 error response if the Bluesky API fetch is not successful.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)

### HLR-004

> The system shall extract a unique ID for each deal from the `post.post.cid` field of the Bluesky API response.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)

### HLR-005

> The system shall attempt to extract a deal URL from the `post.post.record.facets` array, prioritizing features of type `app.bsky.richtext.facet#link`.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)

### HLR-006

> The system shall, if no link is found in facets, attempt to extract a deal URL from the `post.post.record.text` using a regular expression.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)

### HLR-007

> The system shall extract the price of a deal from the text content by matching currency symbols (e.g., $, €) followed by digits.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)

### HLR-008

> The system shall generate a deal name by taking the post text, removing the extracted deal URL (if present), and trimming whitespace.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)

### HLR-009

> The system shall map keywords found in the deal name to corresponding platform emojis based on a predefined list.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)

### HLR-010

> The system shall extract the creation timestamp for each deal from the `post.post.record.createdAt` field.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)

### HLR-011

> The system shall sort the processed deals in descending order based on their timestamp.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)

### HLR-012

> The system shall return the processed deals as a JSON array with a `Content-Type` header of `application/json`.  
>
> **ImplementedBy:** [functions/deals.js](functions/deals.js)

## Frontend Functionality

### HLR-013

> The system shall periodically fetch deal data from the `/deals` API endpoint.  
>
> **ImplementedBy:** [public/script.js](public/script.js)

### HLR-014

> The system shall refresh the deal data by polling the API every 60 seconds.  
>
> **ImplementedBy:** [public/script.js](public/script.js)

### HLR-015

> The system shall render fetched deals as rows in an HTML table with columns for platform, price, and item name.  
>
> **ImplementedBy:** [public/script.js](public/script.js), [public/index.html](public/index.html)

### HLR-016

> The system shall display the platform emoji for each deal in the first column of the table.  
>
> **ImplementedBy:** [public/script.js](public/script.js)

### HLR-017

> The system shall display the extracted price for each deal. If no price is available, it shall display "N/A".  
>
> **ImplementedBy:** [public/script.js](public/script.js)

### HLR-018

> The system shall display the name of each deal.  
>
> **ImplementedBy:** [public/script.js](public/script.js)

### HLR-019

> The system shall make deal rows clickable if a valid URL is associated with the deal.  
>
> **ImplementedBy:** [public/script.js](public/script.js)

### HLR-020

> The system shall open the deal's URL in a new browser tab when a clickable deal row is clicked.  
>
> **ImplementedBy:** [public/script.js](public/script.js)

### HLR-021

> The system shall ensure that deal rows without a valid URL are not clickable and do not show a pointer cursor.  
>
> **ImplementedBy:** [public/script.js](public/script.js)

### HLR-022

> The system shall persist the set of seen deal IDs in `localStorage` to maintain state across page loads.  
>
> **ImplementedBy:** [public/script.js](public/script.js)

### HLR-023

> The system shall initially display new (not previously seen) deals with full opacity.  
>
> **ImplementedBy:** [public/script.js](public/script.js)

### HLR-024

> The system shall display previously seen deals with reduced opacity.  
>
> **ImplementedBy:** [public/script.js](public/script.js)

### HLR-025

> The system shall mark a deal as seen (and update its visual representation and persisted state) after it has been rendered.  
>
> **ImplementedBy:** [public/script.js](public/script.js)

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
