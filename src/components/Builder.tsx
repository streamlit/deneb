import React, { useState, useEffect, useCallback } from 'react'
import merge from 'lodash/merge'

import { EncodingPicker, useEncodingState } from './EncodingPicker.tsx'

const MARKS = [
  //'arc',
  'area', // Properties: point, line, interpolate
  'bar', // Properties: orient, binSpacing
  //'boxplot',
  //'errorband',
  //'errorbar',
  //'image',
  'line', // Properties: point, interpolate
  'point', // Properties: none needed. Use encoding + value instead.
  //'rect',
  //'rule',
  //'text', // Need to show "text" encoding. Properties: dx, dy, fontSize, limit, align, baseline
  //'tick',
  //'trail',
  'circle', // Properties: none needed. Use encoding + value instead.
  'square', // Properties: none needed. Use encoding + value instead.
  //'geoshape',
]

const FIELD_TYPES = {
  'Auto': 'auto',  // We added this.
  'Nominal': 'nominal',
  'Ordinal': 'ordinal',
  'Quantitative': 'quantitative',
  'Temporal': 'temporal',
}

const DEFAULTS = {
  mark: {
    type: 'circle',
  },
  x: {
    fieldIndex: 0,
    type: 'quantitative',
  },
  y: {
    fieldIndex: 1,
    type: 'quantitative',
  },
  color: {
    type: 'nominal',
  },
  size: {
    type: 'quantitative',
  },
  opacity: {
    type: 'quantitative',
  },
}

interface ColSpec {
  label: str,
  field: str | null,
  detectedType: str | null,
}

interface BuilderPaneProps {
  components: {
    Label: React.Node,
    SelectBox: React.Node,
    TextBox: React.Node,
    BuilderWrapper: React.Node,
    WidgetGroup: React.Node,
    WidgetWraper: React.Node,
  },
  colSpecs: ColSpec[],
  state: {
    setSpec: (any) => void,
  },
  origSpec: any,
}

export function BuilderPane(props: BuilderPaneProps) {
  const encoding = props.origSpec?.encoding

  const [markType, setMarkType] = useState(props.origSpec?.mark?.type ?? DEFAULTS.mark.type)

  const xEncodingState = useEncodingState({
    field: encoding?.x?.field ?? props.colSpecs?.[DEFAULTS.x.fieldIndex + 1]?.field,
    type: encoding?.x?.type ?? 'auto',
    value: null,
    // title
    // value (maybe skip?)
    // timeUnit (if temporal)
    // axis
    // aggregate
  })

  const yEncodingState = useEncodingState({
    field: encoding?.y?.field ?? props.colSpecs?.[DEFAULTS.y.fieldIndex + 1]?.field,
    type: encoding?.y?.type ?? 'auto',
    value: null,
    // title
    // value (maybe skip?)
    // timeUnit (if temporal)
    // axis
    // aggregate
  })

  const colorEncodingState = useEncodingState({
    field: encoding?.color?.field,
    type: encoding?.color?.type ?? 'auto',
    value: null,
    // title
    // value
    // timeUnit (if temporal)
    // axis
    // aggregate
  })

  const sizeEncodingState = useEncodingState({
    field: encoding?.size?.field,
    type: encoding?.size?.type ?? 'auto',
    value: null,
    // title
    // value
    // timeUnit (if temporal)
    // axis
    // aggregate
  })

  const opacityEncodingState = useEncodingState({
    field: encoding?.opacity?.field,
    type: encoding?.opacity?.type ?? 'auto',
    value: null,
    // title
    // value
    // timeUnit (if temporal)
    // axis
    // aggregate
  })

  const encodings = [
    ["X", xEncodingState],
    ["Y", yEncodingState],
    ["Color", colorEncodingState],
    ["Size", sizeEncodingState],
    ["Opacity", opacityEncodingState],
  ]

  // tooltip
  // facet, row, column
  // x2, y2, text, angle, xOffset(+random), yOffset(+random), strokeWidth, strokeDash, shape

  const fields = {'None': null}
  props.colSpecs.forEach(s => fields[s.label] = s.field)

  useEffect(() => {
    const newSpec = merge({}, props.origSpec, {
      mark: {
        type: markType,
        tooltip: true,
      },
      encoding: {
        ...buildEncoding('x', xEncodingState.state, props.colSpecs),
        ...buildEncoding('y', yEncodingState.state, props.colSpecs),
        ...buildEncoding('color', colorEncodingState.state, props.colSpecs),
        ...buildEncoding('size', sizeEncodingState.state, props.colSpecs),
        ...buildEncoding('opacity', opacityEncodingState.state, props.colSpecs),
      },
      params: [{
        name: 'grid',
        select: 'interval',
        bind: 'scales'
      }]
    })

    props.state.setSpec(newSpec)
  }, [
      markType,
      props.origSpec,
      ...encodings.map(x => x[1].state)
  ])

  return (
    <props.components.BuilderWrapper>
      <props.components.WidgetGroup>
        <props.components.WidgetWrapper>
          <props.components.Label>Mark</props.components.Label>
          <props.components.SelectBox
            items={MARKS}
            value={markType}
            setValue={setMarkType}
          />
        </props.components.WidgetWrapper>
      </props.components.WidgetGroup>

      {encodings.map(([title, encodingState]) => (
        <EncodingPicker
          components={props.components}
          title={title}
          state={encodingState.state}
          setComponent={encodingState.setComponent}
          fields={fields}
          types={FIELD_TYPES}
          key={title}
        />
      ))}

    </props.components.BuilderWrapper>
  )
}

export function useBuilderState(origSpec) {
  const [spec, setSpec] = useState(origSpec)

  return useCallback({
    spec,
    setSpec,
  }, [spec, setSpec])
}

function buildEncoding(key, state, colSpecs) {
  const enc = {}
  const encWrapper = {[key]: enc}

  if (state.field == null) {
    if (state.value) {
      enc.value = state.value
    } else {
      return {}
    }
  } else {
    enc.field = state.field
    enc.type = getColType(
      state.type,
      state.field,
      DEFAULTS[key].type,
      colSpecs,
    )
  }

  return encWrapper
}

function getColType(colType, colName, defaultType, colSpecs) {
  if (colType != 'auto') return colType

  const colSpec = colSpecs.find(s => s.field == colName)
  return colSpec?.detectedType ?? defaultType
}
