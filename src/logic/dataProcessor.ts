import type { User, Friendship, TreeNode } from './types';


const SOURCE_COLORS: Record<string, string> = {
    'link': '#2196F3', // Blue
    'playmarket': '#9E9E9E', // Grey
    'default': '#9E9E9E'
};

export function processData(users: User[], friendships: Friendship[]): TreeNode[] {
    const userMap = new Map<number, TreeNode>();

    // Initialize nodes
    users.forEach(u => {
        userMap.set(u.user_id, {
            user_id: u.user_id,
            source: u.source || '',
            color: SOURCE_COLORS['default'], // Temporary default
            children: [],
            parent_id: null
        });
    });

    // Determine parents
    // For each user, find their earliest friendship
    // We assume friendships are bidirectional in the DB but we need to find "who did this user add first"
    // OR "who added this user first"?
    // "родителем считается тот с кем другой пользователь первым подружился" -> Parent is the one whom the user friended first.
    // So we look at all friendships involving User A. The one with earliest created_at is the parent.

    // Let's group friendships by user. 
    // Note: Friendship {user_id, friend_id}. Does it imply user_id added friend_id? 
    // Usually yes. If it's undirected, we'd have two rows or check both. 
    // Let's assume the input list contains (A, B) and (B, A) if it's fully bidirectional, 
    // or we treat (A, B) as "A is friends with B".
    // The prompt says "users and friendship". 
    // Let's assume we check all connections for a user.

    const friendshipsByUser = new Map<number, Friendship[]>();

    friendships.forEach(f => {
        if (!friendshipsByUser.has(f.user_id)) friendshipsByUser.set(f.user_id, []);
        friendshipsByUser.get(f.user_id)?.push(f);

        // We do NOT add the reverse edge. We assume user_id is the one who added friend_id.
        // "Parent is the one with whom the other user first became friends."
        // If A added B, B is likely the reason A is here (or A found B). B is parent.
        // If we treat it as undirected, we get cycles.
        // So we only consider the explicit direction in the data.
    });

    userMap.forEach((node, userId) => {
        const userFriendships = friendshipsByUser.get(userId) || [];
        if (userFriendships.length === 0) return;

        // Sort by created_at ascending
        userFriendships.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        // The first friend is the parent
        const firstFriendship = userFriendships[0];
        const parentId = firstFriendship.friend_id;

        // Check if parent exists in our set (it should)
        if (userMap.has(parentId)) {
            // Cycle detection? A adds B first, B adds A first.
            // If A.created_at < B.created_at, maybe A is parent?
            // Simple rule: If A considers B parent, and B considers A parent, break tie by user ID or creation time?
            // Or just allow one.
            // Let's just assign parent. We'll fix cycles or multi-roots later.
            // Actually, a tree cannot have cycles.
            // If A is parent of B, B cannot be parent of A.
            // If both added each other first (simultaneously?), pick one.

            // Let's add a check: don't assign parent if that parent already considers this node their parent.
            const parentNode = userMap.get(parentId)!;
            if (parentNode.parent_id !== userId) {
                node.parent_id = parentId;
                parentNode.children.push(node);
            }
        }
    });

    // Color propagation
    // We need to traverse from roots down.
    // Roots are nodes with no parent (parent_id === null).

    const roots = Array.from(userMap.values()).filter(n => n.parent_id === null);

    function assignColor(node: TreeNode, inheritedColor: string) {
        // Determine own color
        if (node.source && SOURCE_COLORS[node.source]) {
            node.color = SOURCE_COLORS[node.source];
        } else {
            node.color = inheritedColor;
        }

        // Propagate to children
        node.children.forEach(child => assignColor(child, node.color));
    }

    roots.forEach(root => {
        // If root has no source, use default.
        const startColor = (root.source && SOURCE_COLORS[root.source]) ? SOURCE_COLORS[root.source] : SOURCE_COLORS['default'];
        root.color = startColor;
        // Re-assign to self to ensure logic consistency if needed, but mainly for children
        root.children.forEach(child => assignColor(child, root.color));
    });

    return roots;
}
