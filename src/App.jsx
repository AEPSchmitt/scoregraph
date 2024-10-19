import React from 'react';
import ScoreGraph from './ScoreGraph';

export function App(props) {
  return (
    <div className='App'>
      <h1>Quickgraphs</h1>
      <ScoreGraph /> {/* Add the graph component here */}
    </div>
  );
}