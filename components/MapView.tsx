import React from 'react';
import { WorldState } from '../types';
import { TILE_TYPES } from '../constants';
import { getTileTypeForCoords } from '../services/mapService';

interface MapViewProps {
  world: WorldState;
}

export const MapView: React.FC<MapViewProps> = ({ world }) => {
  const { coords } = world.location;
  const viewRadius = 3; // Results in a 7x7 grid (3 tiles in each direction from center)

  const mapChunks = [];
  for (let yOffset = -viewRadius; yOffset <= viewRadius; yOffset++) {
    const row = [];
    for (let xOffset = -viewRadius; xOffset <= viewRadius; xOffset++) {
      const isPlayerPosition = xOffset === 0 && yOffset === 0;
      const tileCoords = { x: coords.x + xOffset, y: coords.y + yOffset };
      const tileType = getTileTypeForCoords(tileCoords.x, tileCoords.y);
      row.push({
        key: `${tileCoords.x}-${tileCoords.y}`,
        isPlayer: isPlayerPosition,
        tileType: tileType
      });
    }
    mapChunks.push(row);
  }

  return (
    <div className="p-4 flex flex-col justify-between h-full">
        <div>
            <div className="text-center mb-4">
                <h3 className="font-bold text-lg text-yellow-400">{world.location.name}</h3>
                <p className="text-sm text-gray-400">{TILE_TYPES[world.location.type]?.name || "Unknown Area"}</p>
                <p className="text-xs text-gray-500 font-mono mt-1">({coords.x}, {coords.y})</p>
            </div>
          <div className="grid grid-cols-7 gap-1 bg-gray-900 p-2 rounded-lg">
            {mapChunks.map((row, y) =>
              row.map((tile) => {
                const tileInfo = TILE_TYPES[tile.tileType] || { name: "Unknown", icon: "❓" };
                return (
                  <div
                    key={tile.key}
                    title={tile.isPlayer ? `You are here: ${world.location.name}` : tileInfo.name}
                    className={`w-full aspect-square flex items-center justify-center rounded transition-all
                      ${tile.isPlayer ? 'bg-yellow-500' : 'bg-gray-700'}
                      border-2 ${tile.isPlayer ? 'border-yellow-300 scale-110 shadow-lg shadow-yellow-500/30' : 'border-gray-600'}`}
                  >
                    {tile.isPlayer ? (
                      <span className="text-3xl">
                        🦸
                      </span>
                    ) : (
                      <span className="text-xl">
                        {tileInfo.icon}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="flex justify-center items-center mt-6">
            <div className="relative w-24 h-24 text-gray-400 font-bold text-sm">
                <span className="absolute top-0 left-1/2 -translate-x-1/2">U</span>
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2">S</span>
                <span className="absolute left-0 top-1/2 -translate-y-1/2">B</span>
                <span className="absolute right-0 top-1/2 -translate-y-1/2">T</span>
                <div className="w-full h-full flex items-center justify-center">
                    <div className="w-px h-1/2 bg-gray-600 absolute top-0 left-1/2 -translate-x-1/2"></div>
                    <div className="w-px h-1/2 bg-gray-600 absolute bottom-0 left-1/2 -translate-x-1/2"></div>
                    <div className="h-px w-1/2 bg-gray-600 absolute left-0 top-1/2 -translate-y-1/2"></div>
                    <div className="h-px w-1/2 bg-gray-600 absolute right-0 top-1/2 -translate-y-1/2"></div>
                </div>
            </div>
        </div>
    </div>
  );
};