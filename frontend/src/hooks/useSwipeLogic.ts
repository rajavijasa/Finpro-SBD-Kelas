import { useState, useEffect, useCallback, useRef } from 'react';
import { recordSwipeAction } from '@/app/actions/auth';

export function useSwipeLogic<T extends { name: string }>(
  currentUser: string,
  initialCandidates: T[],
  onMatch?: (targetName: string) => void
) {
  const [candidates, setCandidates] = useState<T[]>(initialCandidates);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [flyOutDirection, setFlyOutDirection] = useState<'left' | 'right' | 'up' | null>(null);

  useEffect(() => {
    // Only reset if the initial candidates actually change
    setCandidates(initialCandidates);
    setCurrentIndex(0);
    setHistory([]);
    setDragOffset({ x: 0, y: 0 });
    dragOffsetRef.current = { x: 0, y: 0 };
    setFlyOutDirection(null);
  }, [initialCandidates]);

  const swipe = useCallback(async (direction: 'left' | 'right' | 'up') => {
    if (currentIndex >= candidates.length || flyOutDirection) return;

    const candidate = candidates[currentIndex];
    setFlyOutDirection(direction);

    const swipeType = direction === 'left' ? 'nope' : direction === 'right' ? 'like' : 'super';
    const swipePromise = recordSwipeAction(currentUser, candidate.name, swipeType);

    // Wait for the CSS transition (300ms) to complete before updating state
    setTimeout(async () => {
      setHistory(prev => [...prev, currentIndex]);
      setCurrentIndex(prev => prev + 1);
      setDragOffset({ x: 0, y: 0 });
      dragOffsetRef.current = { x: 0, y: 0 };
      setFlyOutDirection(null);

      if (direction === 'right' || direction === 'up') {
        const result = await swipePromise;
        if (result && 'isMatch' in result && result.isMatch) {
          onMatch?.(candidate.name);
        }
      }
    }, 350);
  }, [candidates, currentIndex, currentUser, flyOutDirection, onMatch]);

  const rewind = useCallback(() => {
    if (history.length === 0) return;
    const prevIndices = [...history];
    const prevIndex = prevIndices.pop()!;
    setHistory(prevIndices);
    setCurrentIndex(prevIndex);
  }, [history]);

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    setDragStart({ x: clientX, y: clientY });
    setIsDragging(true);
  }, []);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!dragStart || !isDragging) return;
    const newOffset = {
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    };
    setDragOffset(newOffset);
    dragOffsetRef.current = newOffset;
  }, [dragStart, isDragging]);

  const handleDragEnd = useCallback((threshold = 130) => {
    if (!isDragging) return;
    const { x, y } = dragOffsetRef.current;
    setIsDragging(false);
    setDragStart(null);

    if (x > threshold) swipe('right');
    else if (x < -threshold) swipe('left');
    else if (y < -100 && Math.abs(x) < 80) swipe('up');
    else {
      setDragOffset({ x: 0, y: 0 });
      dragOffsetRef.current = { x: 0, y: 0 };
    }
  }, [isDragging, swipe]);

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
    const onEnd = () => handleDragEnd();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => handleDragEnd();

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  return {
    candidates,
    currentIndex,
    history,
    dragOffset,
    isDragging,
    flyOutDirection,
    swipe,
    rewind,
    handleDragStart,
    isDone: currentIndex >= candidates.length
  };
}
