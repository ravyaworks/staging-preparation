'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Select, Toggle } from '@conversation-platform/ui'
import { TriggerSelector } from './trigger-selector'
import { ActionSelector } from './action-selector'
import { X } from 'lucide-react'

interface WorkflowNode {
  id: string
  type: 'trigger' | 'action' | 'condition'
  subtype: string
  label: string
  config: Record<string, unknown>
}

interface WorkflowNodeEditorProps {
  node: WorkflowNode | null
  onSave: (node: WorkflowNode) => void
  onCancel: () => void
  onDelete: (nodeId: string) => void
}

const conditionOperators = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
]

export function WorkflowNodeEditor({ node, onSave, onCancel, onDelete }: WorkflowNodeEditorProps) {
  const [label, setLabel] = useState('')
  const [subtype, setSubtype] = useState('')
  const [config, setConfig] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (node) {
      setLabel(node.label)
      setSubtype(node.subtype)
      setConfig({ ...node.config })
    }
  }, [node])

  if (!node) { return null }

  const updateConfig = (key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const cfg = (key: string, fallback = ''): string => String(config[key] ?? fallback)

  const handleSave = () => {
    onSave({ ...node, label, subtype, config })
  }

  const renderTriggerConfig = () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Trigger Type</p>
        <TriggerSelector selected={subtype} onSelect={setSubtype} />
      </div>
      {subtype === 'schedule' && (
        <Input
          label="Cron Expression"
          value={cfg('cron')}
          onChange={(e) => updateConfig('cron', e.target.value)}
          placeholder="*/5 * * * *"
        />
      )}
      {subtype === 'webhook' && (
        <Input
          label="Webhook URL"
          value={cfg('webhookUrl')}
          onChange={(e) => updateConfig('webhookUrl', e.target.value)}
          placeholder="https://hooks.example.com/..."
        />
      )}
      {subtype === 'message_received' && (
        <>
          <Select
            label="Match Type"
            value={cfg('matchType', 'any')}
            onChange={(e) => updateConfig('matchType', e.target.value)}
            options={[
              { value: 'any', label: 'Any Message' },
              { value: 'keyword', label: 'Contains Keyword' },
              { value: 'pattern', label: 'Matches Pattern' },
            ]}
          />
          {config.matchType === 'keyword' && (
            <Input
              label="Keywords (comma separated)"
              value={cfg('keywords')}
              onChange={(e) => updateConfig('keywords', e.target.value)}
              placeholder="help, support, issue"
            />
          )}
        </>
      )}
    </div>
  )

  const renderActionConfig = () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Action Type</p>
        <ActionSelector selected={subtype} onSelect={setSubtype} />
      </div>
      {subtype === 'send_message' && (
        <>
          <Select
            label="Message Type"
            value={cfg('messageType', 'text')}
            onChange={(e) => updateConfig('messageType', e.target.value)}
            options={[
              { value: 'text', label: 'Text' },
              { value: 'template', label: 'Template' },
              { value: 'rich', label: 'Rich Card' },
            ]}
          />
          <Input
            label="Message Content"
            value={cfg('content')}
            onChange={(e) => updateConfig('content', e.target.value)}
            placeholder="Hello, how can I help you?"
          />
        </>
      )}
      {subtype === 'call_tool' && (
        <>
          <Input
            label="Tool Name"
            value={cfg('toolName')}
            onChange={(e) => updateConfig('toolName', e.target.value)}
            placeholder="get_weather"
          />
          <Input
            label="Parameters (JSON)"
            value={cfg('parameters')}
            onChange={(e) => updateConfig('parameters', e.target.value)}
            placeholder='{"city": "New York"}'
          />
        </>
      )}
      {subtype === 'run_workflow' && (
        <Input
          label="Target Workflow ID"
          value={cfg('targetWorkflowId')}
          onChange={(e) => updateConfig('targetWorkflowId', e.target.value)}
          placeholder="wf_..."
        />
      )}
      {subtype === 'transform_data' && (
        <>
          <Input
            label="Mapping (JSON)"
            value={cfg('mapping')}
            onChange={(e) => updateConfig('mapping', e.target.value)}
            placeholder='{"output": "{{input.field}}"}'
          />
        </>
      )}
      {subtype === 'http_request' && (
        <>
          <Select
            label="Method"
            value={cfg('method', 'GET')}
            onChange={(e) => updateConfig('method', e.target.value)}
            options={[
              { value: 'GET', label: 'GET' },
              { value: 'POST', label: 'POST' },
              { value: 'PUT', label: 'PUT' },
              { value: 'PATCH', label: 'PATCH' },
              { value: 'DELETE', label: 'DELETE' },
            ]}
          />
          <Input
            label="URL"
            value={cfg('url')}
            onChange={(e) => updateConfig('url', e.target.value)}
            placeholder="https://api.example.com/data"
          />
          <Input
            label="Headers (JSON)"
            value={cfg('headers')}
            onChange={(e) => updateConfig('headers', e.target.value)}
            placeholder='{"Authorization": "Bearer ..."}'
          />
        </>
      )}
    </div>
  )

  const renderConditionConfig = () => (
    <div className="space-y-4">
      <Input
        label="Field"
        value={cfg('field')}
        onChange={(e) => updateConfig('field', e.target.value)}
        placeholder="e.g. message.sentiment"
      />
      <Select
        label="Operator"
        value={cfg('operator', 'equals')}
        onChange={(e) => updateConfig('operator', e.target.value)}
        options={conditionOperators}
      />
      {!['is_empty', 'is_not_empty'].includes(config.operator as string) && (
        <Input
          label="Value"
          value={cfg('value')}
          onChange={(e) => updateConfig('value', e.target.value)}
          placeholder="e.g. positive"
        />
      )}
      <div className="flex items-center gap-2 pt-2">
        <Toggle
          checked={Boolean(config.continueOnFalse)}
          onChange={(checked) => updateConfig('continueOnFalse', checked)}
        />
        <span className="text-sm text-gray-600">Continue on false branch</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {node.type === 'trigger' ? 'Trigger' : node.type === 'condition' ? 'Condition' : 'Action'} Properties
        </h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      <Input
        label="Label"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Node label"
      />

      {node.type === 'trigger' && renderTriggerConfig()}
      {node.type === 'action' && renderActionConfig()}
      {node.type === 'condition' && renderConditionConfig()}

      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(node.id)}
        >
          Delete Node
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
