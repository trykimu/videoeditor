import React, { useRef } from 'react';

interface MyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  ref: React.RefObject<HTMLInputElement | null>;
  label: string;
}

function MyInput({ ref, label, ...props }: MyInputProps) {
  return (
    <div className="mb-4">
      <label htmlFor={props.id || label} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        ref={ref}
        {...props}
        id={props.id || label}
        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
    </div>
  );
}

MyInput.displayName = 'MyInput'; // Helpful for debugging

// Example usage of the MyInput component
export default function Learn() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocusClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Learning forwardRef</h1>
      <MyInput
        ref={inputRef}
        label="My Input Field"
        type="text"
        placeholder="Enter text here"
        id="learn-input"
      />
      <button
        onClick={handleFocusClick}
        // style={{ marginTop: '10px' }} // Replaced by Tailwind class
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-4"
      >
        Focus the input
      </button>
    </div>
  );
};