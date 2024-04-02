const _grades = [
  {
    FB: '5A',
    V: 'V1',
  },
  {
    FB: '5B',
    V: 'V1',
  },
  {
    FB: '5C',
    V: 'V2',
  },
  {
    FB: '6A',
    V: 'V3',
  },
  {
    FB: '6A+',
    V: 'V3',
  },
  {
    FB: '6B',
    V: 'V4',
  },
  {
    FB: '6B+',
    V: 'V4',
  },
  {
    FB: '6C',
    V: 'V5',
  },
  {
    FB: '6C+',
    V: 'V5',
  },
  {
    FB: '7A',
    V: 'V6',
  },
  {
    FB: '7A+',
    V: 'V7',
  },
  {
    FB: '7B',
    V: 'V8',
  },
  {
    FB: '7B+',
    V: 'V8',
  },
  {
    FB: '7C',
    V: 'V9',
  },
  {
    FB: '7C+',
    V: 'V10',
  },
  {
    FB: '8A',
    V: 'V11',
  },
  {
    FB: '8A+',
    V: 'V12',
  },
  {
    FB: '8B',
    V: 'V13',
  },
  {
    FB: '8B+',
    V: 'V14',
  },
  {
    FB: '8C',
    V: 'V15',
  },
  {
    FB: '8C+',
    V: 'V16',
  },
]

export const grades = _grades.map((grade, index) => {
  const color = index < 6 ? '#f59e0b' : index < 14 ? '#b91c1c' : '#581c87'
  return { ...grade, color }
})
