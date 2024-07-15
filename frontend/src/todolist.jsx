import React, { useState } from 'react';
import './todolist.css';
 
const initialTasks = [
  {
    category: 'Website redesign',
    tasks: [
      { id: 1, name: 'Daily triage of redesign feedback', dueDate: 'Today', project: 'Website redesign', completed: false },
      { id: 2, name: 'Launch new home page', dueDate: 'Nov 24 – Today', project: 'Website redesign', completed: false },
    ],
  },
  {
    category: 'Blog & article creation',
    tasks: [
      { id: 3, name: 'Review announcement blog', dueDate: 'Today', project: 'Blog Editorial Calendar', completed: false },
    ],
  },
  {
    category: 'Email newsletter',
    tasks: [
      { id: 4, name: 'Company dogs email newsletter?', dueDate: 'Today – Dec 17', project: 'Email Lifecycle Marketing', completed: false },
    ],
  },
  {
    category: 'Q1 marketing campaign',
    tasks: [
      { id: 5, name: 'Develop messaging & positioning', dueDate: 'Today', project: 'Marketing campaign plan', completed: false },
      { id: 6, name: 'Research campaign measurement tools', dueDate: 'Tomorrow', project: 'Marketing campaign plan', completed: false },
    ],
  },
];
 
const TaskList = () => {
  const [tasks, setTasks] = useState(initialTasks);
 
  const toggleComplete = (taskId) => {
    const updatedTasks = tasks.map((taskCategory) => ({
      ...taskCategory,
      tasks: taskCategory.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ),
    }));
    setTasks(updatedTasks);
  };
 
  const editTask = (taskId, newName) => {
    const updatedTasks = tasks.map((taskCategory) => ({
      ...taskCategory,
      tasks: taskCategory.tasks.map((task) =>
        task.id === taskId ? { ...task, name: newName } : task
      ),
    }));
    setTasks(updatedTasks);
  };
 
  return (
<div className="task-list">
<h1>My Tasks</h1>
      {tasks.map((taskCategory, index) => (
<div key={index} className="task-category">
<h2>{taskCategory.category}</h2>
<ul>
            {taskCategory.tasks.map((task) => (
<li key={task.id} className="task-item">
<div className="task-left">
<input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleComplete(task.id)}
                  />
<div className="task-name">{task.name}</div>
</div>
<div className="task-details">
<span className="task-due-date">{task.dueDate}</span>
<span className="task-project">{task.project}</span>
<button onClick={() => {
                    const newName = prompt("Edit task name:", task.name);
                    if (newName) editTask(task.id, newName);
                  }}>
                    Edit
</button>
</div>
</li>
            ))}
</ul>
</div>
      ))}
</div>
  );
};
 
function App() {
  return (
<div className="App">
<TaskList />
</div>
  );
}
 
export default App;