import React, { useEffect, useState } from "react";
import { EditText, EditTextarea } from "react-edit-text";
import "./css/todolist.css";
import axios from "axios";
import socketIO from "socket.io-client";

const URL = process.env.NGINX_URL ? undefined : "http://localhost/";
let socket = socketIO(URL, { transports: ["websocket"] }).connect();

function todoList() {
  const [tableData, setTableData] = useState([]);
  const [todos, settodos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState("all");
  const [newCategory, setNewCategory] = useState("");
  const [newtodo, setNewtodo] = useState({
    category: "",
    name: "",
    description: "",
    dueDate: "",
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showtodoModal, setShowtodoModal] = useState(false);
  const [todoError, settodoError] = useState("");

  useEffect(() => {
    loadTableData();
    loadCategories();
    socket.on(`edit todo`, (todoId, type) => {
      console.log("Locking todo: " + todoId + type);
    })
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
          todos: [],
        });
      }
      categoriesMap.get(item.category_name).todos.push({
        id: item.todo_id,
        name: item.todo_title,
        description: item.todo_description,
        dueDate: item.todo_due_date,
        completed: item.todo_finished === 1,
      });
    });

    const mappedtodos = Array.from(categoriesMap.values());
    settodos(mappedtodos);
  }, [tableData]);

  const toggleComplete = (todoId) => {
    const todoElement = document.getElementById(todoId);
    if (todoElement) {
      if (todoElement.classList.contains("completed")) {
        todoElement.classList.remove("completed");
      } else {
        todoElement.classList.add("completed");
      }
    }

    const updatedtodos = todos.map((category) => ({
      ...category,
      todos: category.todos.map((todo) =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      ),
    }));

    settodos(updatedtodos);
  };

  const edittodo = (todoId, type) => {
    socket.emit(`editTodo`, todoId, type);
  };

  const addCategory = async () => {
    if (newCategory) {
      try {
        const response = await axios.post(`${URL}category`, { category: newCategory });
        if (response.status === 200) {
          settodos([...todos, { category: newCategory, todos: [] }]);
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

  const addtodo = async () => {
    const existingtodo = todos.find((cat) =>
      cat.todos.some((todo) => todo.name === newtodo.name)
    );

    if (existingtodo) {
      settodoError("todo with the same name already exists.");
      return;
    }

    if (
      newtodo.category &&
      newtodo.name &&
      newtodo.description &&
      newtodo.dueDate
    ) {
      if (newtodo.name.length > 30) {
        settodoError("todo name exceeds 30 characters.");
        return;
      }

      if (newtodo.description.length > 200) {
        settodoError("todo description exceeds 200 characters.");
        return;
      }

      try {
        const response = await axios.post(`${URL}todo`, {
          title: newtodo.name,
          description: newtodo.description,
          category: newtodo.category,
          dueDate: newtodo.dueDate,
        });
        if (response.status === 200) {
          const updatedtodos = todos.map((category) => {
            if (category.category === newtodo.category) {
              const newtodoItem = {
                id: response.data.insertId,
                name: newtodo.name,
                description: newtodo.description,
                dueDate: newtodo.dueDate,
                completed: false,
              };
              return {
                ...category,
                todos: [...category.todos, newtodoItem],
              };
            }
            return category;
          });
          settodos(updatedtodos);
          setNewtodo({ category: "", name: "", description: "", dueDate: "" });
          setShowtodoModal(false);
          settodoError("");
          socket.emit("refreshTableData");
        }
      } catch (error) {
        console.error("Error adding todo", error);
      }
    } else {
      settodoError("All fields are required.");
    }
  };

  const filteredtodos = todos.map((category) => ({
    ...category,
    todos: category.todos.filter((todo) => {
      if (filter === "all") return true;
      if (filter === "completed") return todo.completed;
      if (filter === "pending") return !todo.completed;
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
        <button className="add-todo" onClick={() => setShowtodoModal(true)}>
          Add todo
        </button>
        <select
          className="todo-filter"
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

      {showtodoModal && (
        <>
          <div
            className="modal-overlay"
            onClick={() => setShowtodoModal(false)}
          />
          <div className="modal">
            <h2>Add todo</h2>
            <select
              value={newtodo.category}
              onChange={(e) => setNewtodo({ ...newtodo, category: e.target.value })}
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
              placeholder="todo Name"
              value={newtodo.name}
              onChange={(e) => setNewtodo({ ...newtodo, name: e.target.value })}
              maxLength="30"
            />
            <textarea
              placeholder="Description"
              value={newtodo.description}
              onChange={(e) =>
                setNewtodo({ ...newtodo, description: e.target.value })
              }
              maxLength="200"
            />
            <input
              type="date"
              value={newtodo.dueDate}
              onChange={(e) =>
                setNewtodo({ ...newtodo, dueDate: e.target.value })
              }
            />
            {todoError && <div className="error">{todoError}</div>}
            <button onClick={addtodo}>Add todo</button>
            <button onClick={() => setShowtodoModal(false)}>Cancel</button>
          </div>
        </>
      )}

      <h1>Todos</h1>
      <div className="todo-list">
        {filteredtodos.map(
          (category, index) =>
            category.todos.length > 0 && (
              <div key={index} className="todo-category">
                <h2>{category.category}</h2>
                <ul>
                  {category.todos.map((todo) => {
                    const isOverdue = new Date(todo.dueDate) < new Date();
                    return (
                      <li
                        key={todo.id}
                        id={todo.id}
                        className={`todo-item ${todo.completed ? "completed" : ""
                          }`}
                      >
                        {/* Todo item: checkmark, title, description and due date */}
                        <div className="todo-details">
                          <label className="todo-left check-container">
                            <input
                              type="checkbox"
                              checked={todo.completed}
                              onChange={() => toggleComplete(todo.id)}
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
                          <div className="todo-title-description">
                            {/* Title */}
                            <React.Fragment>
                              <EditText
                                name={todo.id + "-title"}
                                defaultValue={todo.name}
                                inputClassName="todo-title-edit"
                                className="todo-title"
                                onEditMode={() => edittodo(todo.id, "title")}
                              ></EditText>
                            </React.Fragment>
                            {/* Description */}
                            <div className="todo-description">
                              <React.Fragment>
                                <EditTextarea
                                  name={todo.id + "-description"}
                                  defaultValue={todo.description}
                                  rows={3}
                                  inputClassName="todo-description-edit"
                                  className="todo-description"
                                ></EditTextarea>
                              </React.Fragment>
                            </div>
                          </div>
                          {/* Due date */}
                          <div className="todo-text-duo-date">
                            <label className="todo-title">Due:</label>
                            <div
                              className={`todo-due-date ${isOverdue ? "overdue" : "ontime"
                                }`}
                            >
                              {new Date(todo.dueDate).toLocaleDateString(
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

export default todoList;
