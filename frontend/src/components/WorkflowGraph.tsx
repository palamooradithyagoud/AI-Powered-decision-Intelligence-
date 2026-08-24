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
    const colWidth = 250;
    const rowHeight = 120;

    phases.forEach((phase, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);

      const isBuffer = phase.phase_name.toLowerCase().includes("buffer");
      const isQA = phase.phase_name.toLowerCase().includes("testing") || phase.phase_name.toLowerCase().includes("qa");
      const isDeploy = phase.phase_name.toLowerCase().includes("deploy");

      let borderClr = "border-indigo-200";
      let bgClr = "bg-white";
      let badgeClr = "bg-indigo-50 text-[#4f46e5]";

      if (isBuffer) {
        borderClr = "border-emerald-200";
        badgeClr = "bg-emerald-50 text-emerald-700";
      } else if (isQA) {
        borderClr = "border-amber-200";
        badgeClr = "bg-amber-50 text-amber-700";
      } else if (isDeploy) {
        borderClr = "border-purple-200";
        badgeClr = "bg-purple-50 text-purple-700";
      }

      generatedNodes.push({
        id: `node-${index}`,
        position: { x: col * colWidth + 40, y: row * rowHeight + 40 },
        data: {
          label: (
            <div className={`p-3.5 rounded-2xl border ${borderClr} ${bgClr} text-left shadow-sm min-w-[210px]`}>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Phase {index + 1}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${badgeClr}`}>
                  {phase.duration_days}d
                </span>
              </div>
              <div className="font-bold text-slate-900 text-xs truncate">
                {phase.phase_name}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-medium">
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
          style: { stroke: "#6366f1", strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#6366f1",
          },
        });
      }
    });

    return { nodes: generatedNodes, edges: generatedEdges };
  }, [phases]);

  return (
    <div className="h-[420px] w-full rounded-2xl border border-slate-200 bg-[#f8fafc] overflow-hidden relative shadow-sm font-sans">
      <div className="absolute top-3 left-3 z-10 rounded-xl bg-white/90 px-3.5 py-1.5 border border-slate-200 text-[11px] text-slate-600 shadow-xs backdrop-blur-md">
        <span className="font-bold text-slate-900">Execution Architecture Graph</span> • Drag or zoom to explore
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        attributionPosition="bottom-right"
        className="bg-transparent"
      >
        <Background color="#cbd5e1" gap={16} />
        <Controls className="bg-white border border-slate-200 text-slate-800 fill-slate-800 shadow-sm rounded-xl" />
        <MiniMap
          nodeColor="#6366f1"
          maskColor="rgba(241, 245, 249, 0.7)"
          className="bg-white border border-slate-200 rounded-xl shadow-sm"
        />
      </ReactFlow>
    </div>
  );
}
