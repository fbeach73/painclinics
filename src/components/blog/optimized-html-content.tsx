"use client";

import Image from "next/image";
import parse, {
  domToReact,
  HTMLReactParserOptions,
  Element,
  DOMNode,
} from "html-react-parser";

interface OptimizedHtmlContentProps {
  html: string;
  className?: string;
}

/**
 * Fix common HTML malformations from WordPress imports
 */
function sanitizeHtml(html: string): string {
  return html
    // Fix missing space between tag name and attributes (e.g., <divclass=" -> <div class=")
    .replace(/<(\w+)(class|style|id|href|src|alt|width|height)=/gi, '<$1 $2=')
    // Fix self-closing tags that might cause issues
    .replace(/<(img|br|hr|input)([^>]*[^/])>/gi, '<$1$2 />');
}

/**
 * Renders HTML content with optimized images using Next.js Image component.
 * This replaces regular <img> tags with Next.js <Image> for better performance.
 */
export function OptimizedHtmlContent({
  html,
  className,
}: OptimizedHtmlContentProps) {
  const sanitizedHtml = sanitizeHtml(html);
  const options: HTMLReactParserOptions = {
    replace: (domNode) => {
      // Check if this is an img element
      if (!(domNode instanceof Element)) {
        return;
      }

      if (domNode.name === "img") {
        const { src, alt, width, height, class: imgClass } = domNode.attribs;

        // Skip if no src
        if (!src) return;

        // Parse dimensions or use defaults
        const imgWidth = width ? parseInt(width, 10) : 800;
        const imgHeight = height ? parseInt(height, 10) : 450;

        // Calculate aspect ratio for responsive sizing
        const aspectRatio = imgWidth / imgHeight;

        return (
          <span className="block relative my-4">
            <Image
              src={src}
              alt={alt || "Blog image"}
              width={imgWidth}
              height={imgHeight}
              className={`rounded-lg w-full h-auto ${imgClass || ""}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 800px, 800px"
              style={{ aspectRatio: aspectRatio }}
              loading="lazy"
            />
          </span>
        );
      }

      // Check if this is a figure with an img inside (WordPress pattern)
      if (domNode.name === "figure") {
        const imgChild = domNode.children.find(
          (child): child is Element =>
            child instanceof Element && child.name === "img"
        );

        if (imgChild) {
          const { src, alt, width, height } = imgChild.attribs;
          const figcaptionChild = domNode.children.find(
            (child): child is Element =>
              child instanceof Element && child.name === "figcaption"
          );

          if (!src) return;

          const imgWidth = width ? parseInt(width, 10) : 800;
          const imgHeight = height ? parseInt(height, 10) : 450;
          const aspectRatio = imgWidth / imgHeight;

          return (
            <figure className="my-6">
              <span className="block relative">
                <Image
                  src={src}
                  alt={alt || "Blog image"}
                  width={imgWidth}
                  height={imgHeight}
                  className="rounded-lg w-full h-auto"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 800px, 800px"
                  style={{ aspectRatio: aspectRatio }}
                  loading="lazy"
                />
              </span>
              {figcaptionChild && (
                <figcaption className="text-center text-sm text-muted-foreground mt-2">
                  {domToReact(figcaptionChild.children as DOMNode[], options)}
                </figcaption>
              )}
            </figure>
          );
        }
      }

      // Return undefined to keep the original node unchanged
      return undefined;
    },
  };

  return <div className={className}>{parse(sanitizedHtml, options)}</div>;
}
