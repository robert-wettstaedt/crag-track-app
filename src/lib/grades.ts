import type { Grade } from '$lib/db/schema'

export const getGradeColor = (grade: Grade) => {
  return grade.id < 7 ? '#f59e0b' : grade.id < 14 ? '#b91c1c' : '#581c87'
}
