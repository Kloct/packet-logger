import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import './App.css';
import Main from './Layouts/main';

function App() {
  return (
    <Router>
      <div>
        <Route exact path="/" component={Main}/>
      </div>
    </Router>
  );
}

export default App;
