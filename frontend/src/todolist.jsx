import React, { useEffect, useState } from "react";
import { EditText, EditTextarea } from "react-edit-text";
import "./css/todolist.css";
import axios from "axios";
import socketIO from "socket.io-client";

const URL = process.env.NGINX_URL ? undefined : "http://localhost/";
let socket = socketIO(URL, { transports: ["websocket"] }).connect();

function TodoList() {
  const [tableData, setTableData] = useState([]);
  const [todos, setTodos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState("all");
  const [newCategory, setNewCategory] = useState("");
  const [newTodo, setNewTodo] = useState({
    category: "",
    name: "",
    description: "",
    dueDate: "",
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [todoError, setTodoError] = useState("");

  useEffect(() => {
    loadTableData();
    loadCategories();
    socket.on('lockElement', (todoId) => {
      console.log("Received broadcast: lockElement for todoId:", todoId);
      setTodos(prevTodos => {
        const updatedTodos = prevTodos.map(category => ({
          ...category,
          todos: category.todos.map(todo =>
            todo.id === todoId ? { ...todo, isLocked: true } : todo
          )
        }));
        return updatedTodos;
      });
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

    const mappedTodos = Array.from(categoriesMap.values());
    setTodos(mappedTodos);
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

    const updatedTodos = todos.map((category) => ({
      ...category,
      todos: category.todos.map((todo) =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      ),
    }));

    setTodos(updatedTodos);
  };

  const editTodo = (todoId) => {
    console.log("broadcastEditTodo");
    socket.emit('broadcastEditTodo', todoId);
  };

  const addCategory = async () => {
    if (newCategory) {
      try {
        const response = await axios.post(`${URL}category`, { category: newCategory });
        if (response.status === 200) {
          setTodos([...todos, { category: newCategory, todos: [] }]);
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

  const addTodo = async () => {
    const existingTodo = todos.find((cat) =>
      cat.todos.some((todo) => todo.name === newTodo.name)
    );

    if (existingTodo) {
      setTodoError("Todo with the same name already exists.");
      return;
    }

    if (
      newTodo.category &&
      newTodo.name &&
      newTodo.description &&
      newTodo.dueDate
    ) {
      if (newTodo.name.length > 30) {
        setTodoError("Todo name exceeds 30 characters.");
        return;
      }

      if (newTodo.description.length > 200) {
        setTodoError("Todo description exceeds 200 characters.");
        return;
      }

      try {
        const response = await axios.post(`${URL}todo`, {
          title: newTodo.name,
          description: newTodo.description,
          category: newTodo.category,
          dueDate: newTodo.dueDate,
        });
        if (response.status === 200) {
          const updatedTodos = todos.map((category) => {
            if (category.category === newTodo.category) {
              const newTodoItem = {
                id: response.data.insertId,
                name: newTodo.name,
                description: newTodo.description,
                dueDate: newTodo.dueDate,
                completed: false,
              };
              return {
                ...category,
                todos: [...category.todos, newTodoItem],
              };
            }
            return category;
          });
          setTodos(updatedTodos);
          setNewTodo({ category: "", name: "", description: "", dueDate: "" });
          setShowTodoModal(false);
          setTodoError("");
          socket.emit("refreshTableData");
        }
      } catch (error) {
        console.error("Error adding todo", error);
      }
    } else {
      setTodoError("All fields are required.");
    }
  };

  const filteredTodos = todos.map((category) => ({
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
        <button className="add-todo" onClick={() => setShowTodoModal(true)}>
          Add Todo
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

      {showTodoModal && (
        <>
          <div
            className="modal-overlay"
            onClick={() => setShowTodoModal(false)}
          />
          <div className="modal">
            <h2>Add Todo</h2>
            <select
              value={newTodo.category}
              onChange={(e) => setNewTodo({ ...newTodo, category: e.target.value })}
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
              placeholder="Todo Name"
              value={newTodo.name}
              onChange={(e) => setNewTodo({ ...newTodo, name: e.target.value })}
              maxLength="30"
            />
            <textarea
              placeholder="Description"
              value={newTodo.description}
              onChange={(e) =>
                setNewTodo({ ...newTodo, description: e.target.value })
              }
              maxLength="200"
            />
            <input
              type="date"
              value={newTodo.dueDate}
              onChange={(e) =>
                setNewTodo({ ...newTodo, dueDate: e.target.value })
              }
            />
            {todoError && <div className="error">{todoError}</div>}
            <button onClick={addTodo}>Add Todo</button>
            <button onClick={() => setShowTodoModal(false)}>Cancel</button>
          </div>
        </>
      )}

      <h1>Todos</h1>
      <div className="todo-list">
        {filteredTodos.map(
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
                                onEditMode={() => editTodo(todo.id)}
                                readonly={todo.isLocked}
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
                                  onEditMode={() => editTodo(todo.id)}
                                  readonly={todo.isLocked}
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

export default TodoList;
