import React, { useState, useEffect } from 'react';
import '../css/todolist.css'; 

const EditableText = ({ value, onSave, onEditMode, readonly }) => {
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

  return (
    <div>
      {isEditing ? (
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
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
          {value}
        </span>
      )}
    </div>
  );
};

export default EditableText;
