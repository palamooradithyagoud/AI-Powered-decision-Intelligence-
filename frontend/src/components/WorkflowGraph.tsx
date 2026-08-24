"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Position,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { PhaseTimeline } from "@/types";

interface WorkflowGraphProps {
  phases: PhaseTimeline[];
}

export default function WorkflowGraph({ phases }: WorkflowGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];

    // Layout configuration: multi-column workflow
    const colWidth = 240;
    const rowHeight = 110;

    phases.forEach((phase, index) => {
      // Calculate column and row for clean DAG visualization
      const col = index % 3;
      const row = Math.floor(index / 3);

      const isBuffer = phase.phase_name.toLowerCase().includes("buffer");
      const isQA = phase.phase_name.toLowerCase().includes("testing") || phase.phase_name.toLowerCase().includes("qa");
      const isDeploy = phase.phase_name.toLowerCase().includes("deploy");

      let borderClr = "border-blue-500/50";
      let bgClr = "bg-slate-900/90";
      let badgeClr = "bg-blue-500/20 text-blue-300";

      if (isBuffer) {
        borderClr = "border-emerald-500/50";
        badgeClr = "bg-emerald-500/20 text-emerald-300";
      } else if (isQA) {
        borderClr = "border-amber-500/50";
        badgeClr = "bg-amber-500/20 text-amber-300";
      } else if (isDeploy) {
        borderClr = "border-indigo-500/50";
        badgeClr = "bg-indigo-500/20 text-indigo-300";
      }

      generatedNodes.push({
        id: `node-${index}`,
        position: { x: col * colWidth + 40, y: row * rowHeight + 40 },
        data: {
          label: (
            <div className={`p-3 rounded-xl border ${borderClr} ${bgClr} text-left shadow-lg backdrop-blur-md min-w-[200px]`}>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Phase {index + 1}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${badgeClr}`}>
                  {phase.duration_days}d
                </span>
              </div>
              <div className="font-bold text-white text-xs truncate">
                {phase.phase_name}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Days {phase.start_day} → {phase.end_day}
              </div>
            </div>
          ),
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });

      // Connect sequential dependencies
      if (index > 0) {
        generatedEdges.push({
          id: `edge-${index - 1}-${index}`,
          source: `node-${index - 1}`,
          target: `node-${index}`,
          animated: true,
          style: { stroke: "#3b82f6", strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#3b82f6",
          },
        });
      }
    });

    return { nodes: generatedNodes, edges: generatedEdges };
  }, [phases]);

  return (
    <div className="h-[420px] w-full rounded-xl border border-slate-800 bg-[#070b14] overflow-hidden relative shadow-inner">
      <div className="absolute top-3 left-3 z-10 rounded-lg bg-slate-900/80 px-3 py-1.5 border border-slate-800 text-[11px] text-slate-400 backdrop-blur-md">
        <span className="font-semibold text-slate-200">Interactive Execution Architecture Graph</span> • Drag or zoom to explore
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        attributionPosition="bottom-right"
        className="bg-transparent"
      >
        <Background color="#1e293b" gap={16} />
        <Controls className="bg-slate-900 border border-slate-800 text-white fill-white" />
        <MiniMap
          nodeColor="#3b82f6"
          maskColor="rgba(11, 15, 25, 0.7)"
          className="bg-slate-950 border border-slate-800 rounded-lg"
        />
      </ReactFlow>
    </div>
  );
}
