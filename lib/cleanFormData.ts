export function cleanFormData(formData: Record<string, any>) {
  const cleaned: Record<string, any> = {};

  Object.entries(formData).forEach(([key, val]) => {
    // Obsługa checkboxów z nazwą w formacie np. "narowy_0"
    if (val === true && key.includes('_')) {
      const [base, num] = key.split('_');
      if (!isNaN(Number(num))) {
        if (!cleaned[base]) cleaned[base] = [];
        cleaned[base].push(Number(num));
      }
      return;
    }

    // Obsługa pól tekstowych (np. narowy_inne_text)
    if (typeof val === 'string' && val.trim() !== '') {
      cleaned[key] = val.trim();
      return;
    }
  });

  return cleaned;
}
