import type { ClassificationExportFormat } from './ClassificationExportDialog'

export function exportSuccessMessage(language: 'zh' | 'en', formats: ClassificationExportFormat[]) {
  const en = language === 'en'
  return formats
    .map((format) =>
      format === 'case'
        ? en
          ? 'Project file exported.'
          : '项目文件已导出。'
        : en
          ? 'Word report exported.'
          : 'Word 报告已导出。',
    )
    .join(en ? ' ' : '')
}

export function exportFailureMessage(language: 'zh' | 'en', failures: string[]) {
  return language === 'en' ? `Export failed: ${failures.join('; ')}` : `导出失败：${failures.join('；')}`
}
