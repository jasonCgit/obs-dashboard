// Default prompts (shown on Home / unknown pages)
const DEFAULT_PROMPTS = [
  {
    category: 'General Insights',
    prompts: [
      {
        icon: 'ErrorOutline',
        title: 'Incident Analysis',
        description: 'What are the current active incidents and their impact?',
        prompt: 'What are the current active incidents and their impact?',
      },
      {
        icon: 'Assessment',
        title: 'Executive Summary',
        description: 'Give me an executive summary of platform health',
        prompt: 'Give me an executive summary of platform health',
      },
    ],
  },
  {
    category: 'Performance & Trends',
    prompts: [
      {
        icon: 'AccountTree',
        title: 'Blast Radius',
        description: 'What is the blast radius if the Payment Gateway goes down?',
        prompt: 'What is the blast radius if the Payment Gateway goes down?',
      },
      {
        icon: 'TrendingUp',
        title: 'Trend Forecast',
        description: 'What is the incident forecast for next week?',
        prompt: 'What is the incident forecast for next week?',
      },
    ],
  },
]

// Page-specific prompts keyed by route path
const PAGE_PROMPTS = {
  '/graph': [
    {
      category: 'Blast Radius',
      prompts: [
        {
          icon: 'AccountTree',
          title: 'Dependency Impact',
          description: 'What is the blast radius if the Payment Gateway goes down?',
          prompt: 'What is the blast radius if the Payment Gateway goes down?',
        },
        {
          icon: 'ErrorOutline',
          title: 'Cascade Failures',
          description: 'Which services would cascade if the Auth Service fails?',
          prompt: 'Which services would cascade if the Auth Service fails?',
        },
      ],
    },
  ],
  '/applications': [
    {
      category: 'Application Health',
      prompts: [
        {
          icon: 'Speed',
          title: 'SLO Compliance',
          description: 'Show me the SLO compliance report for all services',
          prompt: 'Show me the SLO compliance report for all services',
        },
        {
          icon: 'Notifications',
          title: 'Alert Noise',
          description: 'Which applications have the highest false positive alert rates?',
          prompt: 'Analyze alert noise and false positive rates across all services',
        },
      ],
    },
  ],
  '/incident-zero': [
    {
      category: 'Proactive Insights',
      prompts: [
        {
          icon: 'TrendingUp',
          title: 'Trend Forecast',
          description: 'What is the incident forecast for next week?',
          prompt: 'What is the incident forecast for next week?',
        },
        {
          icon: 'ErrorOutline',
          title: 'Risk Signals',
          description: 'Are there any early warning signals of potential incidents?',
          prompt: 'Are there any early warning signals or risk patterns that could lead to incidents?',
        },
      ],
    },
  ],
  '/slo-agent': [
    {
      category: 'SLO Management',
      prompts: [
        {
          icon: 'Speed',
          title: 'SLO Report',
          description: 'Show me the SLO compliance report for all services',
          prompt: 'Show me the SLO compliance report for all services',
        },
        {
          icon: 'Timer',
          title: 'MTTR Trends',
          description: 'Show me the MTTR and MTTA trends for the last quarter',
          prompt: 'Show me the MTTR and MTTA trends for the last quarter',
        },
      ],
    },
  ],
  '/view-central': [
    {
      category: 'Dashboard Insights',
      prompts: [
        {
          icon: 'Assessment',
          title: 'Executive Summary',
          description: 'Give me an executive summary of platform health',
          prompt: 'Give me an executive summary of platform health',
        },
        {
          icon: 'Public',
          title: 'Regional Comparison',
          description: 'Compare regional operational health across NA, EMEA, and APAC',
          prompt: 'Compare regional operational health across NA, EMEA, and APAC',
        },
      ],
    },
  ],
  '/customer-journey': [
    {
      category: 'Customer Experience',
      prompts: [
        {
          icon: 'ErrorOutline',
          title: 'Journey Impact',
          description: 'Which incidents are impacting customer journeys right now?',
          prompt: 'What are the current active incidents and their impact on customer journeys?',
        },
        {
          icon: 'Public',
          title: 'Regional Health',
          description: 'Compare regional operational health across NA, EMEA, and APAC',
          prompt: 'Compare regional operational health across NA, EMEA, and APAC',
        },
      ],
    },
  ],
}

export function getPromptsForPage(pathname) {
  // Check exact match first, then prefix match for nested routes like /view-central/:id
  if (PAGE_PROMPTS[pathname]) return PAGE_PROMPTS[pathname]
  const prefix = Object.keys(PAGE_PROMPTS).find(key => pathname.startsWith(key + '/'))
  if (prefix) return PAGE_PROMPTS[prefix]
  return DEFAULT_PROMPTS
}

export const PROMPT_CATEGORIES = DEFAULT_PROMPTS

// Flat list for backward compatibility
export const SUGGESTED_PROMPTS = DEFAULT_PROMPTS.flatMap(c => c.prompts)
