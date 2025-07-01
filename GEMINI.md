# MARIO46 

- Use a single requirements document stored in `REQ.md`.
- Document all features in the requirements.

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
> **Priority:** High  
> **Status:** Approved  
> **Decomposes:** [LLR-001](llr.md#llr-001), [LLR-002](llr.md#llr-002)  
> **ImplementedBy:** [auth.py](src/auth.py)

### HLR-002

> The system shall support multi-factor authentication for enhanced security.
>
> **Priority:** Medium  
> **Status:** Draft  
> **Decomposes:** [LLR-003](llr.md#llr-003)
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
> **Attribute:** Value  
> **Association:** [Link](file.md#target)
```

**Important rules:**
- Requirement text comes first in the blockquote
- Empty line separates text from metadata
- Use `**bold**` labels for attributes and associations
- End lines with two spaces for proper line breaks

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