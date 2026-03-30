// Shared Tina types and helpers safe for both server and client components.
// Does NOT import the generated Tina client (which uses Node APIs).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TinaQueryResult<K extends string = string> = {
  query: string
  variables: Record<string, unknown>
  data: { [key in K]: any }
}

/** Build the tinaResult object passed from server page to client component. */
export function buildTinaResult<K extends string>(
  tinaQuery: TinaQueryResult<K> | null,
  collection: K,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fallbackData: any,
  relativePath: string,
): TinaQueryResult<K> {
  const data = tinaQuery?.data ?? ({ [collection]: fallbackData } as TinaQueryResult<K>['data'])
  return {
    query: tinaQuery?.query ?? '',
    variables: tinaQuery?.variables ?? { relativePath },
    data,
  }
}

/** Build useTina props with a fallback stub query when Tina client is unavailable. */
export function buildTinaProps<K extends string>(
  props: TinaQueryResult<K>,
): TinaQueryResult<K> {
  return props.query
    ? props
    : { ...props, query: '{ __typename }', variables: {} }
}
