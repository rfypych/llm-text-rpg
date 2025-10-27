
// A simple pseudo-random number generator for deterministic results based on a seed.
function mulberry32(a: number) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

export const getTileTypeForCoords = (x: number, y: number): string => {
    // Ensure the starting point is always a village for narrative consistency.
    if (x === 0 && y === 0) {
        return 'village';
    }

    // Create a consistent seed from coordinates using prime numbers for better distribution.
    const seed = x * 7345781 + y * 3251761;
    const random = mulberry32(seed);
    const val = random();
    
    // Distribute tile types based on the random value.
    if (val < 0.35) return 'plains';
    if (val < 0.70) return 'forest';
    if (val < 0.80) return 'mountains';
    if (val < 0.86) { // River/Bridge zone
        const subRandom = mulberry32(seed * 2); // Use a sub-generator for variety
        if (subRandom() < 0.1) { // 10% chance for a river tile to be a bridge
            return 'bridge';
        }
        return 'river';
    }
    if (val < 0.92) return 'swamp';
    // Rarer locations
    if (val < 0.94) return 'village';
    if (val < 0.96) return 'ruins';
    if (val < 0.98) return 'cave';
    
    return 'plains'; // Fallback tile
};