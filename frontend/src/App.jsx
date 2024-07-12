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

  const addRow = async () => {
    const dataToSend = {
      title: newTitle,
      description: newDescription,
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
                <th scope="col">Task ID (task_id)</th>
                <th scope="col">Title (title)</th>
                <th scope="col">Description (description)</th>
                <th scope="col">Created at (created_at)</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.task_id}>
                  <td>{row.task_id}</td>
                  <td>{row.title}</td>
                  <td>{row.description}</td>
                  <td>{row.created_at}</td>
                  <td>
                    <button className="btn btn-danger" onClick={() => deleteRow(row.task_id)}>
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
