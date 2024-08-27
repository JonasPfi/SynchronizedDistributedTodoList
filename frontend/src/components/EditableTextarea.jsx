import React, { useState, useEffect } from 'react';
import '../css/todolist.css'; 

const EditableTextarea = ({ value, onSave, onEditMode, onChange, readonly }) => {
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
    if (e.key === 'Enter' && e.shiftKey) {
      // Allow new lines with Shift + Enter
      return;
    }
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
        <textarea
          value={inputValue}
          onChange={handleChange}  
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={readonly}
          rows={3}
          autoFocus
          className="todo-description-edit"  
        />
      ) : (
        <p 
          onClick={handleClick}
          className="todo-description" 
        >
          {inputValue}
        </p>
      )}
    </div>
  );
};

export default EditableTextarea;
