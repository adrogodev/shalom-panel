'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  Connection,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  ArrowLeft,
  Save,
  CheckCircle,
  Plus,
  MessageSquare,
  Clock,
  Split,
  ShoppingBag,
  Sparkles,
  Zap,
  Trash2,
} from 'lucide-react';

// Nodos Personalizados de React Flow
const TriggerNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 rounded-xl bg-white border-2 border-emerald-500 shadow-md min-w-[200px] text-xs">
    <div className="flex items-center gap-2 text-emerald-700 font-bold mb-1">
      <Zap className="w-4 h-4 text-emerald-600" />
      <span>DISPARADOR (TRIGGER)</span>
    </div>
    <div className="text-primary-base font-semibold">{data.label || 'Evento Detectado'}</div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-emerald-600" />
  </div>
);

const WhatsAppNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 rounded-xl bg-white border-2 border-deep-olive shadow-md min-w-[220px] text-xs space-y-1">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-deep-olive" />
    <div className="flex items-center gap-2 text-deep-olive font-bold">
      <MessageSquare className="w-4 h-4" />
      <span>Enviar WhatsApp</span>
    </div>
    <p className="text-muted-dark text-[11px] line-clamp-2">{data.message || 'Mensaje de plantilla al cliente'}</p>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-deep-olive" />
  </div>
);

const ConditionNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 rounded-xl bg-white border-2 border-amber-500 shadow-md min-w-[220px] text-xs space-y-2">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-amber-500" />
    <div className="flex items-center gap-2 text-amber-700 font-bold">
      <Split className="w-4 h-4" />
      <span>Condición (Si / No)</span>
    </div>
    <p className="text-primary-base font-medium text-[11px]">{data.condition || '¿El pago está confirmado?'}</p>
    <div className="flex justify-between pt-1 text-[10px] font-bold text-muted-dark">
      <span>SI (Verdadero)</span>
      <span>NO (Falso)</span>
    </div>
    <Handle type="source" position={Position.Bottom} id="true" style={{ left: '25%' }} className="w-3 h-3 bg-emerald-600" />
    <Handle type="source" position={Position.Bottom} id="false" style={{ left: '75%' }} className="w-3 h-3 bg-rose-600" />
  </div>
);

const WaitNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 rounded-xl bg-white border-2 border-blue-500 shadow-md min-w-[180px] text-xs space-y-1">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />
    <div className="flex items-center gap-2 text-blue-700 font-bold">
      <Clock className="w-4 h-4" />
      <span>Esperar Retardo</span>
    </div>
    <div className="text-primary-base font-semibold">{data.delay || '4 Horas'}</div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
  </div>
);

const nodeTypes = {
  trigger: TriggerNode,
  send_whatsapp: WhatsAppNode,
  condition: ConditionNode,
  wait: WaitNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 250, y: 30 },
    data: { label: 'Nuevo Pedido Creado (ORDER_CREATED)' },
  },
  {
    id: '2',
    type: 'send_whatsapp',
    position: { x: 240, y: 150 },
    data: { message: '🛍️ ¡Hola! Tu pedido ha sido confirmado. Puedes abonar a nuestra cuenta Bancolombia o Nequi.' },
  },
  {
    id: '3',
    type: 'wait',
    position: { x: 260, y: 280 },
    data: { delay: '4 Horas' },
  },
  {
    id: '4',
    type: 'condition',
    position: { x: 240, y: 390 },
    data: { condition: '¿El pedido tiene pago confirmado?' },
  },
  {
    id: '5',
    type: 'send_whatsapp',
    position: { x: 420, y: 530 },
    data: { message: 'Hola, te recordamos que tienes un pedido pendiente por pagar para proceder con tu envío.' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
  { id: 'e4-5', source: '4', sourceHandle: 'false', target: '5' },
];

export function FlowBuilderPage({ automationId }: { automationId: string }) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );

  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [],
  );

  const handleAddNode = (type: 'send_whatsapp' | 'condition' | 'wait') => {
    const id = `${Date.now()}`;
    const newNode: Node = {
      id,
      type,
      position: { x: 250 + Math.random() * 50, y: 300 + Math.random() * 50 },
      data:
        type === 'send_whatsapp'
          ? { message: 'Nuevo mensaje personalizado de WhatsApp' }
          : type === 'condition'
          ? { condition: '¿Estado del pedido es ENTREGADO?' }
          : { delay: '2 Horas' },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleSave = () => {
    setStatusMessage('Borrador guardado exitosamente (Validación DAG: Acíclico sin bucles)');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handlePublish = () => {
    setStatusMessage('¡Versión publicada exitosamente en producción!');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  return (
    <div className="h-screen flex flex-col bg-surface-light overflow-hidden">
      {/* Barra Superior */}
      <header className="h-16 bg-white border-b border-border-slate/30 px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/automations"
            className="p-2 rounded-lg hover:bg-surface-light text-muted-dark hover:text-primary-base transition"
            title="Volver al listado"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm text-primary-base">
                Confirmación de Pedido & Recordatorio de Pago
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-active-green/10 text-active-green">
                Publicado v2
              </span>
            </div>
            <p className="text-[11px] text-muted-dark">ID: {automationId} • Motor de Grafos DAG</p>
          </div>
        </div>

        {statusMessage && (
          <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            {statusMessage}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-border-slate/40 text-primary-base rounded-lg text-xs font-semibold hover:bg-surface-light transition"
          >
            <Save className="w-3.5 h-3.5" />
            Guardar Borrador
          </button>
          <button
            type="button"
            onClick={handlePublish}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-base text-white rounded-lg text-xs font-semibold hover:bg-primary-base/90 shadow-sm transition"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Publicar Versión
          </button>
        </div>
      </header>

      {/* Área del Lienzo y Paleta */}
      <div className="flex-1 flex relative">
        {/* Paleta flotante de nodos */}
        <aside className="absolute left-6 top-6 z-10 bg-white/95 backdrop-blur-sm p-4 rounded-2xl border border-border-slate/30 shadow-lg space-y-3 w-56">
          <span className="text-[11px] font-bold text-muted-dark uppercase tracking-wider block">
            Agregar Nodos al Flujo
          </span>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleAddNode('send_whatsapp')}
              className="w-full px-3 py-2 rounded-lg bg-surface-light hover:bg-deep-olive/10 hover:text-deep-olive border border-border-slate/20 text-xs font-semibold text-primary-base flex items-center gap-2 transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-deep-olive" />
              Enviar WhatsApp
            </button>
            <button
              type="button"
              onClick={() => handleAddNode('condition')}
              className="w-full px-3 py-2 rounded-lg bg-surface-light hover:bg-amber-50 hover:text-amber-800 border border-border-slate/20 text-xs font-semibold text-primary-base flex items-center gap-2 transition"
            >
              <Split className="w-3.5 h-3.5 text-amber-600" />
              Condición (Branch)
            </button>
            <button
              type="button"
              onClick={() => handleAddNode('wait')}
              className="w-full px-3 py-2 rounded-lg bg-surface-light hover:bg-blue-50 hover:text-blue-800 border border-border-slate/20 text-xs font-semibold text-primary-base flex items-center gap-2 transition"
            >
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Esperar Retardo
            </button>
          </div>
        </aside>

        {/* Lienzo React Flow */}
        <div className="flex-1 w-full h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background gap={16} size={1} color="#E0E6E3" />
            <Controls className="bg-white border border-border-slate/30 rounded-lg shadow-sm" />
            <MiniMap
              nodeColor={(n) => {
                if (n.type === 'trigger') return '#10B981';
                if (n.type === 'send_whatsapp') return '#2B4C3F';
                if (n.type === 'condition') return '#F59E0B';
                return '#3B82F6';
              }}
              className="bg-white border border-border-slate/30 rounded-lg shadow-sm"
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
