import React, { useState, useRef, useEffect } from 'react';
import styles from './Dropdown.module.css';

function Dropdown({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const lastTypeRef = useRef(0);

  // Find currently selected option
  const currentIndex = options.findIndex(o => o.value === value);
  const current = options.find(o => o.value === value) || null;

  /* =======================================================
     OPEN/CLOSE LOGIC
  ======================================================= */

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClick = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on mouse leave (smooth)
  const handleMouseLeave = e => {
    // ensure we truly left, not hovering over child
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setOpen(false);
    }
  };

  // Close on blur
  const handleBlur = e => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setOpen(false);
    }
  };

  /* =======================================================
     KEYBOARD NAVIGATION
  ======================================================= */

  const handleKeyDown = e => {
    if (!open) {
      // When closed: open with ArrowDown, Enter, or Space
      if (['ArrowDown', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
        setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
      }
      return;
    }

    // 🔹 TYPE-TO-SEARCH when menu is open
    const isPrintable = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;

    if (isPrintable && e.key !== ' ') {
      const now = Date.now();
      let nextTerm = searchTerm;

      // reset if paused > 500ms
      if (now - lastTypeRef.current > 500) {
        nextTerm = '';
      }

      nextTerm += e.key.toLowerCase();
      lastTypeRef.current = now;
      setSearchTerm(nextTerm);

      const idx = options.findIndex(opt =>
        String(opt.label || '')
          .toLowerCase()
          .startsWith(nextTerm)
      );

      if (idx !== -1) {
        setActiveIndex(idx);
      }

      return;
    }

    // When menu is open:
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => {
        if (options.length === 0) return 0;
        const next = (i + 1) % options.length; // wrap-around
        return next;
      });
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => {
        if (options.length === 0) return 0;
        const prev = (i - 1 + options.length) % options.length; // wrap-around
        return prev;
      });
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      onChange(options[activeIndex].value);
      setOpen(false);
      return;
    }
  };

  // Auto-scroll active item into view
  useEffect(() => {
    if (!open || !menuRef.current) return;
    const el = menuRef.current.children[activeIndex];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className={styles.dropdown}
      ref={dropdownRef}
      onMouseLeave={handleMouseLeave}
      onBlur={handleBlur}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-haspopup="listbox"
      aria-expanded={open}
    >
      {label && <span className={styles.dropdownLabel}>{label}</span>}

      <button
        type="button"
        className={styles.dropdownTrigger}
        onClick={() => {
          setOpen(o => !o);
          setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
        }}
      >
        <span>{current ? current.label : label}</span>
        <span className={styles.dropdownChevron}>▾</span>
      </button>

      {open && (
        <div className={styles.dropdownMenu} ref={menuRef} role="listbox">
          {options.map((opt, i) => (
            <button
              type="button"
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={
                i === activeIndex
                  ? `${styles.dropdownItem} ${styles.dropdownItemActive}`
                  : styles.dropdownItem
              }
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dropdown;
