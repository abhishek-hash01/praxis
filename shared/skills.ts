export const PREDEFINED_SKILLS = [
  // Programming Languages
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "Dart", "Scala", "R", "MATLAB", "SQL",
  
  // Frontend Technologies
  "React", "Vue.js", "Angular", "Svelte", "Next.js", "Nuxt.js", "HTML", "CSS", "Sass", "Less", "Tailwind CSS", "Bootstrap", "Material-UI", "Chakra UI",
  
  // Backend Technologies
  "Node.js", "Express.js", "Django", "Flask", "FastAPI", "Spring Boot", "ASP.NET", "Laravel", "Ruby on Rails", "GraphQL", "REST APIs", "Microservices",
  
  // Databases
  "MongoDB", "PostgreSQL", "MySQL", "SQLite", "Redis", "Elasticsearch", "Firebase", "Supabase", "DynamoDB", "Cassandra",
  
  // Cloud & DevOps
  "AWS", "Google Cloud", "Azure", "Docker", "Kubernetes", "Jenkins", "GitHub Actions", "GitLab CI", "Terraform", "Ansible", "Linux", "Nginx",
  
  // Mobile Development
  "React Native", "Flutter", "iOS Development", "Android Development", "Xamarin", "Ionic", "Cordova",
  
  // Data Science & AI
  "Machine Learning", "Deep Learning", "Data Analysis", "Data Visualization", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-learn", "Jupyter", "Tableau", "Power BI",
  
  // Design
  "UI/UX Design", "Figma", "Adobe Photoshop", "Adobe Illustrator", "Sketch", "InVision", "Prototyping", "User Research", "Wireframing", "Design Systems",
  
  // Game Development
  "Unity", "Unreal Engine", "Godot", "Game Design", "3D Modeling", "Blender", "Maya", "C# for Games", "Lua",
  
  // Web3 & Blockchain
  "Blockchain", "Solidity", "Web3.js", "Ethereum", "Smart Contracts", "DeFi", "NFTs", "Cryptocurrency",
  
  // Testing
  "Unit Testing", "Integration Testing", "Jest", "Cypress", "Selenium", "Test-Driven Development", "Quality Assurance",
  
  // Project Management
  "Agile", "Scrum", "Kanban", "Project Management", "Product Management", "Leadership", "Team Management",
  
  // Marketing & Business
  "Digital Marketing", "SEO", "Content Marketing", "Social Media Marketing", "Email Marketing", "Analytics", "Business Strategy", "Sales",
  
  // Other Technical Skills
  "Git", "GitHub", "Version Control", "API Development", "Cybersecurity", "Network Administration", "System Administration", "Technical Writing"
];

export function searchSkills(query: string): string[] {
  if (!query.trim()) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return PREDEFINED_SKILLS.filter(skill => 
    skill.toLowerCase().includes(normalizedQuery)
  ).slice(0, 10); // Limit to 10 suggestions
}

export function getSkillSuggestions(currentSkills: string[]): string[] {
  // Return skills not already selected
  return PREDEFINED_SKILLS.filter(skill => 
    !currentSkills.includes(skill)
  ).slice(0, 20);
}
