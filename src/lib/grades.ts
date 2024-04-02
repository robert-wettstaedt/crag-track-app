const _grades = [
  {
    FB: '5A',
    V: '1',
  },
  {
    FB: '5B',
    V: '1',
  },
  {
    FB: '5C',
    V: '2',
  },
  {
    FB: '6A',
    V: '3',
  },
  {
    FB: '6A+',
    V: '3',
  },
  {
    FB: '6B',
    V: '4',
  },
  {
    FB: '6B+',
    V: '4',
  },
  {
    FB: '6C',
    V: '5',
  },
  {
    FB: '6C+',
    V: '5',
  },
  {
    FB: '7A',
    V: '6',
  },
  {
    FB: '7A+',
    V: '7',
  },
  {
    FB: '7B',
    V: '8',
  },
  {
    FB: '7B+',
    V: '8',
  },
  {
    FB: '7C',
    V: '9',
  },
  {
    FB: '7C+',
    V: '10',
  },
  {
    FB: '8A',
    V: '11',
  },
  {
    FB: '8A+',
    V: '12',
  },
  {
    FB: '8B',
    V: '13',
  },
  {
    FB: '8B+',
    V: '14',
  },
  {
    FB: '8C',
    V: '15',
  },
  {
    FB: '8C+',
    V: '16',
  },
]

export const grades = _grades.map((grade, index) => {
  const color = index < 7 ? '#f59e0b' : index < 14 ? '#b91c1c' : '#581c87'
  return { ...grade, color }
})
