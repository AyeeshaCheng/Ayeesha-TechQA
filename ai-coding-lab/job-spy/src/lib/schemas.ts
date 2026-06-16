import { z } from 'zod'

// ==================== Resume (User Input) ====================

export const resumeSchema = z.object({
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  yearsOfExperience: z.number(),
  jobTitle: z.string(),
  expectedSalary: z.string(),
  expectedCity: z.string(),
  skills: z.array(z.string()),
  personalAdvantage: z.string(),
  projectExperience: z.string(),
  workExperience: z.string(),
  education: z.string(),
  certifications: z.string(),
})

export type ResumeData = z.infer<typeof resumeSchema>

// ==================== Optimized Resume (AI output — structured JSON) ====================

export const optimizedResumeSchema = z.object({
  personalInfo: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string(),
    jobTitle: z.string(),
    yearsOfExperience: z.number(),
    expectedSalary: z.string(),
    expectedCity: z.string(),
  }).describe("个人信息"),
  professionalSummary: z.string().describe("职业摘要：AI 提炼的核心竞争力概述，3-5句话"),
  skills: z.array(z.object({
    category: z.string().describe("技能分类，如「前端开发」「后端开发」「工具与平台」"),
    items: z.array(z.string()),
  })).describe("分类技能列表"),
  workExperience: z.array(z.object({
    company: z.string(),
    role: z.string(),
    period: z.string(),
    highlights: z.array(z.string()).describe("STAR 法则优化后的工作成果要点"),
  })).describe("工作经历"),
  projectExperience: z.array(z.object({
    name: z.string(),
    role: z.string(),
    description: z.string(),
    highlights: z.array(z.string()).describe("STAR 法则优化后的项目成果要点"),
  })).describe("项目经历"),
  education: z.array(z.object({
    school: z.string(),
    degree: z.string(),
    major: z.string(),
    period: z.string(),
  })).describe("教育背景"),
  certifications: z.array(z.string()).describe("资格证书列表"),
})

export type OptimizedResume = z.infer<typeof optimizedResumeSchema>

// ==================== Step 1: JD Parser Output ====================

export const parsedJDSchema = z.object({
  jobTitle: z.string().describe('岗位名称'),
  company: z.string().describe('公司名称'),
  location: z.string().describe('工作地点'),
  salaryRange: z.object({
    min: z.number(),
    max: z.number(),
    currency: z.string(),
  }).describe('薪资范围（如无法提取则填 0）'),
  experience: z.object({
    yearsMin: z.number(),
    yearsMax: z.number(),
    level: z.string().describe('初级/中级/高级/专家'),
  }).describe('经验要求'),
  requiredSkills: z.array(z.string()).describe('必需技能列表'),
  preferredSkills: z.array(z.string()).describe('加分技能列表'),
  responsibilities: z.array(z.string()).describe('核心职责摘要（3-5 条）'),
  industry: z.string().describe('行业类别'),
})

export type ParsedJD = z.infer<typeof parsedJDSchema>

// ==================== Step 2: Skill Matcher Output ====================

export const skillMatchSchema = z.object({
  overallMatchScore: z.number().min(0).max(100).describe('整体匹配度百分比'),
  matchedSkills: z.array(z.string()).describe('完全匹配的技能'),
  partialMatches: z.array(z.object({
    jdSkill: z.string(),
    userSkill: z.string(),
    reason: z.string(),
  })).describe('部分匹配：JD 技能与用户相关技能的对应关系'),
  missingSkills: z.array(z.string()).describe('完全缺失的技能'),
  extraSkills: z.array(z.string()).describe('用户拥有但 JD 未提及的额外技能'),
})

export type SkillMatch = z.infer<typeof skillMatchSchema>

// ==================== Step 3: Competitiveness Analyzer Output ====================

export const competitivenessSchema = z.object({
  competitivenessLevel: z.enum(['strong', 'moderate', 'needs_improvement']).describe('竞争力等级'),
  strengths: z.array(z.object({
    area: z.string(),
    detail: z.string(),
  })).describe('核心优势'),
  gaps: z.array(z.object({
    area: z.string(),
    severity: z.enum(['critical', 'moderate', 'minor']),
    suggestion: z.string(),
  })).describe('差距分析'),
  salaryPositioning: z.object({
    recommendedRange: z.string(),
    justification: z.string(),
  }).describe('薪资定位建议'),
})

export type CompetitivenessAnalysis = z.infer<typeof competitivenessSchema>

// ==================== Step 4: Strategy Generator Output ====================

export const strategySchema = z.object({
  resumeOptimization: z.array(z.object({
    action: z.string(),
    detail: z.string(),
  })).describe('简历优化建议'),
  interviewPrep: z.object({
    technicalQuestions: z.array(z.string()).describe('可能的技术面试问题'),
    behavioralQuestions: z.array(z.string()).describe('可能的行为面试问题'),
    tips: z.array(z.string()).describe('面试技巧'),
  }).describe('面试准备指南'),
  coverLetterPoints: z.array(z.string()).describe('Cover Letter 要点'),
  skillDevelopmentPlan: z.array(z.object({
    skill: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    resource: z.string(),
  })).describe('技能补强计划'),
})

export type Strategy = z.infer<typeof strategySchema>

// ==================== Pipeline State ====================

export type StepStatus = 'pending' | 'running' | 'complete' | 'error' | 'skipped'

export interface StepDebug {
  systemPrompt: string
  userInput: string
  output: string
  durationMs: number
}

export interface PipelineOutputs {
  parsedJD: ParsedJD | null
  skillMatch: SkillMatch | null
  competitiveness: CompetitivenessAnalysis | null
  strategy: Strategy | null
}

// ==================== Step 5: Learning Plan Output (NEW) ====================

export const learningPlanSchema = z.object({
  summary: z.string().describe("综合学习目标概括"),
  phases: z.array(z.object({
    name: z.string().describe("阶段名称，如\"短期（1-4周）\""),
    duration: z.string().describe("预估时长"),
    goals: z.array(z.string()).describe("阶段学习目标"),
    topics: z.array(z.string()).describe("具体学习主题"),
    resources: z.array(z.object({
      title: z.string(),
      url: z.string().optional(),
      type: z.enum(["book", "course", "doc", "project"]),
    })).describe("推荐学习资源"),
    estimatedHours: z.number().describe("预计所需小时数"),
  })).describe("分阶段学习计划"),
})

export type LearningPlan = z.infer<typeof learningPlanSchema>

// ==================== Chat Message (NEW) ====================

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
})

// ==================== Career Strategy (NEW — from historical JDs) ====================

export const careerStrategySchema = z.object({
  /** 岗位取舍标准：按优先级排序 (薪资>成长>稳定>通勤>氛围) */
  jobSelectionCriteria: z.object({
    priorities: z.array(z.object({
      factor: z.enum(["salary", "growth", "stability", "commute", "atmosphere"]),
      label: z.string(),
      weight: z.number().min(1).max(10),
      rationale: z.string(),
    })).describe("取舍优先级列表"),
    summary: z.string().describe("综合取舍建议"),
  }).describe("岗位取舍标准"),

  /** 投递分层策略：冲刺岗/匹配岗/保底岗 */
  applicationTiers: z.object({
    reach: z.array(z.object({
      jobTitle: z.string(),
      companyType: z.string(),
      salaryRange: z.string(),
      gapDescription: z.string(),
      howToCloseGap: z.string(),
    })).describe("冲刺岗：高于当前能力水平的岗位"),
    match: z.array(z.object({
      jobTitle: z.string(),
      companyType: z.string(),
      salaryRange: z.string(),
      fitReason: z.string(),
      highlightPoints: z.array(z.string()),
    })).describe("匹配岗：能力完全适配的岗位"),
    safety: z.array(z.object({
      jobTitle: z.string(),
      companyType: z.string(),
      salaryRange: z.string(),
      advantage: z.string(),
    })).describe("保底岗：稳拿offer的岗位"),
    summary: z.string().describe("投递分层总结"),
  }).describe("投递分层策略"),

  /** 垂直赛道锁定：选定 1-2 个深耕行业 */
  verticalTracks: z.array(z.object({
    industry: z.string(),
    reason: z.string(),
    targetCompanies: z.array(z.string()),
    resumePositioning: z.string(),
    keySkillsToHighlight: z.array(z.string()),
  })).describe("垂直赛道锁定：1-2个深耕行业及简历定向包装"),

  /** 3年成长规划 */
  growthPlan: z.object({
    year1: z.object({
      theme: z.string(),
      goals: z.array(z.string()),
      targetProjects: z.array(z.string()),
      skillsToBuild: z.array(z.string()),
    }).describe("第1年"),
    year2: z.object({
      theme: z.string(),
      goals: z.array(z.string()),
      targetProjects: z.array(z.string()),
      skillsToBuild: z.array(z.string()),
    }).describe("第2年"),
    year3: z.object({
      theme: z.string(),
      goals: z.array(z.string()),
      targetProjects: z.array(z.string()),
      skillsToBuild: z.array(z.string()),
    }).describe("第3年"),
    nextJumpPreparation: z.string().describe("为下一次跳槽的准备工作"),
  }).describe("3年成长规划"),

  /** 综合建议 */
  overallAdvice: z.string().describe("综合求职建议总结"),
  riskWarnings: z.array(z.string()).describe("风险提示和注意事项"),
})

export type CareerStrategy = z.infer<typeof careerStrategySchema>
