/**
 * Cargador dinámico de plantillas HTML
 */
export async function loadTemplate(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) {
      throw new Error(`Error cargando plantilla ${path}: ${res.statusText}`);
    }
    return await res.text();
  } catch (error) {
    console.error(`Error en loadTemplate(${path}):`, error);
    return null;
  }
}

/**
 * Inyecta el contenido de una plantilla en un contenedor del DOM
 */
export async function renderTemplateInto(path, targetElement) {
  const html = await loadTemplate(path);
  if (html && targetElement) {
    targetElement.innerHTML = html;
  }
  return targetElement;
}
