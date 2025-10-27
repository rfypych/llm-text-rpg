
import React from 'react';
import { PlayerState, Item, ItemType, EquipmentSlot } from '../types';

interface InventoryProps {
  player: PlayerState;
}

const getSlotIcon = (slot?: EquipmentSlot) => {
    switch(slot) {
        case EquipmentSlot.WEAPON: return '⚔️';
        case EquipmentSlot.ARMOR: return '🛡️';
        case EquipmentSlot.HELMET: return '👑';
        default: return '❔';
    }
}

export const Inventory: React.FC<InventoryProps> = ({ player }) => {
  const equipment = player.inventory.filter(item => item.type === ItemType.EQUIPMENT && item.equipped);
  const consumables = player.inventory.filter(item => item.type === ItemType.CONSUMABLE);
  const materials = player.inventory.filter(item => item.type === ItemType.MATERIAL);
  const valuables = player.inventory.filter(item => item.type === ItemType.VALUABLE);
  const keys = player.inventory.filter(item => item.type === ItemType.KEY);

  const renderItemList = (title: string, items: Item[]) => (
    items.length > 0 && (
      <div>
        <h4 className="font-semibold text-yellow-400 mt-4 mb-2 border-b border-gray-600 pb-1">{title}</h4>
        <ul className="space-y-2">
          {items.map(item => (
            <li key={item.id} className="text-sm bg-gray-700/50 p-2 rounded flex justify-between items-center">
              <span>{item.name} {item.count && `x${item.count}`}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  );

  return (
    <div className="p-4">
      <div>
        <h4 className="font-semibold text-yellow-400 mb-2 border-b border-gray-600 pb-1">Equipment</h4>
        <ul className="space-y-2">
            {equipment.map(item => (
                 <li key={item.id} className="text-sm bg-gray-700/50 p-2 rounded flex justify-between items-center">
                    <div>
                        <span className="mr-2">{getSlotIcon(item.slot)}</span>
                        <span>{item.name}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                        {item.stats?.atk && `ATK+${item.stats.atk} `}
                        {item.stats?.def && `DEF+${item.stats.def}`}
                    </div>
                 </li>
            ))}
        </ul>
      </div>

      {renderItemList("Consumables", consumables)}
      {renderItemList("Materials", materials)}
      {renderItemList("Valuables", valuables)}
      {renderItemList("Key Items", keys)}

      {player.inventory.length === 0 && <p className="text-gray-400 italic mt-4">Your inventory is empty.</p>}
    </div>
  );
};
