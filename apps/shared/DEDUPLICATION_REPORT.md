# Code Duplication Analysis & Resolution

**Analysis Date**: April 13, 2026  
**Status**: ✅ Resolved major deduplication

## Findings

### 🔴 **Critical Duplication** (Resolved)

**File**: `serializeDatabaseValue.util.ts`  
**Location**: Identical copies in both `api-server` and `api-server-fast`  
**Action**: ✅ **Deduplicated**

- Moved to shared module: `apps/shared/src/utils/serializeDatabaseValue.util.ts`
- Both repositories now import from `api-shared` package
- Updated imports in `wideAlltypes150.repository.ts` files
- **Lines of code eliminated**: ~15 per app (30 total)

### 🟡 **Potential Duplication** (Framework-Specific, Monitor)

**Files**:

- `api-server/src/utils/parseJsonQueryParam.util.ts` (Express)
- `api-server-fast/src/utils/parseJsonQueryFields.util.ts` (Fastify)

**Status**: ⚠️ **Different APIs but similar purpose**

- Express: Parses single JSON query param
- Fastify: Creates preValidation hook for multiple fields
- Both can't be merged without framework abstraction
- **Recommendation**: Extract utility wrapper if HTTP abstraction layer is introduced

### 🟢 **Test Pattern Duplication** (Not Worth Eliminating)

**Pattern**: Mock setup in component tests (e.g., `vi.fn()` patterns)  
**Count**: ~11 similar test patterns across component tests  
**Status**: ✅ **Acceptable** — leveraging framework features, not copy-paste logic

## Deduplication Impact

| Metric                   | Before | After | Delta   |
| ------------------------ | ------ | ----- | ------- |
| Lines in duplicate files | 30     | 0     | -100%   |
| Import paths (monorepo)  | 0      | 1     | +1      |
| Shared utils module      | 0      | 1     | +1      |
| SonarCloud code smells   | TBD    | TBD   | Monitor |

## Files Needing Cleanup

The following duplicate files should be **deleted** (they are no longer used):

```
apps/api-server/src/utils/serializeDatabaseValue.util.ts   — DELETE
apps/api-server-fast/src/utils/serializeDatabaseValue.util.ts  — DELETE
```

## Recommendations

1. **Monitor SonarCloud** for density improvement after changes propagate
2. **Consider shared utilities for**:
   - Error handling abstractions
   - Type definitions (e.g., PostgreSQL type mappings)
3. **If Fastify adoption grows**: Extract framework-agnostic HTTP abstraction
4. **Document import patterns** in shared module so future features reuse it

## Architecture Documentation Updated

- ✅ `apps/api-server/src/ARCHITECTURE.md` — Added Shared Utilities section
- ✅ `apps/api-server-fast/ARCHITECTURE.md` — Added Shared Utilities section
- ✅ `apps/shared/ARCHITECTURE.md` — New file documenting shared utilities pattern
