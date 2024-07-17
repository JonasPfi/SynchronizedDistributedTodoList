import React, { useEffect, useState } from 'react';
import axios from 'axios';
import socketIO from 'socket.io-client';

const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:8080';

const socket = socketIO.connect(URL);

function App() {
  const [tableData, setTableData] = useState([]);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // SocketIO events
  useEffect(() => {
    loadTableData();
    socket.on('refreshTableData', () => {
      console.log('Received broadcast: refreshTableData');
      loadTableData();
    });
  }, []);

  // Loads table data with backend call
  const loadTableData = async () => {
    try {
      const response = await axios.get(`${URL}/database`);
      setTableData(response.data);
    } catch (error) {
      console.error('Error loading data', error);
    }
  };

  const showErrorAlert = (message) => {
    setAlertMessage(message);
    setAlertType('danger');
  };

  const showSuccessAlert = (message) => {
    setAlertMessage(message);
    setAlertType('success');
  };

  // Deletes row in table with backend call
  const deleteRow = async (id) => {
    try {
      await axios.delete(`${URL}/database/${id}`);
      showSuccessAlert(`Successfully deleted item: ${id}`);
      loadTableData();
    } catch (error) {
      console.error('Error deleting item', error);
      showErrorAlert(`ERROR on deleted item: ${id}; Message from server: ${error.response.data}`);
    }
  };

  // Adds row to the table with backend call
  const addRow = async () => {
    const dataToSend = {
      title: newTitle,
      description: newDescription,
      category: 1, //For testing magic num
      dueDate: "2024-07-31", //For testing magic num
    };

    try {
      await axios.post(`${URL}/database`, dataToSend);
      showSuccessAlert(`Successfully added item with title: ${newTitle}`);
      loadTableData();
    } catch (error) {
      console.error('Error adding item', error);
      showErrorAlert(`ERROR on adding new item - message from server: ${error.response.data}`);
    }
  };

  // basic table with interaction buttons
  return (
    <main role="main" className="container">
      <h1>Database</h1>

      <h2>Values from 'table1'</h2>
      <button type="button" onClick={loadTableData} className="btn btn-primary">
        Manual refresh
      </button>
      <br /><br />
      <div id="target">
        {tableData.length > 0 ? (
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th scope="col">Todo ID (todo_id)</th>
                <th scope="col">Title (todo_title)</th>
                <th scope="col">Description (todo_description)</th>
                <th scope="col">Created at (todo_due_date)</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.todo_id}>
                  <td>{row.todo_id}</td>
                  <td>{row.todo_title}</td>
                  <td>{row.todo_description}</td>
                  <td>{row.todo_due_date}</td>
                  <td>
                    <button className="btn btn-danger" onClick={() => deleteRow(row.todo_id)}>
                      DELETE
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td></td>
                <td>
                  <input
                    id="title"
                    type="text"
                    name="title"
                    className="form-control"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </td>
                <td>
                  <input
                    id="description"
                    type="text"
                    name="description"
                    className="form-control"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </td>
                <td></td>
                <td>
                  <button className="btn btn-success" onClick={addRow}>
                    ADD
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          'Loading please wait...'
        )}
      </div>

      {alertMessage && (
        <div id="alert" className={`alert alert-${alertType}`} role="alert">
          {alertMessage}
        </div>
      )}

      <div className="alert alert-info" role="alert">
        More information here:{' '}
        <a href="https://github.com/benjamin-salchow/verteilte-systeme-projekte/blob/master/node-client-server-extended-with-database/README.md">
          https://github.com/benjamin-salchow/verteilte-systeme-projekte/blob/master/node-client-server-extended-with-database/README.md
        </a>
      </div>
    </main>
  );
}

export default App;
