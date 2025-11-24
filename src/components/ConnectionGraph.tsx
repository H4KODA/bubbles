import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as d3 from 'd3';
import type { TreeNode } from '../logic/types';

interface ConnectionGraphProps {
    data: TreeNode[];
}

export interface ConnectionGraphHandle {
    zoomIn: () => void;
    zoomOut: () => void;
    reset: () => void;
}

export const ConnectionGraph = forwardRef<ConnectionGraphHandle, ConnectionGraphProps>(({ data }, ref) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

    useImperativeHandle(ref, () => ({
        zoomIn: () => {
            if (svgRef.current && zoomRef.current) {
                d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 1.2);
            }
        },
        zoomOut: () => {
            if (svgRef.current && zoomRef.current) {
                d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 0.8);
            }
        },
        reset: () => {
            if (svgRef.current && zoomRef.current) {
                d3.select(svgRef.current).transition().call(zoomRef.current.transform, d3.zoomIdentity);
            }
        }
    }));

    useEffect(() => {
        if (!data || data.length === 0 || !svgRef.current) return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .style('background', 'transparent'); // Background handled by CSS

        svg.selectAll('*').remove(); // Clear previous

        // Definitions for gradients and filters
        const defs = svg.append('defs');

        // Glow filter
        const filter = defs.append('filter')
            .attr('id', 'glow');
        filter.append('feGaussianBlur')
            .attr('stdDeviation', '2.5')
            .attr('result', 'coloredBlur');
        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        // Blue Gradient (Link)
        const blueGradient = defs.append('radialGradient')
            .attr('id', 'grad-blue')
            .attr('cx', '30%')
            .attr('cy', '30%')
            .attr('r', '70%');
        blueGradient.append('stop').attr('offset', '0%').attr('stop-color', '#60a5fa'); // light blue
        blueGradient.append('stop').attr('offset', '100%').attr('stop-color', '#2563eb'); // dark blue

        // Grey Gradient (Other)
        const greyGradient = defs.append('radialGradient')
            .attr('id', 'grad-grey')
            .attr('cx', '30%')
            .attr('cy', '30%')
            .attr('r', '70%');
        greyGradient.append('stop').attr('offset', '0%').attr('stop-color', '#94a3b8'); // light grey
        greyGradient.append('stop').attr('offset', '100%').attr('stop-color', '#475569'); // dark grey

        const g = svg.append('g');
        gRef.current = g;

        // Zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom);
        zoomRef.current = zoom;

        // Flatten the tree
        const nodes: any[] = [];
        const links: any[] = [];

        function traverse(node: TreeNode) {
            nodes.push({ id: node.user_id, ...node });
            if (node.children) {
                node.children.forEach(child => {
                    links.push({ source: node.user_id, target: child.user_id });
                    traverse(child);
                });
            }
        }

        data.forEach(root => traverse(root));

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id((d: any) => d.id).distance(60))
            .force('charge', d3.forceManyBody().strength(-150))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collide', d3.forceCollide().radius(25));

        const link = g.append('g')
            .attr('stroke', '#94a3b8')
            .attr('stroke-opacity', 0.2)
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke-width', 1);

        const node = g.append('g')
            .selectAll('circle')
            .data(nodes)
            .join('circle')
            .attr('r', 12)
            .attr('fill', (d: any) => {
                // Map hex color to gradient ID if possible, or just use color
                // Our logic produces specific hexes.
                if (d.color === '#2196F3') return 'url(#grad-blue)';
                return 'url(#grad-grey)';
            })
            .attr('filter', 'url(#glow)')
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5)
            .attr('stroke-opacity', 0.5)
            .style('cursor', 'grab')
            .call(d3.drag<SVGCircleElement, any>()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended) as any);

        // Hover effects
        node.on('mouseover', function (this: any, _event, d: any) {
            d3.select(this).transition().duration(200).attr('r', 16);

            // Highlight connections
            link.transition().duration(200)
                .attr('stroke-opacity', (l: any) => (l.source.id === d.id || l.target.id === d.id) ? 0.8 : 0.1)
                .attr('stroke-width', (l: any) => (l.source.id === d.id || l.target.id === d.id) ? 2 : 1);
        })
            .on('mouseout', function (this: any) {
                d3.select(this).transition().duration(200).attr('r', 12);
                link.transition().duration(200).attr('stroke-opacity', 0.2).attr('stroke-width', 1);
            });

        node.append('title')
            .text((d: any) => `User ${d.id} (${d.source || 'inherited'})`);

        simulation.on('tick', () => {
            link
                .attr('x1', (d: any) => d.source.x)
                .attr('y1', (d: any) => d.source.y)
                .attr('x2', (d: any) => d.target.x)
                .attr('y2', (d: any) => d.target.y);

            node
                .attr('cx', (d: any) => d.x)
                .attr('cy', (d: any) => d.y);
        });

        function dragstarted(this: any, event: any) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
            d3.select(this).style('cursor', 'grabbing');
        }

        function dragged(event: any) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(this: any, event: any) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
            d3.select(this).style('cursor', 'grab');
        }

    }, [data]);

    return <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
});

ConnectionGraph.displayName = 'ConnectionGraph';
