# MARIO46 

- Use a single requirements document stored in `REQ.md`.
- Document all new feature requests in the requirements.
- Create unit tests for all new features
- AI cannot modify `GEMINI.md` - if any updates are needed, create a new `GEMINI_UPDATES.md` file with the new content.

## Requirements Format Guide

This guide explains how to write requirements documents using our markdown-based format that works seamlessly with GitHub.

### Quick Start

1. Create a markdown file with YAML front-matter defining your requirement prefix
2. Use headings for requirement IDs (e.g., `### REQ-001`)
3. Put requirement text and attributes in blockquotes
4. Link to other requirements and files using standard markdown links

### Basic Structure

Every requirements document needs:
- **YAML front-matter** with at least a `prefix`
- **Headings** for unique requirement IDs
- **Blockquotes** containing requirement text and metadata

### Complete Example

```yaml
---
prefix: "HLR"
attributes:
  Priority:
    type: single-select
    options: ["High", "Medium", "Low"]
    required: true
  Status:
    type: single-select
    options: ["Draft", "Approved", "Implemented"]
    required: true
associations:
  Decomposes:
    target_prefix: "LLR"
    description: "Breaks down into lower-level requirements"
    required: true
  ImplementedBy:
    target_prefix: "file"
    description: "Implemented by source files"
---

# Authentication Requirements

## User Authentication

### HLR-001

> The system shall provide secure user authentication with support for multiple authentication methods.
>
> - **Priority:** High  
> - **Status:** Approved  
> - **Decomposes:** [LLR-001](llr.md#llr-001), [LLR-002](llr.md#llr-002)  
> - **ImplementedBy:** [auth.py](src/auth.py)

### HLR-002

> The system shall support multi-factor authentication for enhanced security.
>
> - **Priority:** Medium  
> - **Status:** Draft  
> - **Decomposes:** [LLR-003](llr.md#llr-003)
```

### Key Concepts

#### Document Configuration

**Inline Definition** - Define everything in the document:
```yaml
---
prefix: "REQ"
attributes: { ... }
associations: { ... }
---
```

**External Reference** - Use a shared configuration file:
```yaml
---
definition: shared-config.yaml
---
```

#### Requirement Structure

```markdown
#### REQ-001

> Requirement text goes first.
>
> - **Attribute:** Value  
> - **Association:** [Link](file.md#target)
```

**Important rules:**
- Requirement text comes first in the blockquote
- Empty line separates text from metadata
- Use `**bold**` list labels for attributes and associations
- End lines with two spaces for proper line breaks
- Do not change existing requirement IDs; requirements text may evolve (and the ID may rename the same), but the IDs cannot change arbitrarily.
- New requirements IDs should always be added with a new number; avoid re-using old numbers or using new ids that are gaps between existing requirements.

#### Linking

- **Same document:** `[REQ-001](#req-001)`
- **Other documents:** `[SYS-001](system.md#sys-001)`
- **Files:** `[auth.py](src/auth.py)`

#### Attribute Types

- **text**: Free-form text with optional validation
- **integer**: Numbers with optional min/max limits
- **single-select**: Choose one from predefined options
- **multi-select**: Choose multiple (comma-separated)

#### Associations

Define relationships between requirements:
- **target_prefix**: What types of requirements this can link to
- **required**: Whether every requirement must have this association
- **external_links**: Manage complex relationships in separate files

### Optional Sections

Both `attributes` and `associations` are optional. You can have:
- **Minimal documents** with just a prefix and requirement text
- **Attribute-only documents** for tracking status and metadata
- **Association-only documents** for linking without extra metadata

### Best Practices

- Use clear, specific requirement text starting with "The system shall..."
- Group related requirements in the same document
- Keep links up-to-date as your project evolves
- Start simple and add complexity as needed

### GitHub Benefits

This format works perfectly with GitHub:
- Requirements are automatically linkable via heading anchors
- Standard markdown rendering makes documents readable
- Git history tracks all requirement changes
- GitHub search finds requirements across your project

The format scales from simple single-file projects to complex systems with hundreds of interconnected requirements.

## Unit Testing Strategy

This document outlines the strategy for unit testing in this project.

### Guiding Principles

- **Test Early, Test Often:** Unit tests should be written as early as possible in the development cycle.
- **Focus on Units:** Each test should focus on a small, isolated piece of code (e.g., a function or a method).
- **Independence:** Tests should be independent of each other. The failure of one test should not affect others.
- **Repeatability:** Tests should produce the same results every time they are run.
- **Clarity:** Tests should be easy to read and understand.

### What to Test

- **Core Logic:** Test the main functionality of each unit.
- **Edge Cases:** Test how the unit behaves with unusual or extreme inputs.
- **Error Handling:** Test how the unit handles errors and exceptions.
- **Boundary Conditions:** Test the unit's behavior at the boundaries of valid input ranges.

### Tools and Frameworks

- **Test Runner:** We will use **Jest** ([https://jestjs.io/](https://jestjs.io/)). Jest is a delightful JavaScript Testing Framework with a focus on simplicity. It provides an integrated environment and typically requires minimal configuration.
- **Assertion Methods:** Jest comes with a comprehensive set of assertion methods (e.g., `expect(value).toBe(expected)`).

### Test Organization

- **Directory Structure:** All unit tests will be placed in a dedicated `tests/` directory at the root of the project.
- **File Naming:** Test files should be named with the `.test.js` suffix (e.g., `deals.test.js` for testing `deals.js`).
- **Test Case Naming:** Test suites are defined using `describe('A group of tests', () => { ... });`. Individual tests are defined using `test('Does something', () => { ... });` or `it('Does something', () => { ... });`.
- **Test Method Naming:** Test descriptions should be clear and descriptive of what they are testing.

### Running Tests

Tests can be run from the command line using the following command:

```bash
npm test
```

This command will execute Jest, which will automatically discover and run all test files in the `tests/` directory.

### Association with Requirements

Each requirement in `REQ.md` will be associated with its corresponding unit test(s) using the `TestedBy` attribute. This ensures traceability between requirements and tests.
---

This strategy will help ensure the quality and reliability of our codebase.
