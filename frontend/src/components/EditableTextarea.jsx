import React, { useState, useEffect } from 'react';
import '../css/todolist.css'; 

const EditableTextarea = ({ value, onSave, onEditMode, readonly }) => {
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

  return (
    <div>
      {isEditing ? (
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
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
          {value}
        </p>
      )}
    </div>
  );
};

export default EditableTextarea;
