import { useRef, useEffect } from 'react';

function useAutoResizeTextarea(textareaRef, value) {
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value, textareaRef]);
}

export default function AutoGrowingTextarea({ value, onChange, placeholder }) {
  const textareaRef = useRef(null);
  useAutoResizeTextarea(textareaRef, value);

  return (
    <textarea
      ref={textareaRef}
      placeholder={placeholder}
      className="textarea"
      value={value}
      maxLength={500}
      onChange={onChange}
      style={{
        overflow: 'hidden',
        resize: 'none',
      }}
    />
  );
}
