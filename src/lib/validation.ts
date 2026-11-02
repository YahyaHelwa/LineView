import type { NewDefect } from '../types'

export type DefectErrors = Partial<Record<keyof NewDefect, string>>

export const DESCRIPTION_MIN = 10
export const DESCRIPTION_MAX = 280

/** Returns an object with one message per invalid field; empty object means the form is valid. */
export function validateDefect(input: NewDefect): DefectErrors {
  const errors: DefectErrors = {}
  if (!input.stationId) errors.stationId = 'Choose the station where the defect was found.'
  if (!input.workOrderId) errors.workOrderId = 'Choose the work order.'
  const text = input.description.trim()
  if (text.length < DESCRIPTION_MIN) errors.description = `Describe the defect in at least ${DESCRIPTION_MIN} characters.`
  else if (text.length > DESCRIPTION_MAX) errors.description = `Keep the description under ${DESCRIPTION_MAX} characters.`
  return errors
}
