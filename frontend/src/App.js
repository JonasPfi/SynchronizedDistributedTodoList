import React, { useState } from 'react';
import './App.css';  // Import the CSS file for styling

function App() {
  // State to store the list of tasks
  const [tasks, setTasks] = useState([]);
  // State to store the value of the new task input
  const [newTask, setNewTask] = useState("");

  // Function to add a new task to the list
  const addTask = () => {
    if (newTask.trim() !== "") {  // Check if the new task is not empty
      setTasks([...tasks, newTask]);  // Add the new task to the tasks array
      setNewTask("");  // Clear the input field
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>To-Do List</h1>
        <input
          type="text"
          className="task-input"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}  // Update newTask state on input change
          placeholder="Enter a new task"
        />
        <button className="add-task-button" onClick={addTask}>Add Task</button>
        <ul className="task-list">
          {tasks.map((task, index) => (
            <li key={index}>{task}</li>  // Render each task in the list
          ))}
        </ul>
      </header>
    </div>
  );
}

export default App;  // Export the App component as the default export
