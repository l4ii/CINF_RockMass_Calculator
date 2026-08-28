export interface AboutCaseStudy {
  title: string
  description: string
  highlights: string[]
}

export const ABOUT_CASE_STUDIES: Record<'research' | 'mining', AboutCaseStudy[]> = {
  research: [
    {
      title: '科技创新与平台建设成效',
      description: '中心在重大科研项目布局、省部级与国家级科技奖励、标准制修订以及科研成果工程化方面持续突破。',
      highlights: ['重大科研项目批量落地', '省部级及国家级奖励', '闭环创新链示范应用'],
    },
  ],
  mining: [
    {
      title: '矿山事业部工程实践',
      description: '围绕废水治理、浆体输送与工程标准体系，形成稳定的项目交付与技术服务能力。',
      highlights: ['技术体系完整', '工程经验丰富', '多专业协同交付'],
    },
  ],
}

export const ABOUT_DEPARTMENT_NAMES: Record<'cinf' | 'research' | 'mining', string> = {
  cinf: '长沙有色冶金设计研究院',
  research: '科研创新中心',
  mining: '矿山事业部',
}
