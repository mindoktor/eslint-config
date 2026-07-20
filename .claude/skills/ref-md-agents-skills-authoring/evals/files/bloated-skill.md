---
name: helpers
description: All our coding conventions and patterns.
---

# Helpers

This skill covers everything about how we write code.

## TypeScript Conventions

### Naming

- Use PascalCase for types and interfaces
- Use camelCase for variables and functions
- Use SCREAMING_SNAKE_CASE for constants
- Prefix interfaces with I only when there's a naming collision with a class
- Use descriptive names, avoid abbreviations except for universally understood ones (id, err, ctx, req, res)

### Type Safety

- Prefer `unknown` over `any`
- Use `as const` for literal objects that shouldn't change
- Avoid type assertions (`as`) — use type guards instead
- Use discriminated unions for state machines
- Always type function return values for public APIs

### Error Handling

- Use custom error classes that extend Error
- Always set the cause property when wrapping errors
- Never catch and ignore errors silently
- Use Result<T, E> pattern for expected failures
- Reserve try/catch for unexpected failures

### Imports

- Use named imports over default imports
- Sort imports: built-in → external → internal → relative
- Use path aliases configured in tsconfig
- Never use require() in TypeScript files

### Generics

- Use meaningful generic names: TItem, TResponse, not T, U
- Constrain generics when possible: <T extends Record<string, unknown>>
- Avoid deeply nested generics (max 2 levels)
- Document complex generic types with JSDoc

### Async Patterns

- Prefer async/await over .then() chains
- Use Promise.all() for independent concurrent operations
- Use Promise.allSettled() when you need all results regardless of failures
- Never use new Promise() when async/await works
- Always handle promise rejections

### String Handling

- Use template literals over string concatenation
- Use tagged templates for SQL, HTML, or other structured strings
- Prefer String.prototype methods over regex for simple operations
- Use Intl APIs for locale-aware formatting

### Collections

- Prefer Map over plain objects for dynamic keys
- Use Set for unique value collections
- Prefer Array methods (map, filter, reduce) over for loops
- Use for...of over for...in for arrays
- Avoid mutating arrays — use spread or Array.from()

### Module Patterns

- One public export per file for components
- Use barrel files (index.ts) sparingly — only for public API boundaries
- Keep files under 300 lines
- Split large modules by concern, not by type

## React Patterns

### Component Structure

- Use function components exclusively
- Prefer named exports over default exports
- Co-locate component, styles, types, and tests
- Order: types → hooks → helpers → component → exports

### Hooks

- Custom hooks must start with "use"
- Extract complex state logic into custom hooks
- Keep hook dependencies minimal
- Avoid useEffect for derived state — use useMemo instead
- Never call hooks conditionally

### State Management

- Prefer local state over global state
- Use context for theme, auth, locale — not for all shared state
- Keep state as close to where it's used as possible
- Normalize complex nested state
- Use reducers for state with complex transitions

### Props

- Destructure props in the function signature
- Use interface for prop types, not type alias
- Mark optional props with ? — don't use defaultProps
- Avoid spreading all props onto DOM elements
- Limit props to 5-7 per component — split if more

### Rendering

- Avoid inline object/array creation in JSX — extract to constants or useMemo
- Use Fragment (<>) instead of wrapping divs
- Conditional rendering: ternary for simple, early return for complex
- Extract repeated JSX into sub-components
- Avoid nested ternaries in JSX

### Event Handlers

- Name handlers `handle<Event>`: handleClick, handleSubmit
- Use useCallback for handlers passed to child components
- Avoid inline arrow functions in JSX for frequently re-rendered components
- Always prevent default for form submissions

### Performance

- Memoize expensive computations with useMemo
- Wrap child components with React.memo when parent re-renders frequently
- Use virtualization for long lists (react-window or react-virtuoso)
- Lazy load routes and heavy components with React.lazy
- Profile before optimizing — don't guess

### Styling

- Use CSS Modules for component-scoped styles
- Use design tokens from the theme for colors, spacing, typography
- Avoid inline styles except for dynamic values
- Mobile-first responsive design
- Use logical properties (margin-inline, padding-block) for RTL support

### Forms

- Use react-hook-form for form state management
- Validate with zod schemas
- Show validation errors inline, below the field
- Disable submit button while submitting
- Reset form state after successful submission

### Accessibility

- All interactive elements must be keyboard accessible
- Use semantic HTML elements (button, nav, main, article)
- Add aria-label to icon-only buttons
- Manage focus when opening/closing modals and drawers
- Test with screen reader at least once per feature

## Testing Guidelines

### Unit Tests

- Test behavior, not implementation
- Use describe/it blocks with readable descriptions
- Arrange-Act-Assert pattern
- One assertion per test when possible
- Mock external dependencies, not internal modules

### Component Tests

- Use React Testing Library
- Query by role, label, or text — avoid test IDs
- Test user interactions, not component internals
- Render with necessary providers (theme, router, etc.)
- Avoid snapshot tests — they're too brittle

### Integration Tests

- Test full user flows through the component tree
- Use MSW for API mocking
- Test error states and loading states
- Verify accessibility in integration tests
- Keep integration tests focused — max 10 assertions

### Test Organization

- Co-locate test files with source: Button.test.tsx next to Button.tsx
- Use fixtures/ for shared test data
- Use factories for creating test objects
- Shared test utilities go in test/utils/
- Name test files consistently: `<module>.test.ts`

### Mocking

- Prefer dependency injection over jest.mock
- Mock at the boundary (API, filesystem, clock)
- Reset mocks between tests with afterEach
- Type your mocks — avoid any in test code
- Use jest.spyOn for observing calls without changing behavior
