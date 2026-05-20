import React, { useRef, useState, useEffect } from 'react';

interface CodeInputProps {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
}

const CodeInput: React.FC<CodeInputProps> = ({ length = 6, onComplete, disabled }) => {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, char: string) => {
    if (!/^\d*$/.test(char)) return;

    const newValues = [...values];
    newValues[index] = char.slice(-1);
    setValues(newValues);

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const code = newValues.join('');
    if (code.length === length) {
      onComplete(code);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;

    const newValues = Array(length).fill('');
    for (let i = 0; i < pasted.length; i++) {
      newValues[i] = pasted[i]!;
    }
    setValues(newValues);

    const focusIdx = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIdx]?.focus();

    if (pasted.length === length) {
      onComplete(pasted);
    }
  };

  return (
    <div className="erp-code-input" onPaste={handlePaste}>
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          className="erp-code-input-box"
          autoComplete="off"
        />
      ))}
    </div>
  );
};

export default CodeInput;
