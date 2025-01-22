import { useEffect } from "react";

import { useState } from "react";

interface LinearRendererProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    placeholder?: React.ReactNode;
    delay?: number; // Delay in ms between rendering items
  }
  
  const LinearRenderer = <T,>({
    items,
    renderItem,
    placeholder = null,
    delay = 1000,
  }: LinearRendererProps<T>) => {
    const [renderedCount, setRenderedCount] = useState(0);
  
    useEffect(() => {
      let timeout: NodeJS.Timeout
  
      if (renderedCount < items.length) {
        timeout = setTimeout(() => setRenderedCount(renderedCount + 1), delay)
      }
  
      return () => clearTimeout(timeout)
    }, [renderedCount, items.length, delay])
  
    return (
      <>
        {items.slice(0, renderedCount).map((item, index) => renderItem(item, index))}
        {renderedCount < items.length && placeholder}
      </>
    )
  }
  

  export default LinearRenderer