export const DEMOS = [
  {
    id: 'trivial-comms-check',
    label: 'Trivial 2-agent check',
    description: 'Two agents exchange a direct message each way — the minimal comms smoke test.',
    file: '/demo-data/1-trivial-comms-check.csv',
  },
  {
    id: 'job-search-happy',
    label: 'Job search team (happy path)',
    description: 'Orchestrator, researcher, and todo-agent complete a job-search cycle successfully.',
    file: '/demo-data/2-job-search-team-happy.csv',
  },
  {
    id: 'job-search-sad',
    label: 'Job search team (sad path)',
    description: 'Same team, but researcher saves .txt files while todo-agent only looks for .md — the todo list silently comes up empty.',
    file: '/demo-data/3-job-search-team-sad.csv',
  },
];

export function getDemoById(id) {
  return DEMOS.find((d) => d.id === id);
}
