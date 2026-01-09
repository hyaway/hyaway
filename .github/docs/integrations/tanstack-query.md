# TanStack Query Patterns

> **Status**: Active pattern used throughout the codebase

## Overview

The project uses TanStack Query for all server state management. Queries are organized in `src/integrations/hydrus-api/queries/` by domain, and the provider is configured in `src/integrations/tanstack-query/`.

**For detailed API and usage examples**, see:

- [TanStack Query Documentation](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Practical React Query](https://tkdodo.eu/blog/practical-react-query) - Recommended best practices

## Provider Configuration

Located in `src/integrations/tanstack-query/root-provider.tsx`:

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Data doesn't change without user interaction
      retry: shouldRetryQuery,
    },
  },
});
```

**Retry logic:**

- 4xx errors → No retry (client errors are non-recoverable; 419 is handled by the Axios interceptor)
- 5xx errors → Retry up to 3 times
- Network failures → Retry up to 3 times

## Query Patterns

### Basic Query

```ts
export const useGetClientOptionsQuery = () => {
  const isConfigured = useIsApiConfigured();

  return useQuery({
    queryKey: ["getClientOptions"],
    queryFn: async () => getClientOptions(),
    enabled: isConfigured,
    staleTime: Infinity, // Options don't change often
  });
};
```

**Conventions:**

- Hook name: `use{Action}Query`
- Always check `isConfigured` before enabling
- Use `staleTime: Infinity` for data that doesn't change without user action

### Query with Transform

```ts
export const useGetFilesMetadata = (file_ids: Array<number>) => {
  return useQuery({
    queryKey: ["getFilesMetadata", file_ids],
    queryFn: async () => getFileMetadata(file_ids),
    select: (data) =>
      data.metadata.map((meta) => ({
        file_id: meta.file_id,
        width: meta.width,
        height: meta.height,
      })),
    enabled: isConfigured && file_ids.length > 0,
  });
};
```

Use `select` to transform/filter data without affecting cache.

### Infinite Query

For paginated/batched data:

```ts
export const useInfiniteGetFilesMetadata = (file_ids: Array<number>) => {
  const BATCH_SIZE = 128;

  return useInfiniteQuery({
    queryKey: ["infiniteGetFilesMetadata", file_ids, BATCH_SIZE],
    queryFn: async ({ pageParam = 0 }) => {
      const batchFileIds = file_ids.slice(pageParam, pageParam + BATCH_SIZE);
      const response = await getFileMetadata(batchFileIds);
      return {
        metadata: response.metadata,
        nextCursor:
          pageParam + BATCH_SIZE < file_ids.length
            ? pageParam + BATCH_SIZE
            : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });
};
```

Used by `ThumbnailGallery` for infinite scroll.

### Derived Query

Build on top of other queries:

```ts
export const useThumbnailDimensions = () => {
  const { data, isFetched } = useGetClientOptionsQuery();

  return useMemo(() => {
    if (!data?.old_options?.thumbnail_dimensions) {
      return { width: 200, height: 200 }; // Default
    }
    // Transform and return
  }, [data, isFetched]);
};
```

## Mutation Patterns

### Basic Mutation

```ts
export const useDeleteFilesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: DeleteFilesOptions) => deleteFiles(options),
    onSuccess: (_data, variables) => {
      // Update cache optimistically
      const fileIds = getFileIdsFromIdentifiers(variables);
      updateFileMetadataFlags(queryClient, fileIds, (meta) => ({
        ...meta,
        is_trashed: true,
      }));
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["searchFiles", "recentlyTrashed"],
      });
    },
    mutationKey: ["deleteFiles"],
  });
};
```

**Conventions:**

- Hook name: `use{Action}Mutation`
- Update cache in `onSuccess` for immediate UI feedback
- Invalidate related queries to refetch stale data

### Cache Update Helper

For updating multiple query caches at once:

```ts
const updateFileMetadataFlags = (
  queryClient: QueryClient,
  fileIds: Array<number> | undefined,
  updater: (metadata: FileMetadata) => FileMetadata,
) => {
  // Update single file queries
  // Update batch queries
  // Update infinite queries
};
```

## Query Key Conventions

| Pattern         | Example                                              |
| --------------- | ---------------------------------------------------- |
| Single resource | `["getSingleFileMetadata", fileId]`                  |
| Collection      | `["getFilesMetadata", fileIds]`                      |
| Search          | `["searchFiles", "recentlyArchived", tags, options]` |
| Infinite        | `["infiniteGetFilesMetadata", fileIds, batchSize]`   |

**Rules:**

- First element: action name
- Include all parameters that affect the result
- Use descriptive strings for search variants

## Stale Time Guidelines

| Data Type      | Stale Time      | Reason                           |
| -------------- | --------------- | -------------------------------- |
| File metadata  | `Infinity`      | Only changes via user action     |
| Client options | `Infinity`      | Rarely changes                   |
| Search results | `30s` (default) | May change from external sources |
| Services list  | `Infinity`      | Static configuration             |

## Query Files

| File                      | Purpose                                     |
| ------------------------- | ------------------------------------------- |
| `queries/manage-files.ts` | File metadata, CRUD mutations               |
| `queries/search.ts`       | File search queries (inbox, archived, etc.) |
| `queries/options.ts`      | Client options, namespace colors            |
| `queries/services.ts`     | Hydrus services                             |
| `queries/access.ts`       | API access verification                     |
| `queries/manage-pages.ts` | Remote page management                      |

## DevTools

DevTools are conditionally loaded in development:

```tsx
// src/integrations/tanstack-query/devtools.tsx
const ReactQueryDevtools = React.lazy(() =>
  import("@tanstack/react-query-devtools").then((mod) => ({
    default: mod.ReactQueryDevtools,
  })),
);
```
