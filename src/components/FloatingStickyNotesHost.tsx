import React from 'react';
import { useLifeOS } from '../context/LifeOSContext';
import { FloatingStickyNote } from './FloatingStickyNote';

export const FloatingStickyNotesHost: React.FC = () => {
  const { stickyNotes, updateStickyNote } = useLifeOS();

  const floatingNotes = stickyNotes.filter(n => n.isFloatingOpen);
  if (floatingNotes.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[45] overflow-hidden">
      {floatingNotes.map(note => (
        <FloatingStickyNote
          key={note.id}
          note={note}
          onClose={() => updateStickyNote(note.id, { isFloatingOpen: false, isExternalPiPOpen: false })}
        />
      ))}
    </div>
  );
};
