import React, { useState, useEffect } from 'react';
import '../css/todolist.css'; 

const EditableText = ({ value, onSave, onEditMode, onChange, readonly }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    onSave(inputValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  const handleClick = () => {
    if (!readonly) {
      setIsEditing(true);
      if (onEditMode) {
        onEditMode();  
      }
    }
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
    if (onChange) {
      onChange(e.target.value);  
    }
  };

  return (
    <div>
      {isEditing ? (
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}  
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={readonly}
          autoFocus
          className="todo-title-edit"  
        />
      ) : (
        <span 
          onClick={handleClick}
          className="todo-title"  
        >
          {inputValue}
        </span>
      )}
    </div>
  );
};

export default EditableText;
