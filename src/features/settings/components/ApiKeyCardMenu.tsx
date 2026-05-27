import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";

interface ApiKeyCardMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function ApiKeyCardMenu({ onEdit, onDelete }: ApiKeyCardMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + 4, left: rect.right - 192 });
    }
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = () => setIsMenuOpen(false);
    const handleScroll = () => setIsMenuOpen(false);

    document.addEventListener("click", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isMenuOpen]);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onEdit();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onDelete();
  };

  return (
    <div className="relative flex-shrink-0 w-6">
      <button
        ref={buttonRef}
        onClick={handleMenuClick}
        className="h-6 w-6 flex items-center justify-center hover:bg-accent rounded-md transition-colors"
        aria-label="Options"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isMenuOpen &&
        createPortal(
          <div
            className="fixed w-48 bg-popover border border-border rounded-md shadow-lg z-20"
            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <div className="border-t border-border" />
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-accent transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
