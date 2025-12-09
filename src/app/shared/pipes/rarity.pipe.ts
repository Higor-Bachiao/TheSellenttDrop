import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'rarity',
  standalone: true
})
export class RarityPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
