# Contract Analysis

Initial thoughts on the contract type system sketch in [contract-sketch.ts](./contract-sketch.ts).

## Strengths

1. **Covers essential JSON-compatible types** - Primitives, literals, arrays, objects, tuples, unions, intersections. This maps well to both TypeScript and JSON Schema/OpenAPI.

2. **Discriminated unions are explicit** - Having a dedicated `DiscriminatedUnionTypeDecl` with an explicit discriminator property is good. Both TypeScript and OpenAPI handle these better than arbitrary unions.

3. **Named type refs** - `NamedTypeRef` allows type reuse and recursive types. Essential for non-trivial schemas.

4. **Clear separation of literals vs primitives** - `StringLiteralTypeDecl` (a specific value) vs `StringTypeDecl` (any string) is the right distinction.

## Considerations

### Optional vs nullable

Currently `ObjectPropertyDecl` has an `optional` boolean. OpenAPI distinguishes between:
- **Optional**: property may be omitted entirely
- **Nullable**: property may be present with value `null`

These are orthogonal. A property can be required but nullable, or optional but non-nullable. Worth considering whether the type system needs this distinction, or if "optional" implicitly means "nullable" for your use case.

> Author's response - agreed.  I think my thinking is that TS does this by having the ? for optional, but a nullable type is just a union with a null literal, which can be expressed here.  It's more verbose, but I think it's fine to start with this

### Validation constraints

For runtime validation, you'll likely want constraints beyond shape:
- Strings: min/max length, regex pattern, format (email, uuid, date-time)
- Numbers: min/max value, integer-only, multipleOf
- Arrays: min/max length, unique items
- Objects: additional properties allowed?

These could be optional fields on the relevant type decls:

```typescript
type StringTypeDecl = {
  type: "String",
  minLength?: number,
  maxLength?: number,
  pattern?: string,
  format?: "email" | "uuid" | "date-time" | ...
}
```

> Author's response - agreed.  My thought is that those can be added later.  I don't think they affect anything architecturally right now


### Descriptions and metadata

OpenAPI benefits from human-readable metadata:
- Description
- Examples
- Deprecated flag
- Default value

Could be a generic `meta` field on any TypeDecl, or a wrapper type.

> Author's response - agreed.  Although again I'm not sure if it affect things architecturally to put it off.  **Except**, it might affect how a builder API is assembled.

### Builder API

The raw AST types are verbose to write by hand. A builder API would help:

```typescript
const Order = object({
  id: string(),
  total: number(),
  status: literal("pending", "shipped", "delivered"),
  items: array(ref("OrderItem")),
  notes: optional(string())
})
```

The builders return the underlying AST but provide a more ergonomic authoring experience. This is the pattern Zod, io-ts, and similar libraries use.

> Author's response - yes, and I will probably ask for your help later in designing that builder API.  As described above, adding metadata will probably have to be figured out.

### Type inference

One powerful pattern (used by Zod) is inferring TypeScript types from the schema:

```typescript
const OrderSchema = object({ ... })
type Order = Infer<typeof OrderSchema>
```

This avoids maintaining both a schema and a separate TypeScript type. The schema becomes the source of truth. Whether this is achievable depends on how the DSL is structured - it requires the schema to be defined with `const` values that TypeScript can infer literal types from.

> Author's response - I don't think this is the direction I want to go.  I think there are going to be some code generation steps involved, including the server and client API's described later.  If that's already going to be the case, then I think it will be cleaner (and probably less work on the TS compiler) to just generate the types.

## Open questions

1. **Where do named types live?** - `NamedTypeRef` references a `typeName`, but where is the registry of named types? Presumably a top-level `Record<string, TypeDecl>` that holds all named types.

> Author's response - I haven't yet defined this.  Presumably the overall contract document will be a listing of types, routes (described later), possibly some module namespacing for the types

2. **Recursive types** - Can a type reference itself? e.g., a `TreeNode` with `children: Array<TreeNode>`. This should work with `NamedTypeRef` but worth validating.

> Author's response - Yes, recursive types are allowed

3. **Generics** - Are generic types needed? e.g., `Paginated<T>` that wraps any type with pagination metadata. This adds significant complexity and may not be worth it.

> Author's response - this is a really good question.  I don't want the type system to feel hampered, but I also would want to make sure there are good uses cases for it.  Paginated might be such a case.  Are there others?

## Route Definitions

The sketch now includes route definitions with hierarchical groups, path parsing, and generated client/server APIs.

### Strengths

1. **Hierarchical groups** - Routes organized into groups with shared prefixes and params. Each group can be a potential injection point for middleware-like behavior.

2. **Fluent API shape** - The generated API structure is intuitive:
   ```typescript
   serverApi.users(params: usersParams).account.paymentInfo.UpdateCC(request)
   ```
   The `users(params)` call could return an object with user-context baked in, useful for permission checks scoped to that user.

3. **Unified request type** - Combining path params, query, headers, and body into a single `Request` type keeps the API surface clean.

4. **Symmetry between client and server** - Both sides use the same generated types, reducing mismatches.

### Considerations

#### Path param coercion

`path-to-regexp` extracts strings, but sometimes you want typed params like `userId: number`. Options:
- Explicitly declare param types in the route definition
- Infer from a named type if one matches the param name
- Default to string, let the app coerce

> Author's response - good point.  I think I've addressed this, in sort of a combination of all 3 options

#### Response shape

Currently `RouteResponseType` only has `body`. For completeness, may eventually want:
- `headers` - response headers (cache-control, custom headers)
- `status` - expected success status codes (or default to 200/201)

Keeping it simple for now is reasonable.

> Author's response - agreed.  As long as there's a logical place to put all this

#### Context and cookies (the TBD)

The mention of "additional context information" and "setting cookies" is important. Some options:
- Request context passed as a second argument (session, auth, request metadata)
- Response wrapper that allows setting cookies/headers alongside the body
- Keep it out of the typed contract and handle at a different layer (middleware)

> Author's response - agreed.  I've added context information to the description, although empty for now.  I'm hesitant about adding too much to that context object.

#### Groups vs flat routes

The group hierarchy is good for organization and shared params/middleware, but not every API needs deep nesting. A flat namespace with naming conventions (`users_account_updateCC`) might be simpler for smaller contracts. The group approach shines when there are shared params or middleware concerns at each level.

> Author's response - well, I'd like to see how we get along with the group-based approach.

