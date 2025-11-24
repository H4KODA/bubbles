import React from 'react';

interface UIOverlayProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    stats: {
        totalUsers: number;
        maxDepth: number;
    };
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ onZoomIn, onZoomOut, onReset, stats }) => {
    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', padding: '24px' }}>
            {/* Header / Stats */}
            <div className="glass-panel" style={{
                position: 'absolute',
                top: '24px',
                left: '24px',
                padding: '16px 24px',
                pointerEvents: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
            }}>
                <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#fff' }}>User Connections</h1>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#94a3b8' }}>
                    <span>Total Users: <strong style={{ color: '#e2e8f0' }}>{stats.totalUsers}</strong></span>
                    <span>Max Depth: <strong style={{ color: '#e2e8f0' }}>{stats.maxDepth}</strong></span>
                </div>
            </div>

            {/* Legend */}
            <div className="glass-panel" style={{
                position: 'absolute',
                bottom: '24px',
                left: '24px',
                padding: '16px',
                pointerEvents: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Source</div>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#3b82f6', color: '#3b82f6' }}></div>
                    <span>Direct Link</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#94a3b8', color: '#94a3b8' }}></div>
                    <span>PlayMarket / Other</span>
                </div>
            </div>

            {/* Controls */}
            <div className="glass-panel" style={{
                position: 'absolute',
                bottom: '24px',
                right: '24px',
                padding: '12px',
                pointerEvents: 'auto',
                display: 'flex',
                gap: '8px'
            }}>
                <button className="control-btn" onClick={onZoomOut} title="Zoom Out">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <button className="control-btn" onClick={onReset} title="Reset View">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                </button>
                <button className="control-btn" onClick={onZoomIn} title="Zoom In">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
            </div>
        </div>
    );
};
