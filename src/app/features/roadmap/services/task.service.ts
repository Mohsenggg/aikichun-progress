import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Task, TaskRequest } from '../models/roadmap.models';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private base = environment.apiUrl + '/coach/tasks';

  createTask(req: TaskRequest): Observable<Task> {
    return this.http.post<Task>(this.base, req);
  }

  updateTask(id: number, req: TaskRequest): Observable<Task> {
    return this.http.put<Task>(`${this.base}/${id}`, req);
  }

  listTasks(search?: string, includeInactive = false): Observable<Task[]> {
    let params = new HttpParams().set('includeInactive', includeInactive.toString());
    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }
    return this.http.get<Task[]>(this.base, { params });
  }

  deactivateTask(id: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/deactivate`, {});
  }
}
