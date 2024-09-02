import React, { useEffect, useState } from "react";
import EditableText from "./components/EditableText";
import EditableTextarea from "./components/EditableTextarea";
import "./css/todolist.css";
import axios from "axios";
import socketIO from "socket.io-client";

const URL = import.meta.env.VITE_NGINX_URL
  ? import.meta.env.VITE_NGINX_URL
  : "http://localhost/";

const socket = socketIO(URL, {
  path: "/socket.io/",
  transports: ["websocket"],
  withCredentials: true,
});

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
  const [updateTodo, setUpdateTodo] = useState({
    id: "",
    type: "",
    content: "",
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [todoError, setTodoError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      await loadTableData();
      await loadCategories();
      setDataLoaded(true);
    };

    loadData();

    socket.on("lockedTodos", (lockedTodos) => {
      console.log("Received locked todos:", lockedTodos);
      setTodos((prevTodos) => {
        const updatedTodos = prevTodos.map((category) => ({
          ...category,
          todos: category.todos.map((todo) =>
            lockedTodos.includes(todo.id) ? { ...todo, isLocked: true } : todo
          ),
        }));
        return updatedTodos;
      });
    });

    socket.on('todoStatusChanged', (todoId, completed) => {
      setTodos((prevTodos) => {
          const updatedTodos = prevTodos.map((category) => ({
              ...category,
              todos: category.todos.map((todo) =>
                  todo.id === todoId ? { ...todo, completed } : todo
              ),
          }));
          return updatedTodos;
      });
  });

    socket.on("lockElement", (todoId) => {
      console.log("Received broadcast: lockElement for todoId:", todoId);
      setTodos((prevTodos) => {
        const updatedTodos = prevTodos.map((category) => ({
          ...category,
          todos: category.todos.map((todo) =>
            todo.id === todoId ? { ...todo, isLocked: true } : todo
          ),
        }));
        return updatedTodos;
      });
    });

    socket.on("unlockElement", (todoId) => {
      console.log("Received broadcast: unlockElement for todoId:", todoId);
      setTodos((prevTodos) => {
        const updatedTodos = prevTodos.map((category) => ({
          ...category,
          todos: category.todos.map((todo) =>
            todo.id === todoId ? { ...todo, isLocked: false } : todo
          ),
        }));
        return updatedTodos;
      });
    });

    socket.on("addLocalTodo", (todoId, todo) => {
      console.log("Received broadcast: Add local todo: ", todoId, todo);
      addTodoLocally(todoId, todo);
    });

    socket.on("addLocalCategory", (category) => {
      console.log("Received broadcast: Add local category: ", category);
      setCategories((prevCategories) => [...prevCategories, category]);
      setTodos((prevTodos) => [
        ...prevTodos,
        { category: category, todos: [] },
      ]);
    });

    socket.on("changeTodo", (todoId, type, content) => {
      console.log("Received broadcast: Change Todo: ", todoId);
      setTodos((prevTodos) => {
        const updatedTodos = prevTodos.map((category) => ({
          ...category,
          todos: category.todos.map((todo) => {
            if (todo.id === todoId) {
              if (type == "description") {
                return { ...todo, description: content };
              } else {
                return { ...todo, name: content };
              }
            }
            return todo;
          }),
        }));
        return updatedTodos;
      });
    });

    socket.on("userId", (id) => {
      console.log("Received emit: User ID:", id);
      setUserId(id);
    });

    socket.on('deletedTodo', (todoId) => {
      setTodos((prevTodos) => {
        const updatedTodos = prevTodos.map((category) => ({
          ...category,
          todos: category.todos.filter((todo) => todo.id !== todoId),
        }));
        return updatedTodos.filter(category => category.todos.length > 0); 
      });
    });

    return () => {
      socket.off("initializeLocks");
      socket.off("lockElement");
      socket.off("unlockElement");
      socket.off("addLocalTodo");
      socket.off("addLocalCategory");
      socket.off("changeTodo");
      socket.off("deletedTodo");
      socket.off("userId");
    };
  }, []);

  const loadTableData = async () => {
    try {
      const response = await axios.get(`${URL}database`);
      setTableData(response.data);
      socket.emit("getLockedTodos");
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
    if (dataLoaded) {
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
    }
  }, [dataLoaded, tableData]);

  // Function for toggling the completion status of a todo
const toggleComplete = async (todoId) => {
  // Find the current completion status of the todo
  const todoToUpdate = todos.flatMap(category => category.todos).find(todo => todo.id === todoId);
  const newCompletedStatus = !todoToUpdate.completed;

  // local update of the todo status
  const updatedTodos = todos.map((category) => ({
    ...category,
    todos: category.todos.map((todo) =>
      todo.id === todoId ? { ...todo, completed: newCompletedStatus } : todo
    ),
  }));

  setTodos(updatedTodos);

  try {
    // Send status change to the server
    const response = await axios.put(`${URL}todo/finished`, {
      todoId: todoId,
      completed: newCompletedStatus,
      userId: userId,
    });

    if (response.status === 200) {
      // Broadcast the change to all connected clients
      socket.emit('changedTodoStatus', todoId, newCompletedStatus);
    } else {
      throw new Error('Failed to update todo status');
    }
  } catch (error) {
    console.error('Error updating todo status', error);
    // Rollback the status change if the request fails
    setTodos((prevTodos) => {
      const revertedTodos = prevTodos.map((category) => ({
        ...category,
        todos: category.todos.map((todo) =>
          todo.id === todoId ? { ...todo, completed: !newCompletedStatus } : todo
        ),
      }));
      return revertedTodos;
    });
  }
};

  const editTodo = (todoId, field, content) => {
    socket.emit("editTodo", todoId, field, content);
    setUpdateTodo({
      id: todoId,
      type: field,
      content: content,
    });
  };

  const finishedEditTodo = async (todoId, type, content) => {
    try {
      const response = await axios.put(`${URL}todo`, {
        todoId: todoId,
        type: type,
        content: content,
        userId: userId,
      });
      if (response.status != 200) {
        socket.emit(
          "changedTodo",
          updateTodo.id,
          updateTodo.type,
          updateTodo.content
        );
        throw new Error("Failed to update todo in the database.");
      }
      socket.emit("unlockTodo", todoId);
      socket.emit("changedTodo", todoId, type, content);
    } catch (error) {
      console.error("Error updating todo", error);
      socket.emit(
        "changedTodo",
        updateTodo.id,
        updateTodo.type,
        updateTodo.content
      );
    }
  };

  const handleTodoChange = (todoId, type, content) => {
    socket.emit("changedTodo", todoId, type, content);
  };

  const postCategoryToDB = async () => {
    if (newCategory) {
      if (categories.includes(newCategory)) {
        setCategoryError("Category already exists.");
        return;
      }
      try {
        const response = await axios.post(`${URL}category`, {
          category: newCategory,
        });
        if (response.status === 200) {
        }
      } catch (error) {
        console.error("Error adding category", error);
      }
    }
  };

  const addCategory = async () => {
    if (newCategory) {
      if (categories.includes(newCategory)) {
        setCategoryError("Category already exists.");
        return;
      }
      try {
        await postCategoryToDB();
        setTodos([...todos, { category: newCategory, todos: [] }]);
        setCategories([...categories, newCategory]);
        setNewCategory("");
        setShowCategoryModal(false);
        setCategoryError("");
        socket.emit("addedCategory", newCategory);
      } catch (error) {
        console.error("Error adding category", error);
      }
    }
  };

  const postTodoToDB = async (todo) => {
    try {
      const response = await axios.post(`${URL}todo`, {
        title: todo.name,
        description: todo.description,
        category: todo.category,
        dueDate: todo.dueDate,
      });

      if (response.status === 200) {
        return response.data.insertId;
      }
    } catch (error) {
      console.error("Error adding todo", error);
      throw new Error("Failed to add todo to the database.");
    }
  };

  const addTodoLocally = (newTodoId, newTodo) => {
    setTodos((prevTodos) => {
      const updatedTodos = prevTodos.map((category) => {
        if (category.category === newTodo.category) {
          const newTodoItem = {
            id: newTodoId,
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
      return updatedTodos;
    });
  };

    const deleteTodo = async (todoId) => {
      try {
          const response = await axios.delete(`${URL}todotable/${todoId}`);
          if (response.status === 200) {
              // Local update of todos after successful deletion
              setTodos((prevTodos) => {
                  const updatedTodos = prevTodos.map((category) => ({
                      ...category,
                      todos: category.todos.filter((todo) => todo.id !== todoId),
                  }));
                  return updatedTodos.filter(category => category.todos.length > 0);
              });

              // Broadcast an andere Clients
              socket.emit('deleteTodo', todoId);
          } else {
              throw new Error('Failed to delete todo');
          }
      } catch (error) {
          console.error('Error deleting todo', error);
      }
  };

  // Function to confirm and delete a todo
  const confirmAndDeleteTodo = (todoId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
        deleteTodo(todoId);
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
        const newTodoId = await postTodoToDB(newTodo);
        addTodoLocally(newTodoId, newTodo);
        socket.emit("addedTodo", newTodoId, newTodo);
        setNewTodo({ category: "", name: "", description: "", dueDate: "" });
        setShowTodoModal(false);
        setTodoError("");
      } catch (error) {
        setTodoError("Failed to add todo to the database.");
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
            {categoryError && <div className="error">{categoryError}</div>}
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
              onChange={(e) =>
                setNewTodo({ ...newTodo, category: e.target.value })
              }
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
                        className={`todo-item ${
                          todo.isLocked ? "todo-item-locked" : ""
                        } ${todo.completed ? "completed" : ""}`}
                      >
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
                          <div className="todo-title">
                            <EditableText
                              value={todo.name}
                              onSave={(e) =>
                                finishedEditTodo(todo.id, "title", e)
                              }
                              onEditMode={() =>
                                editTodo(todo.id, "title", todo.title)
                              }
                              onChange={(e) =>
                                handleTodoChange(todo.id, "title", e)
                              }
                              readonly={todo.isLocked}
                            />
                            <div className="todo-description">
                              <EditableTextarea
                                value={todo.description}
                                onSave={(e) =>
                                  finishedEditTodo(todo.id, "description", e)
                                }
                                onEditMode={() =>
                                  editTodo(
                                    todo.id,
                                    "description",
                                    todo.description
                                  )
                                }
                                onChange={(e) =>
                                  handleTodoChange(todo.id, "description", e)
                                }
                                readonly={todo.isLocked}
                              />
                            </div>
                            <button onClick={() => confirmAndDeleteTodo(todo.id)} className="delete-button">Delete</button>
                            </div>
                          <div className="todo-text-duo-date">
                            <label className="todo-title">Due:</label>
                            <div
                              className={`todo-due-date ${
                                isOverdue ? "overdue" : "ontime"
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