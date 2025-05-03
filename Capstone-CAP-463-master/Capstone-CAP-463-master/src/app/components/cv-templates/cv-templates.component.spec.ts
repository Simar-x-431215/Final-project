import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CvTemplatesComponent } from './cv-templates.component';

describe('CvTemplatesComponent', () => {
  let component: CvTemplatesComponent;
  let fixture: ComponentFixture<CvTemplatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CvTemplatesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CvTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
