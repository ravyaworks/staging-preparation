import React from 'react';

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export const Tabs = ({ tabs, defaultTab, onChange, className = '' }: TabsProps) => {
  const [activeTab, setActiveTab] = React.useState<string>(
    defaultTab ?? (tabs[0]?.id ?? ''),
  );

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className={className}>
      <div className="border-b border-gray-200" role="tablist">
        <nav className="flex gap-0 -mb-px" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => handleTabClick(tab.id)}
              className={`
                px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `.trim()}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        className="pt-4"
      >
        {activeContent}
      </div>
    </div>
  );
};
