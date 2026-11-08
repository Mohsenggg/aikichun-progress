import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CheckDefinition, CheckDefinitionRequest } from '../models/roadmap.models';
import { RoadmapService } from './roadmap.service';

@Injectable({ providedIn: 'root' })
export class CheckDefinitionService {
  private http = inject(HttpClient);
  private roadmapService = inject(RoadmapService);
  private base = environment.apiUrl + '/coach/check-definitions';

  /** Reactive cache of all check definitions */
  checkDefinitions = signal<CheckDefinition[]>([]);
  isLoading = signal(false);

  loadAll(): void {
    this.isLoading.set(true);
    this.http.get<CheckDefinition[]>(this.base).pipe(
      catchError(err => {
        this.roadmapService.setError(err);
        return throwError(() => err);
      })
    ).subscribe({
      next: (list) => {
        this.checkDefinitions.set(list);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  create(req: CheckDefinitionRequest): Observable<CheckDefinition> {
    return this.http.post<CheckDefinition>(this.base, req).pipe(
      tap(created => this.checkDefinitions.update(list => [...list, created])),
      catchError(err => {
        this.roadmapService.setError(err);
        return throwError(() => err);
      })
    );
  }

  update(id: number, req: CheckDefinitionRequest): Observable<CheckDefinition> {
    return this.http.put<CheckDefinition>(`${this.base}/${id}`, req).pipe(
      tap(updated => this.checkDefinitions.update(list => list.map(c => c.id === id ? updated : c))),
      catchError(err => {
        this.roadmapService.setError(err);
        return throwError(() => err);
      })
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      tap(() => this.checkDefinitions.update(list => list.filter(c => c.id !== id))),
      catchError(err => {
        this.roadmapService.setError(err);
        return throwError(() => err);
      })
    );
  }
}
