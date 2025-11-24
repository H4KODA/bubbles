import { useMemo, useRef } from 'react';
import './App.css';
import { ConnectionGraph } from './components/ConnectionGraph';
import type { ConnectionGraphHandle } from './components/ConnectionGraph';
import { UIOverlay } from './components/UIOverlay';
import { processData } from './logic/dataProcessor';
import type { User, Friendship } from './logic/types';

function App() {
  const graphRef = useRef<ConnectionGraphHandle>(null);

  const { users, friendships } = useMemo(() => {
    // Generate mock data
    const users: User[] = [];
    const friendships: Friendship[] = [];

    // Create a few roots
    const rootCount = 8;
    for (let i = 1; i <= rootCount; i++) {
      users.push({
        user_id: i,
        source: i % 2 === 0 ? 'link' : 'playmarket'
      });
    }

    // Create children
    let currentId = rootCount + 1;
    const layers = 5;
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

  // Calculate stats
  const stats = useMemo(() => {
    let maxDepth = 0;
    function traverse(node: any, depth: number) {
      maxDepth = Math.max(maxDepth, depth);
      if (node.children) node.children.forEach((c: any) => traverse(c, depth + 1));
    }
    treeData.forEach(root => traverse(root, 1));
    return {
      totalUsers: users.length,
      maxDepth
    };
  }, [treeData, users.length]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <ConnectionGraph ref={graphRef} data={treeData} />
      <UIOverlay
        onZoomIn={() => graphRef.current?.zoomIn()}
        onZoomOut={() => graphRef.current?.zoomOut()}
        onReset={() => graphRef.current?.reset()}
        stats={stats}
      />
    </div>
  );
}

export default App;
