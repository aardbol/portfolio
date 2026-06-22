import { initList } from './list.js';

initList({
  dataId: 'projects-data',
  cardSelector: '.project-card',
  listSelector: '.project-list',
  singular: 'project',
  plural: 'projects',
  extraRoutes: { cv: '<p>CV content or redirect...</p>' },
});
