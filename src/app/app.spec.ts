import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('EquiCalc application shell', () => {
  it('renders the branded shell and accessible navigation', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('EquiCalc');
    expect(element.querySelector('main#main-content')).toBeTruthy();
    expect(
      element.querySelector('nav[aria-label="Mobile navigation"]'),
    ).toBeTruthy();
    expect(element.textContent).not.toContain('Hello, EquiCalc');
  });
});
