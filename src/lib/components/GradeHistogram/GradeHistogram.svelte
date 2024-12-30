<script lang="ts">
  import Vega, { type VegaProps } from '$lib/components/Vega'
  import type { Grade, UserSettings } from '$lib/db/schema'
  import { getGradeColor } from '$lib/grades'

  interface Props extends Partial<VegaProps> {
    axes?: boolean
    data: Array<{ grade: string | undefined | null }>
    grades: Grade[]
    gradingScale: UserSettings['gradingScale']
  }

  const { axes = true, data, grades, gradingScale, ...rest }: Props = $props()
</script>

<Vega
  {...rest}
  spec={{
    ...(rest.spec as any),
    background: 'transparent',
    data: {
      values: data,
    },
    mark: {
      type: 'bar',
      stroke: 'white',
      cursor: 'pointer',
    },
    encoding: {
      ...(rest.spec as any)?.encoding,
      color: {
        legend: null,
        field: 'grade',
        scale: {
          domain: grades.map((grade) => grade[gradingScale]),
          range: grades.map((grade) => getGradeColor(grade)),
        },
      },
      x: {
        axis: axes ? true : null,
        field: 'grade',
        scale: {
          domain: grades.map((grade) => grade[gradingScale]),
        },
        type: 'nominal',
        title: 'Grade',
      },
      y: {
        axis: axes ? true : null,
        aggregate: 'count',
        field: 'grade',
        title: 'Count',
      },
      tooltip: [
        {
          field: 'grade',
          type: 'nominal',
          title: 'Grade',
        },
        {
          aggregate: 'count',
          field: 'grade',
          title: 'Count',
        },
      ],
    },
  }}
  opts={{
    ...rest.opts,
    actions: false,
    renderer: 'svg',
    theme: 'dark',
  }}
/>
