import React, { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch("http://localhost:8080/api")
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setMessage(data.message);
      })
      .catch(error => console.error('Error:', error));
  }, []);

  return (
    <div>
      <h1>Message from Server:</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;