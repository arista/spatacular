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

## Real-time Updates via WebSockets

The goal is to add real-time updates without introducing significant cognitive burden. The existing Command-based architecture extends naturally:

- **Commands come in** (user actions, URL changes)
- **Subscriptions push out** (server-initiated updates)

### Response-declared subscriptions

A Response could include a `_live` field declaring which resources should be kept in sync:

```typescript
{
  order: { id: "order-123", total: 47.50, items: [...] },
  customer: { id: "cust-456", name: "Alice" },

  _live: ["order:order-123", "customer:cust-456"]
}
```

The framework then:
1. Opens/maintains subscriptions to those resources
2. On navigation, diffs old vs new `_live` sets - subscribes to new ones, unsubscribes from dropped ones
3. When updates arrive, patches the relevant part of the current state

### Reactive flow with multindex

If the client uses multindex as a pseudo-"database" displayed by brint, the framework can patch updates directly:

```
Server event → WebSocket → Framework → multindex update → brint re-renders
```

The app code never touches WebSocket handlers. It just:
1. Returns responses with `_live` declarations
2. Structures its state in multindex
3. Builds views with brint that query multindex

The framework invisibly keeps multindex in sync with the server. From the app's perspective, multindex *is* the data - whether it arrived from initial page load, SPA navigation, or WebSocket push is irrelevant.

### Event sourcing consideration

Raw events probably shouldn't flow to the client:
- **Leaky abstraction** - Client shouldn't need to understand the event schema
- **Security surface** - Events often contain data that shouldn't reach the client
- **Derived state is what matters** - Client cares about current state, not event history

Instead, the server projects events into full resource state snapshots that the client applies. The event store remains a server-side implementation detail.

### Framework concerns

**Identity/keying** - The framework needs to match incoming updates to the right spot in multindex. Probably `type + id` as a convention, or explicit keys in the `_live` declaration.

**Stale subscriptions** - If the user stays on a page for a long time, do subscriptions stay open indefinitely? May need heartbeat/timeout logic.

**Conflict with in-flight requests** - User edits a resource while a WebSocket update arrives with old state. The framework might need to hold off applying updates during mutations, or use versioning to ignore stale pushes.

**Offline/reconnect** - When the WebSocket reconnects, the framework could re-fetch current state for all active subscriptions to catch up on missed updates.

These are all framework-level concerns - the app stays unaware of the complexity.

## Notes

The dependency on chchchchanges for state and brint for views makes sense - this is the "plumbing" layer between them.
