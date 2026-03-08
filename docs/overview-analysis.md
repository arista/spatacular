# Overview Analysis

Initial thoughts on the Spatacular overview document.

## Strengths

1. **Unified request model** - Treating initial page loads and SPA URL changes as the same "command" is elegant. The server app being agnostic to the request origin simplifies code significantly.

2. **Contract-first approach** - Defining routes/requests/responses in a DSL that generates types, routing, and validation is sound. This reduces boilerplate and catches mismatches at build time.

3. **Promise-based payload for URL changes** - Letting the client decide whether to wait or show optimistic UI is flexible.

## Questions/Considerations

1. **Error handling** - Errors have different "scopes" and should be handled accordingly:

   **Contextual errors** (stay in place, show error inline):
   - 404 - content missing, but navigation context is valid
   - 403 - forbidden, but user knows where they are
   - Network failure - transient, show retry option in context
   - Validation errors - definitely inline

   **Flow-interrupting errors** (break out of normal flow):
   - 401 / auth required - redirect to login, return after
   - Session expired - similar, maybe with "session expired" messaging
   - Maintenance mode - full-page takeover

   **How other frameworks handle this:**
   - **Remix/Next.js** - Route-level error boundaries. Nested route can fail while parent layout stays intact.
   - **React Query / SWR** - Return `{ data, error, isLoading }` per-query. Components handle errors locally with full context.
   - **Axios interceptors** - Global 401 handler that redirects to login before component ever sees the error. Auth is "infrastructure-level."
   - **Native mobile** - Errors shown inline with retry buttons. Navigation chrome stays stable.

   **Suggested approach:** Auth is handled globally as infrastructure, everything else is handled locally. The framework could:
   - Intercept auth errors (401, specific 403 variants) and trigger a login flow, storing the pending Command to retry after
   - Pass all other errors to the app as a "failed Command" with error details, letting the app show contextual error UI

2. **Caching/hydration** - ~~For initial page loads, will the payload be hydrated into client state? Need to avoid duplicate fetches.~~ **Resolved:** The framework handles passing state to the client app on initial page load, and also handles retrieving new page state on URL changes. The client app doesn't handle fetching in these cases - it just receives commands with payloads. This keeps the app declarative and agnostic to the data source.

3. **History API integration** - The framework should handle this transparently:
   - Forward navigation: framework calls `pushState` and dispatches the Command
   - Back/forward buttons: framework listens for `popstate`, converts URL to Command (via contract), dispatches it
   - The app just receives Commands either way

   **Back button data:** `pushState` can store a state object returned on `popstate`. Options:
   - Store payload for instant cached back (feels like "undo", matches native app behavior)
   - Always re-fetch (feels like "loading", but ensures fresh data)
   - Hybrid: show cached immediately, refresh in background

   User expectations vary by content type - static content should cache, live data should refresh. Consider making this configurable per-route in the contract.

4. **Authentication state** - The mention of cookies in Request is brief. How are auth contexts passed to the server app? Do responses include auth updates?

5. **The ".json" suffix approach** - Content negotiation via Accept header is cleaner than URL munging, but either works.

6. **Bundle references** - "Fingerprinted" bundles are great. Is there a build pipeline assumption?

## Notes

The dependency on chchchchanges for state and brint for views makes sense - this is the "plumbing" layer between them.
