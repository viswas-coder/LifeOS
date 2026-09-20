export interface SkillSubcategory {
  id: string;
  name: string;
  suggestedPrompt: string;
}

export interface SkillCategoryGroup {
  id: string;
  name: string;
  subcategories: SkillSubcategory[];
}

export interface SkillLevelOption {
  id: string;
  label: string;
}

export const SKILL_LEVELS: SkillLevelOption[] = [
  { id: 'beginner', label: 'Beginner (Ground Zero / Newbie)' },
  { id: 'novice', label: 'Novice (Basic Foundations)' },
  { id: 'intermediate', label: 'Intermediate (Working Knowledge)' },
  { id: 'advanced', label: 'Advanced (Production Experience)' },
  { id: 'expert', label: 'Expert (Mastery / Architecture)' },
];

export const SKILL_CATEGORIES: SkillCategoryGroup[] = [
  {
    id: 'software-engineering',
    name: 'Software Engineering & Architecture',
    subcategories: [
      {
        id: 'distributed-systems',
        name: 'Distributed Systems',
        suggestedPrompt: 'Master consensus algorithms (Raft/Paxos), fault tolerance, and scalable backend event pipelines.',
      },
      {
        id: 'full-stack-web',
        name: 'Full Stack & Modern Web',
        suggestedPrompt: 'Master TypeScript, React concurrency, backend microservices, and reactive data architectures.',
      },
      {
        id: 'systems-programming',
        name: 'Systems Programming (Rust / C++)',
        suggestedPrompt: 'Master memory safety, low-level concurrency, SIMD, and kernel performance optimization.',
      },
      {
        id: 'cloud-devops',
        name: 'Cloud & Infrastructure (K8s, Docker, CI/CD)',
        suggestedPrompt: 'Architect container orchestration, infrastructure as code, and zero-downtime deployment pipelines.',
      },
    ],
  },
  {
    id: 'ai-machine-learning',
    name: 'AI, ML & Data Science',
    subcategories: [
      {
        id: 'deep-learning',
        name: 'Deep Learning & LLM Engineering',
        suggestedPrompt: 'Build transformer architectures, RAG workflows, fine-tuning pipelines, and agentic workflows.',
      },
      {
        id: 'data-engineering',
        name: 'Data Engineering & Analytics',
        suggestedPrompt: 'Architect real-time streaming pipelines, data lakes, OLAP warehousing, and dbt models.',
      },
      {
        id: 'computer-vision',
        name: 'Computer Vision & Multimodal AI',
        suggestedPrompt: 'Train diffusion models, real-time object tracking, and embedded edge vision networks.',
      },
    ],
  },
  {
    id: 'computer-science-core',
    name: 'Computer Science Fundamentals',
    subcategories: [
      {
        id: 'algorithms-data-structures',
        name: 'Algorithms & Data Structures',
        suggestedPrompt: 'Master graph algorithms, dynamic programming, tree traversals, and amortized complexity analysis.',
      },
      {
        id: 'database-internals',
        name: 'Database Engines & Internals',
        suggestedPrompt: 'Implement B-Trees, write-ahead logs, transaction isolation, and query planner optimization.',
      },
      {
        id: 'networking-security',
        name: 'Networking & Cybersecurity',
        suggestedPrompt: 'Master TCP/IP protocols, TLS handshake internals, web security vulnerabilities, and cryptography.',
      },
    ],
  },
  {
    id: 'product-design',
    name: 'Product, UI/UX & Design',
    subcategories: [
      {
        id: 'ui-ux-design',
        name: 'UI/UX & Design Systems',
        suggestedPrompt: 'Design high-contrast accessible user experiences, typographic scales, and micro-interactions in Figma.',
      },
      {
        id: 'product-management',
        name: 'Product Strategy & Execution',
        suggestedPrompt: 'Master customer discovery, quantitative metrics, roadmapping, and agile delivery frameworks.',
      },
    ],
  },
  {
    id: 'mathematics-logic',
    name: 'Mathematics & Quantitative Reasoning',
    subcategories: [
      {
        id: 'discrete-math',
        name: 'Discrete Mathematics & Proofs',
        suggestedPrompt: 'Master graph theory, combinatorics, set theory, and formal logical deduction.',
      },
      {
        id: 'linear-algebra-calculus',
        name: 'Linear Algebra & Calculus',
        suggestedPrompt: 'Master matrix transformations, eigenvalues, multivariable gradients, and vector spaces.',
      },
    ],
  },
];
