const DATA_URL = 'data/projects.json';

export async function loadProjects() {
  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`Failed to load projects: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
