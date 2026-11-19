import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseRecords } from './oij.csv';

const source =
  'https://datosabiertospj.poder-judicial.go.cr/dataset/estadisticas-policiales';
const base =
  'https://pjcrdatosabiertos.blob.core.windows.net/datosabiertos/PJCROD_POLICIALES_V1';
const years = Array.from({ length: 12 }, (_, i) => 2026 - i);
const day = 24 * 60 * 60 * 1000;
const pageSize = 12;

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase();

function getText(value: unknown) {
  if (value === undefined) return '';
  if (typeof value !== 'string' || value.length > 120) {
    throw new BadRequestException('Parámetro de búsqueda inválido.');
  }
  return value.trim();
}

function getInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  if (value === undefined) return fallback;
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const number = Number(value);
    if (number >= min && number <= max) return number;
  }
  throw new BadRequestException('Año, mes o página fuera de rango.');
}

function frequencies(values: string[]) {
  const totals = new Map<string, number>();
  for (const value of values) {
    if (value) totals.set(value, (totals.get(value) ?? 0) + 1);
  }
  return Array.from(totals, ([label, count]) => ({ label, count })).sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'),
  );
}

function options(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'es'),
  );
}

@Injectable()
export class OijService {
  private readonly logger = new Logger(OijService.name);
  private readonly cache = new Map<
    number,
    { expires: number; rows: Awaited<ReturnType<typeof this.load>> }
  >();
  private readonly pending = new Map<number, ReturnType<typeof this.load>>();

  async buscar(query: Record<string, unknown>) {
    const year = getInteger(query.year, 2025, years.at(-1)!, years[0]);
    const page = getInteger(query.page, 1, 1, 1_000_000);
    const month = getInteger(query.month, 0, 0, 12);
    const province = normalize(getText(query.province));
    const crime = normalize(getText(query.crime));
    const keywords = normalize(getText(query.q)).match(/[\p{L}\p{N}]+/gu) ?? [];
    const rows = await this.getRows(year);
    const firstDate = rows.at(-1)!.record.date;
    const lastDate = rows[0].record.date;
    const matchingLocationAndCrime = rows.filter(
      ({ search, provinceKey, crimeKey }) =>
        (!province || province === provinceKey) &&
        (!crime || crime === crimeKey) &&
        keywords.every((word) => search.includes(word)),
    );
    const monthly = Array.from(
      { length: Number(lastDate.slice(5, 7)) },
      (_, i) => ({
        month: i + 1,
        count: 0,
      }),
    );
    for (const { record } of matchingLocationAndCrime) {
      monthly[Number(record.date.slice(5, 7)) - 1].count++;
    }
    const matches = month
      ? matchingLocationAndCrime.filter(
          ({ record }) => month === Number(record.date.slice(5, 7)),
        )
      : matchingLocationAndCrime;

    const crimes = frequencies(matches.map(({ record }) => record.crime));
    const provinces = frequencies(matches.map(({ record }) => record.province));
    const start = (page - 1) * pageSize;
    return {
      year,
      page,
      pageSize,
      firstDate,
      lastDate,
      total: matches.length,
      source,
      filters: {
        years,
        provinces: options(rows.map(({ record }) => record.province)),
        crimes: options(rows.map(({ record }) => record.crime)),
      },
      summary: { monthly, crimes, provinces },
      records: matches
        .slice(start, start + pageSize)
        .map(({ record }) => record),
    };
  }

  private async getRows(year: number) {
    const cached = this.cache.get(year);
    if (cached && cached.expires > Date.now()) return cached.rows;
    const existing = this.pending.get(year);
    if (existing) return existing;

    const request = this.load(year)
      .then((rows) => {
        this.cache.set(year, { rows, expires: Date.now() + day });
        return rows;
      })
      .catch((error: unknown) => {
        this.logger.warn(
          `No se pudieron cargar los datos OIJ de ${year}: ${String(error)}`,
        );
        if (cached) return cached.rows;
        throw new ServiceUnavailableException(
          'No se pudieron cargar los datos del OIJ. Intenta de nuevo.',
        );
      })
      .finally(() => this.pending.delete(year));
    this.pending.set(year, request);
    return request;
  }

  private async load(year: number) {
    const name = `PJCROD_POLICIALES_V1-${year}.csv`;
    let bytes: Uint8Array;
    if (process.env.OIJ_DATA_DIR) {
      bytes = new Uint8Array(
        await readFile(join(process.env.OIJ_DATA_DIR, name)),
      );
    } else {
      const response = await fetch(`${base}/${name}`, {
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      bytes = new Uint8Array(await response.arrayBuffer());
    }

    const utf8 = new TextDecoder().decode(bytes);
    const csv = utf8.includes('\uFFFD')
      ? new TextDecoder('windows-1252').decode(bytes)
      : utf8;
    const records = parseRecords(csv, year);
    if (!records.length)
      throw new Error('El archivo no contiene registros válidos.');
    return records.map((record) => ({
      record,
      search: normalize(
        [
          record.crime,
          record.subcrime,
          record.province,
          record.canton,
          record.district,
        ].join(' '),
      ),
      provinceKey: normalize(record.province),
      crimeKey: normalize(record.crime),
    }));
  }
}
