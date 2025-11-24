import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { TreeNode } from '../logic/types';

interface ConnectionGraphProps {
    data: TreeNode[];
}

export const ConnectionGraph: React.FC<ConnectionGraphProps> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!data || data.length === 0 || !svgRef.current) return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .style('background-color', '#f0f0f0');

        svg.selectAll('*').remove(); // Clear previous

        const g = svg.append('g');

        // Zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4]) // Allow zooming out to see all, zooming in to see details
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom);

        // Flatten the tree for force simulation
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
            .force('link', d3.forceLink(links).id((d: any) => d.id).distance(50))
            .force('charge', d3.forceManyBody().strength(-100))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collide', d3.forceCollide().radius(20));

        const link = g.append('g')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .selectAll('line')
            .data(links)
            .join('line');

        const node = g.append('g')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5)
            .selectAll('circle')
            .data(nodes)
            .join('circle')
            .attr('r', 10)
            .attr('fill', (d: any) => d.color)
            .call(d3.drag<SVGCircleElement, any>()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended) as any);

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

        function dragstarted(event: any) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event: any) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event: any) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        // Initial zoom to fit?
        // For now, center is fine.

    }, [data]);

    return <svg ref={svgRef} />;
};
