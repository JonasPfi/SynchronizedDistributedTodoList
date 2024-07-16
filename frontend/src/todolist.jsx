import React, { useState } from 'react';
import './todolist.css';

const initialTasks = [
  {
    category: 'Website redesign',
    tasks: [
      { id: 1, name: 'Daily triage of redesign feedback', dueDate: '2024-07-16', description: 'Website redesign', completed: false },
      { id: 2, name: 'Launch new home page', dueDate: '2024-07-24', description: 'Website redesign', completed: false },
    ],
  },
  {
    category: 'Blog & article creation',
    tasks: [
      { id: 3, name: 'Review announcement blog', dueDate: '2024-07-16', description: 'Blog Editorial Calendar', completed: false },
    ],
  },
  {
    category: 'Email newsletter',
    tasks: [
      { id: 4, name: 'Company dogs email newsletter?', dueDate: '2024-12-17', description: 'Email Lifecycle Marketing', completed: false },
    ],
  },
  {
    category: 'Q1 marketing campaign',
    tasks: [
      { id: 5, name: 'Develop messaging & positioning', dueDate: '2024-07-16', description: 'Marketing campaign plan', completed: false },
      { id: 6, name: 'Research campaign measurement tools', dueDate: '2024-07-17', description: 'Marketing campaign plan', completed: false },
    ],
  },
];

const TaskList = () => {
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState('all');
  const [newCategory, setNewCategory] = useState('');
  const [newTask, setNewTask] = useState({ category: '', name: '', description: '', dueDate: '' });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

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

  const addCategory = () => {
    if (newCategory) {
      setTasks([...tasks, { category: newCategory, tasks: [] }]);
      setNewCategory('');
      setShowCategoryModal(false);
    }
  };

  const addTask = () => {
    if (newTask.category && newTask.name && newTask.description && newTask.dueDate) {
      const updatedTasks = tasks.map(taskCategory => {
        if (taskCategory.category === newTask.category) {
          const newTaskItem = {
            id: tasks.reduce((maxId, category) => Math.max(maxId, ...category.tasks.map(task => task.id)), 0) + 1,
            name: newTask.name,
            description: newTask.description,
            dueDate: newTask.dueDate,
            completed: false
          };
          return {
            ...taskCategory,
            tasks: [...taskCategory.tasks, newTaskItem]
          };
        }
        return taskCategory;
      });
      setTasks(updatedTasks);
      setNewTask({ category: '', name: '', description: '', dueDate: '' });
      setShowTaskModal(false);
    }
  };

  const filteredTasks = tasks.map(taskCategory => ({
    ...taskCategory,
    tasks: taskCategory.tasks.filter(task => {
      if (filter === 'all') return true;
      if (filter === 'completed') return task.completed;
      if (filter === 'pending') return !task.completed;
      return true;
    })
  }));

  return (
    <div className="App">
      <div className="controls">
        <button className="add-category" onClick={() => setShowCategoryModal(true)}>Add Category</button>
        <button className="add-task" onClick={() => setShowTaskModal(true)}>Add Task</button>
        <select className="task-filter" onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {showCategoryModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowCategoryModal(false)} />
          <div className="modal">
            <h2>Add Category</h2>
            <input
              type="text"
              placeholder="New Category Name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button onClick={addCategory}>Add Category</button>
            <button onClick={() => setShowCategoryModal(false)}>Cancel</button>
          </div>
        </>
      )}

      {showTaskModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowTaskModal(false)} />
          <div className="modal">
            <h2>Add Task</h2>
            <input
              type="text"
              placeholder="Category"
              value={newTask.category}
              onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
            />
            <input
              type="text"
              placeholder="Task Name"
              value={newTask.name}
              onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
            />
            <textarea
              placeholder="Description"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            />
            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
            />
            <button onClick={addTask}>Add Task</button>
            <button onClick={() => setShowTaskModal(false)}>Cancel</button>
          </div>
        </>
      )}

      <h1>My Tasks</h1>
      <div className="task-list">
        {filteredTasks.map((taskCategory, index) => (
          <div key={index} className="task-category">
            <h2>{taskCategory.category}</h2>
            <ul>
              {taskCategory.tasks.map((task) => {
                const isOverdue = new Date(task.dueDate) < new Date();
                return (
                  <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                    <div className="task-left">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleComplete(task.id)}
                      />
                      <div className="task-name">{task.name}</div>
                    </div>
                    <div className="task-details">
                      <span className={`task-due-date ${isOverdue ? 'overdue' : 'ontime'}`}>
                        {task.dueDate}
                      </span>
                      <span className="task-description">{task.description}</span>
                      <button onClick={() => {
                        const newName = prompt("Edit task name:", task.name);
                        if (newName) editTask(task.id, newName);
                      }}>
                        Edit
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList;
