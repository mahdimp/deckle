import { Component, computed, effect, HostListener, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmKbd } from '@spartan-ng/helm/kbd';
import { HlmProgress, HlmProgressIndicator } from '@spartan-ng/helm/progress';
import { Rating, type Grade } from 'ts-fsrs';
import type { Card } from '../../core/models/card.model';
import { formatInterval } from '../../core/utils/format-interval';
import { renderCloze } from '../../core/utils/cloze';
import { DeckService } from '../../core/services/deck.service';
import { ProjectService } from '../../core/services/project.service';
import { ReviewService } from '../../core/services/review.service';
import { FsrsService } from '../../core/services/fsrs.service';
import { CardPreview } from '../../shared/components/card-preview';

const SWIPE_THRESHOLD_PX = 60;

interface GradeOption {
  rating: Grade;
  label: string;
  intervalLabel: string;
  classes: string;
}

@Component({
  selector: 'app-review-session',
  imports: [
    RouterLink,
    HlmButton,
    HlmKbd,
    HlmProgress,
    HlmProgressIndicator,
    ...HlmCardImports,
    ...HlmEmptyImports,
    CardPreview,
  ],
  template: `
    <div class="mx-auto flex max-w-xl flex-col gap-4 p-4 md:p-8">
      @if (loading()) {
        <p class="text-sm text-muted-foreground">Loading…</p>
      } @else if (queue().length === 0) {
        <div hlmEmpty>
          <div hlmEmptyHeader>
            <div hlmEmptyMedia variant="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="size-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div hlmEmptyTitle>Nothing due right now</div>
            <div hlmEmptyDescription>Nice work — check back later.</div>
          </div>
          <a hlmBtn variant="outline" routerLink="/">Back to dashboard</a>
        </div>
      } @else if (currentIndex() >= queue().length) {
        <div hlmEmpty>
          <div hlmEmptyHeader>
            <div hlmEmptyMedia variant="icon" class="bg-success/10 text-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div hlmEmptyTitle>Session complete</div>
            <div hlmEmptyDescription>
              You reviewed {{ queue().length }} card{{ queue().length === 1 ? '' : 's' }}.
            </div>
          </div>
          <a hlmBtn routerLink="/">Back to dashboard</a>
        </div>
      } @else {
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-sm text-muted-foreground">
            <span class="font-medium text-foreground">{{ scopeLabel() }}</span>
            <span>{{ currentIndex() + 1 }} / {{ queue().length }}</span>
          </div>
          <div hlmProgress [value]="currentIndex()" [max]="queue().length">
            <div hlmProgressIndicator></div>
          </div>
        </div>

        <div
          hlmCard
          class="min-h-64 select-none space-y-4 p-6"
          (click)="onCardClick()"
          (touchstart)="onTouchStart($event)"
          (touchend)="onTouchEnd($event)"
        >
          @if (currentCard()?.type === 'cloze') {
            @if (revealed()) {
              <div class="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">
                <app-card-preview [markdown]="clozeAnswer()" />
              </div>
            } @else {
              <app-card-preview [markdown]="clozeQuestion()" />
            }
          } @else {
            <app-card-preview [markdown]="currentCard()?.front ?? ''" />
            @if (revealed()) {
              <div
                class="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-200 space-y-4 border-t border-border pt-4"
              >
                <app-card-preview [markdown]="currentCard()?.back ?? ''" />
              </div>
            }
          }
        </div>

        @if (!revealed()) {
          <button hlmBtn size="lg" (click)="reveal()">
            Show answer <span class="ml-2 hidden md:inline"><kbd hlmKbd>Space</kbd></span>
          </button>
        } @else {
          <div class="grid grid-cols-4 gap-2">
            @for (g of gradePreviews(); track g.rating) {
              <button hlmBtn class="flex flex-col gap-0.5 py-2 {{ g.classes }}" (click)="grade(g.rating)">
                <span>{{ g.label }}</span>
                <span class="text-xs opacity-70">{{ g.intervalLabel }}</span>
              </button>
            }
          </div>
          <p class="hidden text-center text-xs text-muted-foreground md:block">
            Keys <kbd hlmKbd>1</kbd>-<kbd hlmKbd>4</kbd> to grade · swipe on mobile
          </p>
        }
      }
    </div>
  `,
})
export class ReviewSession {
  private readonly reviewService = inject(ReviewService);
  private readonly fsrs = inject(FsrsService);
  private readonly projectService = inject(ProjectService);
  private readonly deckService = inject(DeckService);

  readonly projectId = input<string | undefined>(undefined);
  readonly deckId = input<string | undefined>(undefined);

  protected readonly loading = signal(true);
  protected readonly queue = signal<Card[]>([]);
  protected readonly currentIndex = signal(0);
  protected readonly revealed = signal(false);

  private touchStartX = 0;
  private touchStartY = 0;

  protected readonly currentCard = computed<Card | undefined>(
    () => this.queue()[this.currentIndex()],
  );

  protected readonly scopeLabel = computed(() => {
    const deckId = this.deckId();
    const projectId = this.projectId();
    if (deckId) {
      return this.deckService.decks()?.find((d) => d.id === deckId)?.name ?? 'Deck';
    }
    if (projectId) {
      return this.projectService.projects()?.find((p) => p.id === projectId)?.name ?? 'Project';
    }
    return 'All due cards';
  });

  protected readonly clozeQuestion = computed(() => {
    const card = this.currentCard();
    if (!card || card.type !== 'cloze') return '';
    return renderCloze(card.text ?? '', card.clozeIndex ?? 1, false);
  });

  protected readonly clozeAnswer = computed(() => {
    const card = this.currentCard();
    if (!card || card.type !== 'cloze') return '';
    return renderCloze(card.text ?? '', card.clozeIndex ?? 1, true);
  });

  private static readonly GRADE_STYLES: Record<Grade, string> = {
    [Rating.Again]: '!bg-destructive/10 !text-destructive hover:!bg-destructive/20',
    [Rating.Hard]: '!bg-amber-500/10 !text-amber-700 hover:!bg-amber-500/20 dark:!text-amber-400',
    [Rating.Good]: '',
    [Rating.Easy]: '!bg-success/10 !text-success hover:!bg-success/20',
  };

  protected readonly gradePreviews = computed<GradeOption[]>(() => {
    const card = this.currentCard();
    if (!card || !this.revealed()) return [];
    return this.fsrs.previewGrades(card).map((p) => ({
      rating: p.rating,
      label: this.labelFor(p.rating),
      intervalLabel: formatInterval(p.due),
      classes: ReviewSession.GRADE_STYLES[p.rating],
    }));
  });

  constructor() {
    // Reactive to the (query-param-bound) scope inputs, so switching projects/decks
    // without the component being recreated still reloads the right queue.
    effect(() => {
      const projectId = this.projectId();
      const deckId = this.deckId();
      this.loadQueue(projectId, deckId);
    });
  }

  private async loadQueue(projectId: string | undefined, deckId: string | undefined): Promise<void> {
    this.loading.set(true);
    const cards = await this.reviewService.buildQueue({ projectId, deckId });
    this.queue.set(cards);
    this.currentIndex.set(0);
    this.revealed.set(false);
    this.loading.set(false);
  }

  onCardClick(): void {
    if (!this.revealed()) this.reveal();
  }

  reveal(): void {
    this.revealed.set(true);
  }

  async grade(rating: Grade): Promise<void> {
    const card = this.currentCard();
    if (!card) return;
    const index = this.currentIndex();
    const { undo } = await this.reviewService.gradeCard(card, rating);

    this.currentIndex.update((i) => i + 1);
    this.revealed.set(false);

    toast(`Graded "${this.labelFor(rating)}"`, {
      action: {
        label: 'Undo',
        onClick: async () => {
          await undo();
          this.currentIndex.set(index);
          this.revealed.set(true);
        },
      },
    });
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  onTouchEnd(event: TouchEvent): void {
    if (!this.revealed()) return;
    const dx = event.changedTouches[0].clientX - this.touchStartX;
    const dy = event.changedTouches[0].clientY - this.touchStartY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD_PX) return;

    const rating: Grade =
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? Rating.Good
          : Rating.Again
        : dy > 0
          ? Rating.Hard
          : Rating.Easy;
    this.grade(rating);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.currentCard() || this.currentIndex() >= this.queue().length) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (!this.revealed()) this.reveal();
      return;
    }
    if (!this.revealed()) return;
    const map: Record<string, Grade> = {
      '1': Rating.Again,
      '2': Rating.Hard,
      '3': Rating.Good,
      '4': Rating.Easy,
    };
    if (map[event.key]) this.grade(map[event.key]);
  }

  protected labelFor(rating: Grade): string {
    return { [Rating.Again]: 'Again', [Rating.Hard]: 'Hard', [Rating.Good]: 'Good', [Rating.Easy]: 'Easy' }[
      rating
    ];
  }
}
