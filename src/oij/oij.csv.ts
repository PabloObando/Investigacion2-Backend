// The official CSV has no header. Its location fields are the final three columns.
export function parse(csv: string, year: number) {
  const records: Array<{
    id: number;
    crime: string;
    subcrime: string;
    date: string;
    victim: string;
    province: string;
    canton: string;
    district: string;
  }> = [];
  let fields: string[] = [];
  let field = '';
  let quoted = false;

  function endRow() {
    fields.push(field.trim());
    const [crime, subcrime, date, victim] = fields;
    const [province, canton, district] = fields.slice(-3);
    if (
      fields.length === 11 &&
      crime &&
      /^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(date) &&
      date.startsWith(`${year}-`)
    ) {
      records.push({
        id: records.length + 1,
        crime,
        subcrime,
        date,
        victim,
        province,
        canton,
        district,
      });
    }
    fields = [];
    field = '';
  }

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (char === '"') {
      if (quoted && csv[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      fields.push(field.trim());
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      endRow();
      if (char === '\r' && csv[i + 1] === '\n') i++;
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error('El CSV contiene un campo sin cerrar.');
  if (field || fields.length) endRow();
  return records.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}
