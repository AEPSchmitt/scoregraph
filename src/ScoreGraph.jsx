import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
} from 'chart.js';

// Registering components needed for Chart.js
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend);

const ScoreGraph = () => {
  const [players, setPlayers] = useState([]); // Track players (lines on the graph)
  const [firstPlayerTime, setFirstPlayerTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0); // Time in seconds since load/reset
  const [nextPlayerId, setNextPlayerId] = useState(1); // Unique ID for new players
  const startTimeRef = useRef(Date.now()); // Reference for the start/reset time

  // Add a new player
  const addPlayer = () => {
    const playerName = prompt('Enter player name:');
    if (playerName) {
      const currentElapsedTime = Math.floor(
        (Date.now() - startTimeRef.current) / 1000
      );

      // If it's the first player being added, set the first player time
      if (firstPlayerTime === null) {
        setFirstPlayerTime(currentElapsedTime);
      }

      setPlayers(prev => [
        ...prev,
        {
          id: nextPlayerId,
          name: playerName,
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
          dataPoints: [[currentElapsedTime, 0]], // Initial data point at (elapsedTime, 0)
          yValue: 0,
        },
      ]);
      setNextPlayerId(nextPlayerId + 1);
    }
  };

  // Remove a player
  const removePlayer = id => {
    setPlayers(prev => prev.filter(player => player.id !== id));
  };

  // Update all players with the current elapsed time as X value
  const updateAllPlayersWithTime = () => {
    const currentElapsedTime = Math.floor(
      (Date.now() - startTimeRef.current) / 1000
    );

    setPlayers(prev =>
      prev.map(player => ({
        ...player,
        dataPoints: [...player.dataPoints, [currentElapsedTime, player.yValue]], // Record the current Y value with the current elapsed time
      }))
    );

    setElapsedTime(currentElapsedTime); // Update the global elapsed time
  };

  // Increment player's Y-value and update all players' X-axis (time)
  const incrementPlayer = id => {
    setPlayers(prev =>
      prev.map(player => {
        if (player.id === id) {
          return { ...player, yValue: player.yValue + 1 };
        }
        return player;
      })
    );
    updateAllPlayersWithTime(); // Update time for all players when any increment occurs
  };

  // Decrement player's Y-value and update all players' X-axis (time)
  const decrementPlayer = id => {
    setPlayers(prev =>
      prev.map(player => {
        if (player.id === id) {
          return { ...player, yValue: player.yValue - 1 };
        }
        return player;
      })
    );
    updateAllPlayersWithTime(); // Update time for all players when any decrement occurs
  };

  // Handle color change for a player
  const changePlayerColor = (id, newColor) => {
    setPlayers(prev =>
      prev.map(player => {
        if (player.id === id) {
          return { ...player, color: newColor };
        }
        return player;
      })
    );
  };

  // Global reset
  const resetAllPlayers = () => {
    setPlayers(prev =>
      prev.map(player => ({
        ...player,
        yValue: 0,
        dataPoints: [[firstPlayerTime !== null ? firstPlayerTime : 0, 0]], // Reset to initial point
      }))
    );
    startTimeRef.current = Date.now(); // Reset the time reference
    setElapsedTime(0);
    setFirstPlayerTime(null); // Reset first player time on reset
  };

  // Function to export graph data to JSON
  const exportToJson = () => {
    const exportData = {
      elapsedTime,
      players: players.map(player => ({
        id: player.id,
        name: player.name,
        color: player.color,
        dataPoints: player.dataPoints,
      })),
    };

    const jsonString = JSON.stringify(exportData, null, 2); // Formatting JSON nicely
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Creating a link to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph_data.json'; // File name
    a.click();
    URL.revokeObjectURL(url); // Clean up
  };

  // Automatic update for all players every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      updateAllPlayersWithTime(); // Add current value for all players to the graph
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000)); // Update elapsed time
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  // Prepare data for the graph (one line per player)
  const graphData = {
    labels: Array.from({ length: elapsedTime + 1 }, (_, i) => i),
    datasets: players.map(player => ({
      label: player.name,
      data: player.dataPoints,
      borderColor: player.color,
      fill: false,
      tension: 0.1,
      spanGaps: true,
    })),
  };

  const graphOptions = {
    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: 'Time (seconds)',
        },
        min: firstPlayerTime !== null ? firstPlayerTime : 0,
        max: elapsedTime,
      },
      y: {
        title: {
          display: true,
          text: 'Y Value',
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ width: '800px', margin: '0 auto' }}>
      <p style={{ margin: '20px' }}>Elapsed Time: {elapsedTime} seconds</p>
      {/* Line Graph */}
      <Line data={graphData} options={graphOptions} />

      {/* Player Controls */}
      {players.map(player => (
        <div key={player.id} style={{ marginTop: '20px', textAlign: 'center' }}>
          {/* Display player name and current Y-value */}
          <h4 style={{ color: player.color }}>{player.name}</h4>
          <p style={{ color: player.color }}>{player.yValue}</p>
          <button
            onClick={() => incrementPlayer(player.id)}
            style={{
              backgroundColor: player.color,
              color: '#fff',
              border: 'none',
              padding: '10px',
              marginRight: '5px',
            }}
          >
            +1
          </button>
          <button
            onClick={() => decrementPlayer(player.id)}
            style={{
              backgroundColor: player.color,
              color: '#fff',
              border: 'none',
              padding: '10px',
              marginLeft: '5px',
            }}
          >
            -1
          </button>

          {/* Color Picker Input */}
          <input
            type='color'
            value={player.color}
            onChange={e => changePlayerColor(player.id, e.target.value)}
            style={{ marginLeft: '10px' }}
          />

          <button
            onClick={() => removePlayer(player.id)}
            style={{ marginLeft: '10px', color: 'red' }}
          >
            Remove Player
          </button>
        </div>
      ))}

      {/* Global Controls */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button onClick={addPlayer}>Add Player</button>
        <button onClick={resetAllPlayers} style={{ marginLeft: '10px' }}>
          Reset All
        </button>
        <button onClick={exportToJson} style={{ marginLeft: '10px' }}>
          Export Data to JSON
        </button>
      </div>
    </div>
  );
};

export default ScoreGraph;
