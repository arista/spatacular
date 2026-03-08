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

type ObjectPropertyDecl = {propertyType: TypeDecl, optional: boolean}

type TupleTypeDecl = {type: "Tuple", elements: Array<TypeDecl>}

type UnionTypeDecl = {type: "Union", types: Array<TypeDecl>}

type IntersectionTypeDecl = {type: "Intersection", types: Array<TypeDecl>}

// The TypeDecl's must resolve to ObjectTypes that all contain the specified discriminator property, with the different literal values of the same type
type DiscriminatedUnionTypeDecl = {type: "DiscriminatedUnion", discriminator: string, types: Array<TypeDecl>}

type NamedTypeRef = {type: "NamedType", typeName: string}
