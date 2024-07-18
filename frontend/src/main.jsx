import React from 'react'
import ReactDOM from 'react-dom/client'
import Todo from './todolist.jsx';
import './css/todolist.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Todo />
  </React.StrictMode>,
)
