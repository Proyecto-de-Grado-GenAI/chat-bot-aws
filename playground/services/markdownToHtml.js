import { marked } from "marked";

const markdownToHtml = (markdown) => {
  // Configura opciones de marked si es necesario, por ejemplo, para deshabilitar enlaces automáticos:
  marked.setOptions({
    gfm: true,
    breaks: true,
    sanitize: false // Importante: sanitizar el HTML en el componente antes de renderizarlo!
  });

  return marked(markdown);
};

export default markdownToHtml;