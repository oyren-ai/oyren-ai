import React from 'react';

interface GraphConnectorProps {
    direction: 'left' | 'right';
    index: number;
}

const GraphConnector: React.FC<GraphConnectorProps> = ({ direction, index }) => (
    <div
        className="w-6 h-[2px] bg-foreground/40 animate-connector-draw shrink-0 self-center"
        style={{ animationDelay: `${index * 80 + 100}ms` }}
        data-testid={`connector-${direction}-${index}`}
    />
);

export default GraphConnector;
