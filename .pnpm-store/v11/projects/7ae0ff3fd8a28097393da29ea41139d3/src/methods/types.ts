import type { ClassificationMethodId } from '../types'

export interface StandardDescriptor {
  id: string
  title: string
  titleEn?: string
  edition: string
  source: string
  sourceEn?: string
}

export interface ValidationIssue {
  field: string
  message: string
  messageEn: string
}

export interface ResultMetric {
  key: string
  label: string
  labelEn: string
  value: string
  valueEn?: string
}

export interface ParameterDescription {
  key: string
  label: string
  labelEn: string
  value: string
  valueEn?: string
  score?: string
  scoreEn?: string
}

export interface ClassificationResult {
  value: number
  displayValue: string
  grade: string
  gradeEn: string
  summary: string
  summaryEn: string
  metrics: ResultMetric[]
  warnings: string[]
  warningsEn?: string[]
}

export interface ClassificationAdapter<Form extends Record<string, unknown>, Result extends ClassificationResult> {
  id: ClassificationMethodId
  name: string
  nameEn: string
  standard: StandardDescriptor
  inputVersion: number
  createInitialForm(): Form
  normalize(raw: unknown): Form
  validate(form: Form): ValidationIssue[]
  calculate(form: Form): Result
  describe(form: Form, result: Result | null): ParameterDescription[]
}

export type AnyClassificationAdapter = ClassificationAdapter<Record<string, unknown>, ClassificationResult>
