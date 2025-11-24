import { processData } from './dataProcessor';
import type { User, Friendship } from './types';
import { expect, test, describe } from 'vitest'; // Assuming vitest or jest

describe('processData', () => {
    test('builds a simple tree and propagates colors', () => {
        const users: User[] = [
            { user_id: 1, source: 'link' }, // Root, Blue
            { user_id: 2 }, // Child of 1
            { user_id: 3, source: 'playmarket' }, // Child of 1, but overrides to Grey
            { user_id: 4 } // Child of 3, inherits Grey
        ];

        const friendships: Friendship[] = [
            { user_id: 2, friend_id: 1, created_at: '2023-01-02T10:00:00Z' }, // 2 added 1 first
            { user_id: 3, friend_id: 1, created_at: '2023-01-03T10:00:00Z' }, // 3 added 1 first
            { user_id: 4, friend_id: 3, created_at: '2023-01-04T10:00:00Z' }, // 4 added 3 first
        ];

        const roots = processData(users, friendships);

        expect(roots.length).toBe(1);
        const root = roots[0];
        expect(root.user_id).toBe(1);
        expect(root.color).toBe('#2196F3'); // Blue

        expect(root.children.length).toBe(2);

        const child2 = root.children.find(c => c.user_id === 2);
        expect(child2).toBeDefined();
        expect(child2?.color).toBe('#2196F3'); // Inherited Blue

        const child3 = root.children.find(c => c.user_id === 3);
        expect(child3).toBeDefined();
        expect(child3?.color).toBe('#9E9E9E'); // Overridden Grey

        const child4 = child3?.children[0];
        expect(child4).toBeDefined();
        expect(child4?.user_id).toBe(4);
        expect(child4?.color).toBe('#9E9E9E'); // Inherited Grey from 3
    });

    test('handles cycles by ignoring second edge', () => {
        const users: User[] = [
            { user_id: 1 },
            { user_id: 2 }
        ];
        // 1 adds 2, 2 adds 1. Who is parent?
        // 1 adds 2 at T1. 2 adds 1 at T2.
        // For 1: first friend is 2. Parent -> 2.
        // For 2: first friend is 1. Parent -> 1.
        // Cycle!
        // Logic should prevent infinite loop or double parent assignment.

        const friendships: Friendship[] = [
            { user_id: 1, friend_id: 2, created_at: '2023-01-01T10:00:00Z' },
            { user_id: 2, friend_id: 1, created_at: '2023-01-02T10:00:00Z' }
        ];

        const roots = processData(users, friendships);
        // In current logic:
        // 1 sees 2 as parent.
        // 2 sees 1 as parent.
        // If 1 is processed first, 1.parent = 2. 2.children.push(1).
        // Then 2 is processed. 2 sees 1. 1.parent is 2. 
        // The check `if (parentNode.parent_id !== userId)` prevents 2 from taking 1 as parent if 1 already took 2.

        // So one should be root, one child.
        expect(roots.length).toBe(1);
    });
});
