import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'projects',
    loadComponent: () => import('./features/projects/project-list').then((m) => m.ProjectList),
  },
  {
    path: 'projects/:projectId',
    loadComponent: () =>
      import('./features/projects/project-detail').then((m) => m.ProjectDetail),
  },
  {
    path: 'projects/:projectId/decks/:deckId',
    loadComponent: () => import('./features/decks/deck-detail').then((m) => m.DeckDetail),
  },
  {
    path: 'projects/:projectId/decks/:deckId/new',
    loadComponent: () => import('./features/cards/card-editor').then((m) => m.CardEditor),
  },
  {
    path: 'projects/:projectId/decks/:deckId/notes/:noteId',
    loadComponent: () => import('./features/cards/card-editor').then((m) => m.CardEditor),
  },
  {
    path: 'review',
    loadComponent: () => import('./features/review/review-session').then((m) => m.ReviewSession),
  },
  {
    path: 'stats',
    loadComponent: () => import('./features/stats/stats').then((m) => m.Stats),
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings').then((m) => m.Settings),
  },
];
