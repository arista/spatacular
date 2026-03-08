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

### Descriptions and metadata

OpenAPI benefits from human-readable metadata:
- Description
- Examples
- Deprecated flag
- Default value

Could be a generic `meta` field on any TypeDecl, or a wrapper type.

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

### Type inference

One powerful pattern (used by Zod) is inferring TypeScript types from the schema:

```typescript
const OrderSchema = object({ ... })
type Order = Infer<typeof OrderSchema>
```

This avoids maintaining both a schema and a separate TypeScript type. The schema becomes the source of truth. Whether this is achievable depends on how the DSL is structured - it requires the schema to be defined with `const` values that TypeScript can infer literal types from.

## Open questions

1. **Where do named types live?** - `NamedTypeRef` references a `typeName`, but where is the registry of named types? Presumably a top-level `Record<string, TypeDecl>` that holds all named types.

2. **Recursive types** - Can a type reference itself? e.g., a `TreeNode` with `children: Array<TreeNode>`. This should work with `NamedTypeRef` but worth validating.

3. **Generics** - Are generic types needed? e.g., `Paginated<T>` that wraps any type with pagination metadata. This adds significant complexity and may not be worth it.
