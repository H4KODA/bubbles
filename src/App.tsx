import { useMemo } from 'react';
import './App.css';
import { ConnectionGraph } from './components/ConnectionGraph';
import { processData } from './logic/dataProcessor';
import type { User, Friendship } from './logic/types';

function App() {
  const { users, friendships } = useMemo(() => {
    // Generate mock data
    const users: User[] = [];
    const friendships: Friendship[] = [];

    // Create a few roots
    const rootCount = 5;
    for (let i = 1; i <= rootCount; i++) {
      users.push({
        user_id: i,
        source: i % 2 === 0 ? 'link' : 'playmarket'
      });
    }

    // Create children
    let currentId = rootCount + 1;
    const layers = 4;
    let previousLayer = users.map(u => u.user_id);

    for (let l = 0; l < layers; l++) {
      const nextLayer: number[] = [];
      previousLayer.forEach(parentId => {
        // Each parent gets 0-3 children
        const childCount = Math.floor(Math.random() * 4);
        for (let c = 0; c < childCount; c++) {
          const childId = currentId++;
          users.push({ user_id: childId });
          nextLayer.push(childId);

          friendships.push({
            user_id: childId, // Child added parent
            friend_id: parentId,
            created_at: new Date().toISOString()
          });
        }
      });
      previousLayer = nextLayer;
    }

    return { users, friendships };
  }, []);

  const treeData = useMemo(() => processData(users, friendships), [users, friendships]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <ConnectionGraph data={treeData} />
    </div>
  );
}

export default App;
