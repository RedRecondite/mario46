## Unit Testing Strategy Update

This section replaces the existing "Unit Testing Strategy" in `GEMINI.md`.

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
