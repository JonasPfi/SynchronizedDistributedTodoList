import React, { useEffect, useState } from "react";
import { EditText, EditTextarea } from "react-edit-text";
import "./css/todolist.css";
import axios from "axios";
import socketIO from "socket.io-client";

const URL = process.env.NGINX_URL ? undefined : "http://localhost/";
let socket = socketIO(URL, { transports: ["websocket"] }).connect();

function TaskList() {
  const [tableData, setTableData] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
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
  const [taskError, setTaskError] = useState("");

  useEffect(() => {
    loadTableData();
    loadCategories();
    socket.on("refreshTableData", () => {
      console.log("Received broadcast: refreshTableData");
      loadTableData();
      loadCategories(); // Load categories again when data is refreshed
    });
  }, []);

  const loadTableData = async () => {
    try {
      const response = await axios.get(`${URL}database`);
      setTableData(response.data);
    } catch (error) {
      console.error("Error loading data", error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${URL}category`);
      setCategories(response.data.map((cat) => cat.category_name));
    } catch (error) {
      console.error("Error loading categories", error);
    }
  };

  useEffect(() => {
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

  const addCategory = async () => {
    if (newCategory) {
      try {
        const response = await axios.post(`${URL}category`, { category: newCategory });
        if (response.status === 200) {
          setTasks([...tasks, { category: newCategory, tasks: [] }]);
          setCategories([...categories, newCategory]);
          setNewCategory("");
          setShowCategoryModal(false);
          socket.emit("refreshTableData");
        }
      } catch (error) {
        console.error("Error adding category", error);
      }
    }
  };

  const addTask = async () => {
    const existingTask = tasks.find((cat) =>
      cat.tasks.some((task) => task.name === newTask.name)
    );

    if (existingTask) {
      setTaskError("Task with the same name already exists.");
      return;
    }

    if (
      newTask.category &&
      newTask.name &&
      newTask.description &&
      newTask.dueDate
    ) {
      if (newTask.name.length > 30) {
        setTaskError("Task name exceeds 30 characters.");
        return;
      }

      if (newTask.description.length > 200) {
        setTaskError("Task description exceeds 200 characters.");
        return;
      }

      try {
        const response = await axios.post(`${URL}todo`, {
          title: newTask.name,
          description: newTask.description,
          category: newTask.category,
          dueDate: newTask.dueDate,
        });
        if (response.status === 200) {
          const updatedTasks = tasks.map((category) => {
            if (category.category === newTask.category) {
              const newTaskItem = {
                id: response.data.insertId,
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
          setTaskError("");
          socket.emit("refreshTableData");
        }
      } catch (error) {
        console.error("Error adding task", error);
      }
    } else {
      setTaskError("All fields are required.");
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
              maxLength="30"
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
            <select
              value={newTask.category}
              onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
            >
              <option value="" disabled>
                Select Category
              </option>
              {categories.map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Task Name"
              value={newTask.name}
              onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
              maxLength="30"
            />
            <textarea
              placeholder="Description"
              value={newTask.description}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
              maxLength="200"
            />
            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) =>
                setNewTask({ ...newTask, dueDate: e.target.value })
              }
            />
            {taskError && <div className="error">{taskError}</div>}
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
                        key={task.id}
                        id={task.id}
                        className={`task-item ${
                          task.completed ? "completed" : ""
                        }`}
                      >
                        {/* Todo item: checkmark, title, description and due date */}
                        <div className="task-details">
                          <label className="task-left check-container">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => toggleComplete(task.id)}
                            />
                            <svg viewBox="0 0 64 64" height="2em" width="2em">
                              <path
                                d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16"
                                pathLength="575.0541381835938"
                                className="path"
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
                                  rows={3}
                                  inputClassName="task-description-edit"
                                  className="task-description"
                                ></EditTextarea>
                              </React.Fragment>
                            </div>
                          </div>
                          {/* Due date */}
                          <div className="task-text-duo-date">
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
