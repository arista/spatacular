type TypeDecl =
  LiteralTypeDecl
  | PrimitiveTypeDecl
  | ArrayTypeDecl
  | ObjectTypeDecl
  | TupleTypeDecl
  | UnionTypeDecl
  | IntersectionTypeDecl
  | DiscriminatedUnionTypeDecl
  | NamedTypeRef

type LiteralTypeDecl =
  NullLiteralTypeDecl
  | BooleanLiteralTypeDecl
  | NumberLiteralTypeDecl
  | StringLiteralTypeDecl

type NullLiteralTypeDecl = {type: "NullLiteral"}
type BooleanLiteralTypeDecl = {type: "BooleanlLiteral", value: boolean}
type NumberLiteralTypeDecl = {type: "NumberlLiteral", value: number}
type StringLiteralTypeDecl = {type: "StringlLiteral", value: string}

type PrimitiveTypeDecl =
  BooleanTypeDecl
  | NumberTypeDecl
  | StringTypeDecl
  
type BooleanTypeDecl = {type: "Boolean"}
type NumberTypeDecl = {type: "Number"}
type StringTypeDecl = {type: "String"}

type ArrayTypeDecl = {type: "Array", elementType: TypeDecl}

type ObjectTypeDecl = {type: "Object", properties: Record<string, ObjectPropertyDecl>}
v
type ObjectPropertyDecl = {propertyType: TypeDecl, optional: boolean}

type TupleTypeDecl = {type: "Tuple", elements: Array<TypeDecl>}

type UnionTypeDecl = {type: "Union", types: Array<TypeDecl>}

type IntersectionTypeDecl = {type: "Intersection", types: Array<TypeDecl>}

// The TypeDecl's must resolve to ObjectTypes that all contain the specified discriminator property, with the different literal values of the same type
type DiscriminatedUnionTypeDecl = {type: "DiscriminatedUnion", discriminator: string, types: Array<TypeDecl>}

type NamedTypeRef = {type: "NamedType", typeName: string}


// Routes define the contract between server and client.  Routes are declared with internal names, which are used to generate API and type names.  Routes can also be organized into groups, which both provide multiple routes with a common prefix (and potentially a common set of params), and also a mechanism for organizing the internal types and API definitions.

// The generated route Request and Response types are used by both server and client.  The type names are formed from the route names - i.e., AddUserRequest / AddUserResponse.  If groups are used, then those groups organize the types into separate modules: e.g., users.AddRequest / users.AddResponse

// Each RouteDef specifies a path, which is parsed using the "path-to-regexp" npm library's parse() call.  The parsed path will reveal the parameters defined by the path (which should be combined with any params found in group prefixes - error if collisions).  If there are any parameters, these will form the "params" property of the generated Request type.  The Request type can also specify additional query, headers, and body types.

// Mapping from route or group name to entry
type Routes = Record<string, RoutesEntry>

type RoutesEntry =
  RouteGroup
  | RouteDef

// The path should be a path that can be interpreted by the "path-to-regexp" npm library.
type RouteGroup = {
  type: "Group"
  path: string
  routes: Routes
}

// The path should be a path that can be interpreted by the "path-to-regexp" npm library.
type RouteDef = {
  type: "Route"
  // No method means match any method
  method?: RouteMethod | Array<RouteMethod>
  path: string
  request?: RouteRequestType
  response?: RouteResponseType
}

// Maybe someday add PUT, PATCH, DELETE
type RouteMethod = "GET" | "POST"

// Query, and Headers must resolve to ObjectTypes.  The param types don't need to be specified since they are inferred from the route's path declaration
type RouteRequestType = {
  query?: TypeDecl
  headers?: TypeDecl
  body?: TypeDecl
}

type RouteResponseType = {
  body?: TypeDecl
}

// With these route definitions, both client and server interfaces can be defined.  On the client side, each request gets its own method, named using the fully-qualified route:
//
//   clientApi.users.acoount.paymentInfo.UpdateCC(request: UpdateCCRequest): Promise<UpdateCCResponse>
//
// On the server side, a similar API interface is generated that the app is expected to implement.
//
//   serverApi.users.acoount.paymentInfo.UpdateCC(request: UpdateCCRequest): Promise<UpdateCCResponse>
//
// If groups along the way define params, those will show up at the appropriate level:
//
//   serverApi.users(params: usersParams).acoount.paymentInfo.UpdateCC(request: UpdateCCRequest): Promise<UpdateCCResponse>
//
// This allows the server to create request handling objects along the way that can process parameters as needed
//
// TBD - the call to a server api might also include additional context information, and the response might allow the implementation to declare contextual information about the response, such as setting cookies, etc.
//

