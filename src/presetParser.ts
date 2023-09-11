import includes from "lodash/includes"
import merge from "lodash/merge"

import {
  BuilderState,
  ColumnTypes,
  EncodingState,
  FindColumnsSpec,
  Grouping,
  JsonRecord,
  MarkPropName,
  PlainRecord,
  Preset,
  PresetColumnFilter,
} from "./types"

import { objectFrom } from "./collectionUtils"

export function updateStateFromPreset(
  state: BuilderState,
  presetSpec: Preset,
  columnTypes: ColumnTypes,
) {
  if (presetSpec == null) return null

  // Using fromEntries/entries rather than the spread operator to
  // keep the ordering intact.
  const spec = objectFrom(presetSpec as PlainRecord<any>)

  const mark = spec.mark as Grouping<Record<string, MarkPropName>>

  const columns = findColumns(spec.findColumns, columnTypes)
  followIfConditions(spec, columns)

  const encodingState: EncodingState = Object.fromEntries(
    Object.entries(spec.encoding).map(([name, channelSpec]: [string, JsonRecord]) => [
      name,
      {...channelSpec, field: columns[channelSpec.field as string]}
    ]))

  state.setPreset(presetSpec)
  state.setMark({ ...mark })
  state.setEncoding({ ...encodingState })
}

function findColumns(
  findColsSpec: FindColumnsSpec,
  columnTypes: ColumnTypes,
): PlainRecord<string> {
  if (!findColsSpec) return {}

  const columns = {}

  for (const [varName, filter] of Object.entries(findColsSpec)) {
    const col = findColumn(
      filter, columnTypes, Object.values(columns))

    if (col) columns[varName] = col
  }

  return columns
}

function findColumn(
  filterSpec: PresetColumnFilter,
  columnTypes: ColumnTypes,
  columnsAlreadyFound: string[],
): string|null {
  if (!filterSpec) return

  let candidateColsAndTypes = Object.entries(columnTypes)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([_, info]) => {
        let keep = true

        if (filterSpec.type) keep = keep && includes(filterSpec.type, info.type)
        if (filterSpec.maxUnique) keep = keep && (info.unique ?? 0) <= filterSpec.maxUnique

        return keep
      })

  if (candidateColsAndTypes.length == 0 && filterSpec.type?.some(x => x == null)) {
    candidateColsAndTypes = Object.entries(columnTypes)
  }

  const candidateCols = candidateColsAndTypes.map(([name]) => name)

  return candidateCols.find(name => !includes(columnsAlreadyFound, name))
}

function followIfConditions(spec, columns) {
  const matchingIfSpecs = Object.entries(spec.ifColumn ?? {})
    .filter(([col]) => columns[col] != null)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(([_, spec]) => spec)

  if (matchingIfSpecs) merge(spec, ...matchingIfSpecs.reverse())
}
