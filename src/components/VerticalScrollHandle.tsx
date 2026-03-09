import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

const VerticalScrollHandle: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const dragY = useMotionValue(0);
  const lastY = useRef(0);

  const handleDrag = (event: any, info: any) => {
    const deltaY = info.delta.y;
    window.scrollBy(0, -deltaY * 5); // Multiply for faster scrolling
  };

  return (
    <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-12 z-[9999] pointer-events-none flex items-center justify-center">
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        onDrag={handleDrag}
        className="w-full h-full opacity-0 pointer-events-auto cursor-ns-resize flex items-center justify-center group"
      >
        <div className="w-1 h-32 bg-transparent" />
      </motion.div>
      
      {isDragging && (
        <div className="fixed inset-0 bg-transparent cursor-ns-resize" />
      )}
    </div>
  );
};

export default VerticalScrollHandle;
