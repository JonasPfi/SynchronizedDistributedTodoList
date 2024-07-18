import React, { useEffect, useState } from "react";
import { EditText, EditTextarea } from "react-edit-text";
import "./css/todolist.css";
import axios from "axios";
import socketIO from "socket.io-client";

const URL =
  process.env.NODE_ENV === "production" ? undefined : "http://localhost:8080";

const socket = socketIO.connect(URL);

function TaskList() {
  const [tableData, setTableData] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [newCategory, setNewCategory] = useState("");
  const [newTask, setNewTask] = useState({
    category: "",
    name: "",
    description: "",
    dueDate: "",
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // SocketIO events
  useEffect(() => {
    loadTableData();
    socket.on("refreshTableData", () => {
      console.log("Received broadcast: refreshTableData");
      loadTableData();
    });
  }, []);

  // Loads table data with backend call
  const loadTableData = async () => {
    try {
      const response = await axios.get(`${URL}/database`);
      setTableData(response.data);
    } catch (error) {
      console.error("Error loading data", error);
    }
  };

  useEffect(() => {
    // Map tableData to tasks structure
    const categoriesMap = new Map();
    tableData.forEach((item) => {
      if (!categoriesMap.has(item.category_name)) {
        categoriesMap.set(item.category_name, {
          category: item.category_name,
          tasks: [],
        });
      }
      categoriesMap.get(item.category_name).tasks.push({
        id: item.todo_id,
        name: item.todo_title,
        description: item.todo_description,
        dueDate: item.todo_due_date,
        completed: item.todo_finished === 1,
      });
    });

    const mappedTasks = Array.from(categoriesMap.values());
    setTasks(mappedTasks);
  }, [tableData]);

  const toggleComplete = (taskId) => {
    const taskElement = document.getElementById(taskId);

    if (taskElement) {
      if (taskElement.classList.contains("completed")) {
        taskElement.classList.remove("completed");
      } else {
        taskElement.classList.add("completed");
      }
    }

    const updatedTasks = tasks.map((category) => ({
      ...category,
      tasks: category.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ),
    }));

    setTasks(updatedTasks);
  };

  const editTask = (taskId, newName) => {
    const updatedTasks = tasks.map((category) => ({
      ...category,
      tasks: category.tasks.map((task) =>
        task.id === taskId ? { ...task, name: newName } : task
      ),
    }));
    setTasks(updatedTasks);
  };

  const addCategory = () => {
    if (newCategory) {
      setTasks([...tasks, { category: newCategory, tasks: [] }]);
      setNewCategory("");
      setShowCategoryModal(false);
    }
  };

  const addTask = () => {
    if (
      newTask.category &&
      newTask.name &&
      newTask.description &&
      newTask.dueDate
    ) {
      const updatedTasks = tasks.map((category) => {
        if (category.category === newTask.category) {
          const newTaskItem = {
            id:
              category.tasks.reduce(
                (maxId, task) => Math.max(maxId, task.id),
                0
              ) + 1,
            name: newTask.name,
            description: newTask.description,
            dueDate: newTask.dueDate,
            completed: false,
          };
          return {
            ...category,
            tasks: [...category.tasks, newTaskItem],
          };
        }
        return category;
      });
      setTasks(updatedTasks);
      setNewTask({ category: "", name: "", description: "", dueDate: "" });
      setShowTaskModal(false);
    }
  };

  const filteredTasks = tasks.map((category) => ({
    ...category,
    tasks: category.tasks.filter((task) => {
      if (filter === "all") return true;
      if (filter === "completed") return task.completed;
      if (filter === "pending") return !task.completed;
      return true;
    }),
  }));

  return (
    <div className="App">
      <div className="controls">
        <button
          className="add-category"
          onClick={() => setShowCategoryModal(true)}
        >
          Add Category
        </button>
        <button className="add-task" onClick={() => setShowTaskModal(true)}>
          Add Task
        </button>
        <select
          className="task-filter"
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {showCategoryModal && (
        <>
          <div
            className="modal-overlay"
            onClick={() => setShowCategoryModal(false)}
          />
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
          <div
            className="modal-overlay"
            onClick={() => setShowTaskModal(false)}
          />
          <div className="modal">
            <h2>Add Task</h2>
            <input
              type="text"
              placeholder="Category"
              value={newTask.category}
              onChange={(e) =>
                setNewTask({ ...newTask, category: e.target.value })
              }
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
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
            />
            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) =>
                setNewTask({ ...newTask, dueDate: e.target.value })
              }
            />
            <button onClick={addTask}>Add Task</button>
            <button onClick={() => setShowTaskModal(false)}>Cancel</button>
          </div>
        </>
      )}

      <h1>Todos</h1>
      <div className="task-list">
        {filteredTasks.map(
          (category, index) =>
            category.tasks.length > 0 && (
              <div key={index} className="task-category">
                <h2>{category.category}</h2>
                <ul>
                  {category.tasks.map((task) => {
                    const isOverdue = new Date(task.dueDate) < new Date();
                    return (
                      <li
                        key={task.id} //key to find the right todo with the task id from whole event
                        className={`task-item ${
                          task.completed ? "completed" : ""
                        }`}
                      >
                        {/* Todo item: checkmark, title, description and due date */}
                        <div className="task-details">
                          {/* Checkmark */}
                          <label className="task-left ckeck-container">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => toggleComplete(task.id)}
                            />
                            <svg viewBox="0 0 64 64" height="2em" width="2em">
                              <path
                                d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16"
                                pathLength="575.0541381835938"
                                class="path"
                              ></path>
                            </svg>
                          </label>
                          {/* Title and description */}
                          <div className="task-title-description">
                            {/* Title */}
                            <React.Fragment>
                              <EditText
                                name={task.id + "-title"}
                                defaultValue={task.name}
                                inputClassName="task-title-edit"
                                className="task-title"
                              ></EditText>
                            </React.Fragment>
                            {/* Description */}
                            <div className="task-description">
                              <React.Fragment>
                                <EditTextarea
                                  name={task.id + "-description"}
                                  defaultValue={task.description}
                                  inputClassName="task-description-edit"
                                  className="task-description"
                                ></EditTextarea>
                              </React.Fragment>
                            </div>
                          </div>
                          {/* Due date */}
                          <div>
                            <label className="task-title">Due:</label>
                            <div
                              className={`task-due-date ${
                                isOverdue ? "overdue" : "ontime"
                              }`}
                            >
                              {new Date(task.dueDate).toLocaleDateString(
                                "de-DE",
                                {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )
        )}
      </div>
    </div>
  );
}

export default TaskList;
