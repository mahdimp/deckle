import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { LockService } from '../../core/services/lock.service';
import { DueCountService } from '../../core/services/due-count.service';
import { ThemeToggle } from '../components/theme-toggle';

// Routes that already offer their own primary "add/save" action, or where quick-adding a
// card doesn't fit the task (settings/stats) — the FAB is fixed-position, so on short pages
// it can otherwise sit on top of in-flow content instead of just duplicating an action.
const QUICK_ADD_FAB_HIDDEN_PATTERN = /^\/(new$|settings$|stats$|projects\/.+\/decks\/.+\/(new|notes\/))/;

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    path: '/',
    label: 'Dashboard',
    icon: 'M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 11-1.06 1.06l-.97-.97V19.5a2.25 2.25 0 01-2.25 2.25h-3a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75h-3a2.25 2.25 0 01-2.25-2.25v-6.88l-.97.97a.75.75 0 11-1.06-1.06l8.69-8.69z',
  },
  {
    path: '/projects',
    label: 'Projects',
    icon: 'M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z',
  },
  {
    path: '/review',
    label: 'Review',
    icon: 'M4.5 12.75l6 6 9-13.5',
  },
  {
    path: '/stats',
    label: 'Stats',
    icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a7.723 7.723 0 010 .255c-.007.378.138.752.43.992l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a7.65 7.65 0 010-.255c.007-.378-.138-.752-.43-.992l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z',
  },
];

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, HlmBadge, HlmButton, ThemeToggle],
  template: `
    <div class="flex min-h-dvh flex-col bg-background text-foreground md:flex-row">
      <!-- Desktop sidebar -->
      <aside class="hidden w-56 shrink-0 border-r border-border p-4 md:flex md:flex-col">
        <div class="mb-6 flex items-center justify-between">
          <span class="flex items-center gap-2 text-lg font-semibold">
            <svg viewBox="0 0 24 24" fill="none" class="size-6 shrink-0 text-primary">
              <rect x="3" y="5" width="14" height="16" rx="2.5" fill="currentColor" opacity="0.18" />
              <rect x="7" y="2.5" width="14" height="16" rx="2.5" fill="currentColor" />
            </svg>
            Deckle
          </span>
          <app-theme-toggle />
        </div>

        <a
          hlmBtn
          routerLink="/new"
          class="mb-4 justify-start gap-2"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New card
        </a>

        <nav class="flex flex-1 flex-col gap-1">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-muted text-foreground"
              [routerLinkActiveOptions]="{ exact: item.path === '/' }"
              class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="size-5">
                <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.icon" />
              </svg>
              {{ item.label }}
              @if (item.path === '/review' && totalDue() > 0) {
                <span hlmBadge class="ml-auto">{{ totalDue() }}</span>
              }
            </a>
          }
        </nav>
        @if (lockService.isEnabled()) {
          <button hlmBtn variant="ghost" size="sm" (click)="lockService.lockNow()">Lock now</button>
        }
      </aside>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto pb-20 md:pb-0">
        <router-outlet />
      </main>

      <!-- Mobile quick-add FAB (hidden on routes with their own primary action) -->
      @if (!hideFab()) {
        <a
          routerLink="/new"
          aria-label="New card"
          class="fixed right-4 bottom-20 z-20 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 md:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </a>
      }

      <!-- Mobile bottom nav -->
      <nav
        class="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-background/95 backdrop-blur md:hidden"
      >
        @for (item of navItems; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="text-foreground"
            [routerLinkActiveOptions]="{ exact: item.path === '/' }"
            class="relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="size-5">
              <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.icon" />
            </svg>
            {{ item.label }}
            @if (item.path === '/review' && totalDue() > 0) {
              <span class="absolute right-4 top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                {{ totalDue() }}
              </span>
            }
          </a>
        }
      </nav>
    </div>
  `,
})
export class AppShell {
  protected readonly lockService = inject(LockService);
  private readonly dueCountService = inject(DueCountService);
  private readonly router = inject(Router);

  protected readonly navItems = NAV_ITEMS;
  protected readonly totalDue = this.dueCountService.totalDue;

  protected readonly hideFab = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => QUICK_ADD_FAB_HIDDEN_PATTERN.test(e.urlAfterRedirects)),
    ),
    { initialValue: QUICK_ADD_FAB_HIDDEN_PATTERN.test(this.router.url) },
  );
}
