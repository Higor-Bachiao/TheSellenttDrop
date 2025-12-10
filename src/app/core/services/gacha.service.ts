import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, GachaResult, GachaBox } from '../../../../shared/types';

@Injectable({
  providedIn: 'root'
})
export class GachaService {
  private http = inject(HttpClient);

  // Rolar o gacha
  roll(boxId: string = 'box-inicial'): Observable<ApiResponse<GachaResult>> {
    return this.http.post<ApiResponse<GachaResult>>(
      `${environment.apiUrl}/gacha/roll`,
      { boxId }
    );
  }

  // Listar todas as boxes
  listBoxes(): Observable<ApiResponse<GachaBox[]>> {
    return this.http.get<ApiResponse<GachaBox[]>>(
      `${environment.apiUrl}/gacha/boxes`
    );
  }

  // Buscar box específica
  getBox(boxId: string): Observable<ApiResponse<GachaBox>> {
    return this.http.get<ApiResponse<GachaBox>>(
      `${environment.apiUrl}/gacha/boxes/${boxId}`
    );
  }
}
