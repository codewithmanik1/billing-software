import { useEffect } from 'react';
import type { RefObject } from 'react';

export const useEnterKeyNavigation = (
  containerRef: RefObject<HTMLElement | null>,
  onSubmit?: () => void
) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;
        
        // Only process if the target has a data-field-order
        const currentOrderAttr = target.getAttribute('data-field-order');
        if (!currentOrderAttr) return;

        const currentOrder = parseInt(currentOrderAttr, 10);
        
        // If it's a textarea, prevent default (newline) to act like a tab
        if (target.tagName.toLowerCase() === 'textarea') {
          e.preventDefault();
        }

        // Find all focusable elements with data-field-order in the container
        const elements = Array.from(
          container.querySelectorAll('[data-field-order]')
        ) as HTMLElement[];

        // Filter out disabled or hidden elements
        const focusableElements = elements.filter((el) => {
          if (el.hasAttribute('disabled')) return false;
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          return true;
        });

        // Find the element with the next highest data-field-order
        let nextElement: HTMLElement | null = null;
        let minGreaterOrder = Infinity;

        // Also figure out the maximum valid order to know when to submit
        let maxOrder = -1;

        focusableElements.forEach((el) => {
          const orderAttr = el.getAttribute('data-field-order');
          if (orderAttr) {
            const order = parseInt(orderAttr, 10);
            if (order > maxOrder) {
              maxOrder = order;
            }
            if (order > currentOrder && order < minGreaterOrder) {
              minGreaterOrder = order;
              nextElement = el;
            }
          }
        });

        if (nextElement) {
          e.preventDefault(); // Prevent default submission or other Enter behaviors
          (nextElement as HTMLElement).focus();
        } else if (currentOrder === maxOrder && onSubmit) {
          e.preventDefault();
          onSubmit();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, onSubmit]);
};
