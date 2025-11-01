import React, { useState, useEffect, useRef } from 'react';
import { PlayerState, Item, ItemType } from '../types';

interface InventoryProps {
  player: PlayerState;
}

const ItemRow: React.FC<{ item: Item; isHighlighted: boolean }> = ({ item, isHighlighted }) => (
    <li className={`text-sm bg-gray-700/50 p-2 rounded flex justify-between items-center transition-transform duration-300 ${isHighlighted ? 'animate-pop-in' : ''}`}>
        <div>
            <span className="mr-2">{item.icon}</span>
            <span>{item.name} {item.count && item.type !== ItemType.EQUIPMENT ? `x${item.count}` : ''}</span>
        </div>
        {item.type === ItemType.EQUIPMENT && (
            <div className="text-xs text-gray-400 flex items-center gap-2">
                <span>
                    {item.stats?.atk ? `ATK+${item.stats.atk} ` : ''}
                    {item.stats?.def ? `DEF+${item.stats.def}` : ''}
                </span>
                {item.durability !== undefined && item.maxDurability !== undefined && (
                    <span className={`font-mono px-1.5 py-0.5 rounded ${item.durability < item.maxDurability * 0.2 ? 'bg-red-800 text-red-300' : 'bg-gray-600'}`}>
                        DUR: {item.durability}/{item.maxDurability}
                    </span>
                )}
            </div>
        )}
    </li>
);

const ItemList: React.FC<{ title: string; items: Item[]; highlightedIds: Set<string> }> = ({ title, items, highlightedIds }) => {
    if (items.length === 0) {
        return null;
    }
    return (
        <div>
            <h4 className="font-semibold text-yellow-400 mt-4 mb-2 border-b border-gray-600 pb-1">{title}</h4>
            <ul className="space-y-2">
                {items.map(item => <ItemRow key={item.id} item={item} isHighlighted={highlightedIds.has(item.id)} />)}
            </ul>
        </div>
    );
};


export const Inventory: React.FC<InventoryProps> = ({ player }) => {
  const [highlightedItems, setHighlightedItems] = useState<Set<string>>(new Set());
  const prevInventoryRef = useRef<Item[]>(player.inventory);

  useEffect(() => {
    const prevInventoryMap = new Map(prevInventoryRef.current.map(item => [item.id, item.count ?? 1]));
    const newHighlights = new Set<string>();

    player.inventory.forEach(currentItem => {
        const prevCount = prevInventoryMap.get(currentItem.id);
        if (prevCount === undefined) {
            // Brand new item
            newHighlights.add(currentItem.id);
        } else {
            const currentItemCount = currentItem.count ?? 1;
            if (currentItemCount > prevCount) {
                // Stack count increased
                newHighlights.add(currentItem.id);
            }
        }
    });

    if (newHighlights.size > 0) {
        setHighlightedItems(newHighlights);
        const timer = setTimeout(() => {
            setHighlightedItems(new Set());
        }, 500); // Animation duration
        return () => clearTimeout(timer);
    }

    // Deep copy for next comparison.
    prevInventoryRef.current = JSON.parse(JSON.stringify(player.inventory));
  }, [player.inventory]);

  const equippedItems = player.inventory.filter(item => item.equipped);
  const backpackItems = player.inventory.filter(item => !item.equipped);

  const backpackEquipment = backpackItems.filter(item => item.type === ItemType.EQUIPMENT);
  const consumables = backpackItems.filter(item => item.type === ItemType.CONSUMABLE);
  const materials = backpackItems.filter(item => item.type === ItemType.MATERIAL);
  const valuables = backpackItems.filter(item => item.type === ItemType.VALUABLE);
  const keys = backpackItems.filter(item => item.type === ItemType.KEY);

  return (
    <div className="p-4">
      <div>
        <h4 className="font-semibold text-yellow-400 mb-2 border-b border-gray-600 pb-1">Equipment (Dikenakan)</h4>
        {equippedItems.length > 0 ? (
            <ul className="space-y-2">
                {equippedItems.map(item => <ItemRow key={item.id} item={item} isHighlighted={highlightedItems.has(item.id)} />)}
            </ul>
        ) : (
            <p className="text-gray-400 italic text-sm py-1">Tidak ada item yang dikenakan.</p>
        )}
      </div>

      <ItemList title="Equipment (Ransel)" items={backpackEquipment} highlightedIds={highlightedItems} />
      <ItemList title="Consumables" items={consumables} highlightedIds={highlightedItems} />
      <ItemList title="Materials" items={materials} highlightedIds={highlightedItems} />
      <ItemList title="Valuables" items={valuables} highlightedIds={highlightedItems} />
      <ItemList title="Key Items" items={keys} highlightedIds={highlightedItems} />

      {player.inventory.length === 0 && <p className="text-gray-400 italic mt-4">Inventaris Anda kosong.</p>}
      
      {backpackItems.length === 0 && player.inventory.length > 0 && (
         <p className="text-gray-400 italic mt-4 text-sm">Ransel Anda kosong.</p>
      )}
    </div>
  );
};