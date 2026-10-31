// src/utils/exportDiagram.ts

export interface ExportDiagramOptions {
  isDarkMode?: boolean;
  scale?: number;
  transparent?: boolean;
}

/**
 * Obtiene el nombre formateado para el archivo del diagrama a descargar.
 */
export function getDiagramFileName(baseName: string | undefined, extension: 'svg' | 'png'): string {
  if (!baseName || !baseName.trim()) {
    return `diagrama_automata.${extension}`;
  }

  const cleanBase = baseName.trim().replace(/\.[^/.]+$/, '');
  const sanitized = cleanBase
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const finalName = sanitized || 'diagrama_automata';
  return `${finalName}_diagrama.${extension}`;
}

/**
 * Extrae las dimensiones lógicas de un elemento SVG basándose en viewBox,
 * atributos width/height o dimensiones rectangulares calculadas.
 */
export function getSvgDimensions(svg: {
  getAttribute: (name: string) => string | null;
  getBoundingClientRect?: () => { width: number; height: number };
}): { width: number; height: number } {
  const viewBox = svg.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && !isNaN(parts[2]) && !isNaN(parts[3]) && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] };
    }
  }

  const widthAttr = parseFloat(svg.getAttribute('width') || '');
  const heightAttr = parseFloat(svg.getAttribute('height') || '');
  if (!isNaN(widthAttr) && !isNaN(heightAttr) && widthAttr > 0 && heightAttr > 0) {
    return { width: widthAttr, height: heightAttr };
  }

  if (typeof svg.getBoundingClientRect === 'function') {
    const rect = svg.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return { width: rect.width, height: rect.height };
    }
  }

  return { width: 800, height: 600 };
}

/**
 * Serializa un elemento SVG a cadena de texto XML lista para exportar,
 * incorporando fondo coherente con el tema para garantizar máxima legibilidad.
 */
export function serializeSvgForExport(
  svgElement: SVGSVGElement,
  options: ExportDiagramOptions = {}
): string {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  const isDarkMode = Boolean(options.isDarkMode);
  const isTransparent = Boolean(options.transparent);

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  clone.removeAttribute('style');

  const { width, height } = getSvgDimensions(svgElement);
  clone.setAttribute('width', `${width}px`);
  clone.setAttribute('height', `${height}px`);

  if (!clone.getAttribute('viewBox')) {
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }

  if (!isTransparent && typeof document !== 'undefined') {
    const bgColor = isDarkMode ? '#0f172a' : '#ffffff';
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', '0');
    bgRect.setAttribute('y', '0');
    bgRect.setAttribute('width', '100%');
    bgRect.setAttribute('height', '100%');
    bgRect.setAttribute('fill', bgColor);

    if (clone.firstChild) {
      clone.insertBefore(bgRect, clone.firstChild);
    } else {
      clone.appendChild(bgRect);
    }
  }

  const serializer = typeof XMLSerializer !== 'undefined' ? new XMLSerializer() : null;
  const xmlContent = serializer ? serializer.serializeToString(clone) : clone.outerHTML || '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${xmlContent}`;
}

/**
 * Descarga el diagrama SVG como archivo vectorial independiente.
 */
export function downloadSvgFile(
  svgElement: SVGSVGElement,
  fileName: string = 'diagrama_automata.svg',
  options: ExportDiagramOptions = {}
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const svgContent = serializeSvgForExport(svgElement, options);
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName.endsWith('.svg') ? fileName : `${fileName}.svg`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Convierte el diagrama SVG a mapa de bits PNG en alta definición y lo descarga.
 */
export function downloadPngFile(
  svgElement: SVGSVGElement,
  fileName: string = 'diagrama_automata.png',
  options: ExportDiagramOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('La descarga de PNG solo está disponible en entorno de navegador.'));
      return;
    }

    try {
      const scale = options.scale && options.scale > 0 ? options.scale : 2;
      const isDarkMode = Boolean(options.isDarkMode);
      const isTransparent = Boolean(options.transparent);

      const { width, height } = getSvgDimensions(svgElement);
      const svgContent = serializeSvgForExport(svgElement, options);
      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const image = new Image();

      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width * scale);
          canvas.height = Math.round(height * scale);

          const context = canvas.getContext('2d');
          if (!context) {
            URL.revokeObjectURL(url);
            reject(new Error('No se pudo inicializar el contexto de dibujo 2D en el lienzo.'));
            return;
          }

          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';

          if (!isTransparent) {
            context.fillStyle = isDarkMode ? '#0f172a' : '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
          }

          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);

          canvas.toBlob((pngBlob) => {
            if (!pngBlob) {
              reject(new Error('No fue posible generar el mapa de bits PNG.'));
              return;
            }

            const downloadUrl = URL.createObjectURL(pngBlob);
            const anchor = document.createElement('a');
            anchor.href = downloadUrl;
            anchor.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(downloadUrl);
            resolve();
          }, 'image/png');
        } catch (innerError: unknown) {
          URL.revokeObjectURL(url);
          const errorMsg = innerError instanceof Error ? innerError.message : 'Error inesperado al renderizar PNG.';
          reject(new Error(errorMsg));
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('No se pudo procesar el gráfico vectorial para su conversión a imagen.'));
      };

      image.src = url;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Fallo en la preparación del archivo PNG.';
      reject(new Error(errorMsg));
    }
  });
}

