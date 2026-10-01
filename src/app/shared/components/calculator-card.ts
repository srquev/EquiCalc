import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CalculatorDefinition } from '../../core/config/calculators';
import { FavouritesStore } from '../../core/state/favourites';
import { Icon } from './icon';
@Component({ selector: 'eq-calculator-card', imports: [RouterLink, Icon], changeDetection: ChangeDetectionStrategy.OnPush,
 template: `<article class="calculator-card"><div class="card-top"><a class="icon-tile" [routerLink]="calculator().route" [attr.aria-label]="calculator().title"><eq-icon [name]="calculator().icon" /></a><button class="icon-button favourite" [class.selected]="favourites.ids().includes(calculator().id)" [attr.aria-label]="'Favourite ' + calculator().title" [attr.aria-pressed]="favourites.ids().includes(calculator().id)" (click)="favourites.toggle(calculator().id)"><eq-icon name="star" /></button></div><a class="card-link" [routerLink]="calculator().route"><h3>{{ calculator().title }}<eq-icon name="arrow" /></h3><p>{{ calculator().description }}</p></a><span class="category-label">{{ calculator().category }}</span></article>`
})
export class CalculatorCard { readonly calculator = input.required<CalculatorDefinition>(); readonly favourites = inject(FavouritesStore); }
