# Mistakes and Fixes

Issues encountered during development and how they were resolved. Organized by category for quick reference.

---

## TypeScript / Build Errors

### 1. shadcn/ui v4 ToggleGroup Type Mismatch

**Task:** 7 (Calendar Navigation)
**Error:** `Type 'string' is not assignable to type 'readonly string[]'`
**Root Cause:** shadcn/ui v4 uses `@base-ui/react` instead of Radix. The ToggleGroup component expects `value` as `readonly string[]` (multi-select), not a single `string` like Radix's ToggleGroup.
**Fix:** Replaced `<ToggleGroup>` with two plain `<Button>` components that swap `variant` between `"outline"` and `"default"` based on the current view. Simpler and avoids the API mismatch.
**Lesson:** Always check the actual component API when using shadcn v4 — it's base-ui, not Radix. Props and behavior differ.

### 2. Unused React Import in scroll-area.tsx

**Task:** 7
**Error:** `'React' is declared but its value is never read` (from `noUnusedLocals`)
**Root Cause:** shadcn-generated `scroll-area.tsx` includes `import * as React from 'react'` which React 19 with the JSX transform doesn't need. But `noUnusedLocals` is enabled in our tsconfig.
**Fix:** Added `// @ts-expect-error -- shadcn generated, React import needed for managed component` above the import.
**Lesson:** shadcn generates code for broad compatibility. When strict tsconfig flags conflict with generated code, suppress with `@ts-expect-error` rather than modifying the generated file or loosening tsconfig.

### 3. SheetTrigger `asChild` Prop Not Supported

**Task:** 10 (Chat Panel)
**Error:** `Property 'asChild' does not exist on type...`
**Root Cause:** Another shadcn v4 / base-ui difference. Radix uses `asChild` to forward props to a child element. base-ui uses a `render` prop instead.
**Fix:** Changed `<SheetTrigger asChild><Button>...</Button></SheetTrigger>` to `<SheetTrigger render={<Button ... />}>...</SheetTrigger>`.
**Lesson:** Pattern to remember: `asChild` (Radix) → `render` (base-ui/shadcn v4).

### 4. `verbatimModuleSyntax` Type Import Errors

**Task:** 11 (React Bits Components)
**Error:** `'FC' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled`
**Root Cause:** TypeScript's `verbatimModuleSyntax` requires that type-only exports be imported with `import { type X }` or `import type { X }` so the bundler knows they can be erased.
**Affected files:** `hyper-speed.tsx` (`FC`), `text-type.tsx` (`ElementType`)
**Fix:** Changed to `import { type FC }` and `import { type ElementType, ... }` respectively.
**Lesson:** When copying external components into a project with `verbatimModuleSyntax`, check for bare type imports.

### 5. Unused `width` Parameter in HyperSpeed

**Task:** 11
**Error:** `'width' is declared but its value is never read`
**Root Cause:** The `createPlane(side, width, isRoad)` method in the `Road` class accepts a `width` parameter but reads `options.roadWidth` / `options.islandWidth` directly from the options object instead.
**Fix:** Prefixed as `_width` — standard TypeScript convention for required positional parameters that are intentionally unused.

---

## Architecture / Design Decisions

### 6. REST vs GraphQL

**Context:** Initially considered GraphQL for the backend API.
**Decision:** REST chosen instead.
**Rationale:** The AI agent doesn't query the API — it receives calendar context injected into its system prompt. There's no complex client-driven querying that would benefit from GraphQL. REST is simpler, has less overhead, and is more appropriate for this request/response pattern.
**Lesson:** Match the API style to the data access pattern. GraphQL shines when clients need flexible, nested queries. For server-driven context injection, REST is cleaner.

### 7. AI Provider Selection

**Context:** Considered Hugging Face, Kimi-K2, and Anthropic Claude.
**Decision:** Anthropic Claude (claude-sonnet-4-20250514).
**Rationale:** Strong conversational reasoning, native streaming support via SDK, well-documented API. The AI service is isolated in `server/src/services/ai-agent.ts` so the provider can be swapped without touching the rest of the codebase.

### 8. Read-Only Calendar Scope

**Decision:** Use `calendar.readonly` scope, not `calendar.events`.
**Rationale:** The agent suggests changes and drafts emails but never writes to the calendar. This is intentional — keeps the trust boundary clear, minimizes permission surface, and aligns with the interview prompt's focus on analysis rather than mutation.

---

## Dependency / Tooling Issues

### 9. React Bits Is Not an npm Package

**Context:** Attempted to scrape reactbits.dev to get component code.
**Problem:** The site is JS-rendered (SPA), so `WebFetch` returned no useful content.
**Fix:** User manually copied the component source files into `src/components/ui/`. Required installing underlying dependencies: `gsap`, `@gsap/react`, `three`, `postprocessing`, `@types/three`.
**Lesson:** React Bits is a copy-paste library, not installable via npm. Plan for manual integration and dependency resolution.

### 10. npm Cache Permission Error

**Context:** `npm install -D @types/three` failed with `EACCES: permission denied` on the npm cache.
**Fix:** Used `--cache /tmp/npm-cache` fallback to use a temporary cache directory.
**Lesson:** npm cache corruption or permission issues can be worked around with an alternative cache path. Run `npm cache clean --force` if it persists.

### 11. 500KB+ Chunk Size Warning

**Task:** 10, 11
**Warning:** Vite build warned about a 630KB JS chunk.
**Fix:** Added `manualChunks` in `vite.config.ts` to split `three`+`postprocessing` and `gsap`+`@gsap/react` into separate chunks. This reduced the main chunk from 630KB to 551KB and isolated GSAP (79KB) into its own chunk. The `three` chunk is empty (tree-shaken) since HyperSpeed isn't imported in the app.
**Note:** The remaining 551KB (react + react-dom + react-markdown + shadcn) could be further reduced with `React.lazy()` code-splitting on routes.

---

## Component API Gotchas

### 12. TextGenerateEffect Does Not Exist in React Bits

**Context:** Planned to use a `TextGenerateEffect` component from React Bits.
**Problem:** This component doesn't exist in the React Bits library.
**Fix:** Used `TextType` (typewriter effect) instead, which provides a similar visual impact with cycling text strings.

### 13. SSE Stream Consumption Pattern

**Context:** Needed to stream AI responses from the server to the client.
**Challenge:** `fetch` doesn't natively support SSE parsing. The response body is a `ReadableStream` of bytes, not structured events.
**Solution:** Used an async generator in `src/services/chat.ts` that reads the stream via `getReader()`, decodes chunks with `TextDecoder`, splits on `\n\n` boundaries, and parses `event:` / `data:` lines. Yields typed `StreamEvent` objects (`text`, `done`, `error`).
**Lesson:** SSE over fetch requires manual parsing. The `EventSource` API is simpler but only supports GET requests — POST with streaming requires the reader pattern.

### 14. Stale Closure in Streaming State Updates

**Context:** Chat streaming updates were losing intermediate tokens.
**Root Cause:** Using `setMessages(prev => [...prev.slice(0,-1), {...lastMsg, content: accumulated}])` with a captured `accumulated` variable created a stale closure — each timeout callback captured a different snapshot.
**Fix:** Used functional `setMessages` with the updater pattern: read the current last message's content from `prev`, append the new chunk. No external mutable variable needed.
**Lesson:** Always use functional state updates (`setState(prev => ...)`) inside async callbacks, intervals, or stream handlers to avoid stale closures.

---

## THREE.js / WebGL Issues

### 15. HyperSpeed Canvas Stuck in Bottom-Right Corner — `setSize` Third Argument

**Task:** 11 (React Bits Components — HyperSpeed background on login page)
**Symptom:** The 3D road animation appeared stuck in the bottom-right corner of the screen instead of filling the viewport. Multiple rounds of camera math fixes (lookAt direction, distortion centering, oscillation clamping) failed to resolve it.
**Root Cause:** `this.renderer.setSize(container.offsetWidth, container.offsetHeight, false)` — the third argument `false` tells THREE.js to set the internal drawing buffer resolution but **skip setting `canvas.style.width` and `canvas.style.height`**. This meant the canvas rendered the scene at full resolution internally but displayed at the browser's default canvas size (300×150px), pinned to the top-left of its container. The full scene was crammed into a tiny canvas element.
**Fix:** Removed the `false` argument: `this.renderer.setSize(container.offsetWidth, container.offsetHeight)`. With the default `true`, THREE.js sets both the buffer size and the CSS display size to match the container.
**Why it was missed:** The symptom ("stuck in the bottom-right") was misdiagnosed as a camera direction problem. Multiple code reviews focused on the `turbulentDistortion.getJS` function, camera `lookAt` math, and `lookAtAmp` values — all of which were legitimate secondary issues but not the root cause. Nobody inspected the `setSize` call closely enough to catch the `false` parameter. The THREE.js API for this argument is non-obvious — it's a boolean that silently changes whether CSS styles are applied.
**Lesson:** When a WebGL/THREE.js scene is visually mispositioned, **check the rendering surface size before chasing the math that draws on it**. Verify `renderer.domElement.style.width/height` matches the container. A single API flag can make the entire canvas render at the wrong display size while the internal resolution is correct.

### 16. turbulentDistortion GLSL/JS Centering Mismatch

**Task:** 11 (HyperSpeed — found during camera investigation)
**Symptom:** Camera oscillation was asymmetric and drifted off-center over time.
**Root Cause:** The GLSL shader for `turbulentDistortion` centers the road geometry by subtracting distortion at a fixed reference point `0.0125`: `getDistortionX(progress) - getDistortionX(0.0125)`. But the JS `getJS` function (which controls the camera lookAt) used a sliding offset: `getX(progress) - getX(progress + 0.007)`. Every other distortion preset (`mountainDistortion`, `LongRaceDistortion`) uses a fixed reference matching the GLSL. `turbulentDistortion` was the odd one out — a bug in the original React Bits component.
**Fix:** Changed the JS to match the GLSL: `getX(progress) - getX(0.0125)`.
**Lesson:** When a 3D effect has both a GPU shader and a CPU-side function that should produce consistent results, verify they use the same mathematical formulation. Mismatches between GLSL and JS are hard to spot visually because both produce plausible-looking output.

---

## Build / Lint Fixes

### 17. Unused Variables Breaking Frontend Build

**Context:** Final build check before submission.
**Errors:** `noUnusedLocals` flagged `isNewMessage` in `message-list.tsx` and `displayedContent` / `setDisplayedContent` in `use-chat.ts`.
**Root Cause:** `isNewMessage` was computed but never read — the auto-scroll logic only checked `autoScroll`. `displayedContent` state was a leftover from an earlier approach — the typewriter animation updates messages directly via `setMessages`, making the separate state unnecessary.
**Fix:** Removed both unused variables and all references to `setDisplayedContent`.

### 18. Server Build Failing on Test Files

**Context:** `cd server && npm run build` failed with strict-null errors in `require-auth.test.ts`.
**Root Cause:** `server/tsconfig.json` included all files in `src/` without excluding test files. Test files had `TS18048` (`possibly undefined`) errors that were acceptable in test context but failed strict compilation.
**Fix:** Added `"exclude": ["src/**/*.test.ts"]` to `server/tsconfig.json`.

---

## Security / Production Hardening

### 19. AI Agent Not Restricted to Calendar Topics

**Context:** System prompt told Claude it was a "calendar assistant" but never explicitly restricted it from answering unrelated questions.
**Fix:** Added a critical rule: "Only respond to questions related to the user's calendar, scheduling, time management, and email drafting for meetings. Politely decline any unrelated topics."
**Lesson:** LLM system prompts need explicit boundaries — describing capabilities is not the same as restricting scope.

### 20. Time Zone Mismatch Between Server and User

**Context:** `buildSystemPrompt` used `new Date()` with the server's local time zone for "today" and the 14-day reference table. In production, a server in UTC would compute different dates than a user in California.
**Fix:** Added `getCalendarTimeZone()` to fetch the user's IANA time zone from Google Calendar's `calendars.get('primary')` endpoint. Passed it through the chat route to `buildSystemPrompt`, which now uses `{ timeZone }` in all `toLocaleDateString` calls. The system prompt also explicitly states the user's time zone.
**Lesson:** Never assume server time zone matches user time zone. Anchor all user-facing date logic to the user's configured time zone.

### 21. No Rate Limiting

**Context:** No rate limiting existed on any route, leaving the API vulnerable to abuse and uncapped Anthropic API costs.
**Fix:** Added `express-rate-limit` with three tiers: global (100 req/15min), auth (20 req/15min), chat (20 req/1min). Rate limit responses use the same `{ error: string }` format as all other errors.

### 22. No Centralized Error Handler

**Context:** Each route handled errors individually with try/catch. An unhandled error would crash the server or return Express's default HTML error page.
**Fix:** Added a centralized Express error handler at the end of the middleware chain. Catches unhandled errors, logs them, and returns `{ error: string }` — matching the existing response format. In production, error messages are replaced with a generic "Internal server error" to prevent leaking stack traces.
