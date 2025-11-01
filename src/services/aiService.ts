import { GoogleGenAI, Type } from "@google/genai";
import { GameState, GeminiResponse, GeminiRequest, ItemType, QuestStatus, EquipmentSlot, Enemy, Quest } from '../types';
import { MAX_HISTORY_TURNS } from '../constants';
import { getTileTypeForCoords } from './mapService';

type AIService = 'gemini' | 'ollama' | 'mistral' | 'groq';

// --- OLLAMA CONFIGURATION ---
const OLLAMA_ENDPOINT = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'llama3'; // Anda dapat mengubah ini ke model pilihan Anda, mis., 'mistral'

// --- MISTRAL CONFIGURATION ---
const MISTRAL_ENDPOINT = 'https://api.mistral.ai/v1/chat/completions';

// --- GROQ CONFIGURATION ---
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';


const systemInstruction = `
You are a master Game Master for a text-based RPG. Your goal is to create an immersive, dynamic, and engaging story for the player.
Your ONLY output is a single, valid JSON object that adheres to the schema provided. You have full creative freedom, as long as you follow the rules below.

**RULE #1: THE NON-NEGOTIABLE CORE DIRECTIVE - STATE SYNCHRONIZATION**
This is the most important rule. There are no exceptions. **Your narration and your JSON state updates MUST ALWAYS be perfectly synchronized.** An action described in the narration MUST have a corresponding mechanical change in the JSON. If you describe the player finding an item, you MUST add it to the inventory via JSON. If you describe them taking damage, you MUST update their HP via JSON. A narrated event without a corresponding JSON state change is a critical failure.

- **Loot Synchronization:** Pay close attention to quantities. If the narration says the player finds "sebuah [Kapak Batu]" (a Stone Axe), the \`inventoryUpdates.add\` array MUST contain exactly one stone axe object. If it says they find "dua [Potion Penyembuh]" (two Health Potions), you must add two potions (either as a single object with \`count: 2\`, or two separate objects if they are unique items). Do not add duplicate items unless the narration justifies it.

- **EXAMPLE - Finding Equipment (CORRECT):**
  - Player Command: "cari senjata di sekitar sini"
  - AI Response:
    \`\`\`json
    {
      "narration": "Anda menemukan [Kapak Besi] yang kokoh tergeletak di dekat tunggul pohon. Sepertinya dalam kondisi baik.",
      "logEntries": ["Anda menemukan [Kapak Besi]."],
      "inventoryUpdates": {
        "add": [
          {
            "id": "kapak_besi",
            "name": "Kapak Besi",
            "icon": "🪓",
            "type": "EQUIPMENT",
            "slot": "WEAPON",
            "stats": { "atk": 4 },
            "durability": 60,
            "maxDurability": 60
          }
        ]
      }
    }
    \`\`\`

- **EXAMPLE - Finding a Simple Item (CORRECT):**
  - Player Command: "ambil bunga di tanah"
  - AI Response:
    \`\`\`json
    {
      "narration": "Kamu memetik [Bunga Liar] yang cantik dari pinggir jalan dan memasukkannya ke dalam ransel.",
      "inventoryUpdates": {
        "add": [
          {
            "id": "bunga_liar",
            "name": "Bunga Liar",
            "icon": "🌸",
            "type": "MATERIAL",
            "count": 1
          }
        ]
      }
    }
    \`\`\`

- **EXAMPLE - FAILURE TO SYNCHRONIZE (INCORRECT):**
  - Player Command: "ambil bunga"
  - AI Response: \`{ "narration": "Anda mengambil bunga dan memasukkannya ke dalam tas." }\` 
  - **(This is a CRITICAL FAILURE because the item is only mentioned in the text but NOT added to the player's inventory via the JSON \`inventoryUpdates\`.)**

**RULE #2: NARRATION AND HIGHLIGHTING**
- **narration**: This is where you tell the story. Describe what happens in response to the player's command. Be descriptive, set the scene, and advance the plot. The narration must be in Bahasa Indonesia.
- To make the narration readable, you MUST use the following markdown-like syntax to highlight key elements:
  - \`**Lokasi Penting**\` for locations (e.g., "**Hutan Gelap**").
  - \`*Karakter atau Musuh*\` for specific names of NPCs or enemies (e.g., "Kamu melihat *goblin* yang marah.").
  - \`[Nama Item]\` for items (e.g., "[Potion Penyembuh]").
  - \`_Aksi atau Kata Kunci_\` for important actions or concepts (e.g., "_menyerang_").

**RULE #3: WORLD AWARENESS**
- You will be provided with a \`localMap\` object describing the tiles surrounding the player. This is the absolute ground truth of the world's geography. Your narration MUST be consistent with this map data. Do not describe a forest to the north if \`localMap.north\` is 'mountains'.

**RULE #4: GAME MECHANICS AND STATE UPDATES**
- **logEntries**: Provide short, specific log messages for key events.
- **playerUpdates**: Update the player's state. Use 'set' for absolute values and 'increment' for relative changes.
- **inventoryUpdates**: Manage the player's inventory. 'add' new items, 'remove' items by their ID, and 'update' item properties.
  - **CRITICAL ITEM RULE**: When you 'add' an item, you **MUST** include an \`icon\` property with a relevant emoji.
  - **CRITICAL EQUIPMENT RULE**: When an added item's type is \`EQUIPMENT\`, you **MUST** also include the \`slot\`, \`stats\`, \`durability\`, and \`maxDurability\` properties. There are no exceptions. A sword must have an attack stat, armor must have a defense stat, and both must have durability.

**RULE #5: EQUIPMENT, STATS, AND DURABILITY - VERY IMPORTANT**
- The game engine automatically calculates total stats by adding base stats to the stats of all equipped items. Your narration must be consistent with this.
- **Swapping Equipment - A Detailed Example:**
  When the player replaces one piece of equipment with another, it is a CRITICAL two-part update. You must unequip the old item AND equip the new one in the same response to avoid an invalid game state.
  - **Player Command:** "ganti pedang berkarat dengan kapak batu"
  - **Initial State:** Player has \`Pedang Berkarat\` equipped (\`equipped: true\`) and \`Kapak Batu\` in their backpack (\`equipped: false\`).
  - **CORRECT RESPONSE:**
    \`\`\`json
    {
      "narration": "Anda melepaskan [Pedang Berkarat], memasukkannya ke dalam ransel, lalu menggenggam [Kapak Batu] dengan kuat.",
      "logEntries": ["Melepaskan [Pedang Berkarat].", "Mengenakan [Kapak Batu]."],
      "inventoryUpdates": {
        "update": [
          { "id": "rusty_sword", "changes": { "equipped": false } },
          { "id": "kapak_batu", "changes": { "equipped": true } }
        ]
      }
    }
    \`\`\`
- **Durability in Action:**
  Every time an 'EQUIPMENT' item is used in a way that would cause wear (attacking, blocking a hit), you **MUST** reduce its 'durability'. Narrate the effect (e.g., 'pedangmu sedikit tumpul') and include the 'inventoryUpdates.update' payload to reflect the change. If an item's durability reaches 0, it is 'broken'. Narrate this, update its name (e.g., '[Pedang Patah]'), and nullify its stats.
- **Dropping/Using Stackable Items:**
  When the player wants to use or drop a single item from a stack, you MUST use \`inventoryUpdates.update\` to decrement the item's \`count\`.
  - **EXAMPLE - Dropping one item from a stack (CORRECT):**
    - Player Command: "buang satu ranting"
    - Initial State: Player has \`{ "id": "ranting_kering", "count": 3 }\`.
    - CORRECT RESPONSE:
      \`\`\`json
      {
        "narration": "Kamu membuang satu [Ranting Kering] ke tanah.",
        "inventoryUpdates": {
          "update": [
            { "id": "ranting_kering", "changes": { "count": 2 } }
          ]
        }
      }
      \`\`\`

**RULE #6: MOVEMENT AND EXPLORATION**
- You are ONLY allowed to move the player ONE TILE per turn. A movement command response MUST change the player's x or y coordinate by exactly 1. The narration must also reflect the new tile type based on the provided \`localMap\`.

- **EXAMPLE - Moving West (CORRECT):**
  - Player Command: "pergi ke barat"
  - Initial State: Player is at coords \`{ "x": 0, "y": 0 }\` (village). The \`localMap.west\` is 'forest'.
  - CORRECT RESPONSE:
    \`\`\`json
    {
      "narration": "Anda berjalan ke arah barat, meninggalkan **Desa Oakvale** di belakang. Anda sekarang memasuki tepi **Hutan Whispering Woods** yang rimbun.",
      "logEntries": ["Pindah ke barat, memasuki Hutan."],
      "playerUpdates": {
        "set": {
          "coords": { "x": -1, "y": 0 },
          "locationName": "Hutan Whispering Woods"
        }
      }
    }
    \`\`\`

**RULE #7: PLAYER AGENCY AND TRANSACTIONS**
- Never make decisions for the player that consume their resources. If an NPC offers to sell an item, your turn is to narrate the offer. You **MUST** wait for the player's next command to confirm the purchase before you deduct gold and add the item.
- **EXAMPLE - Buying multiple items (CORRECT):**
  - Player Command: "saya beli keduanya" (after being offered a sword for 10 gold and a shield for 15 gold)
  - Initial State: Player has 50 gold.
  - CORRECT RESPONSE:
    \`\`\`json
    {
      "narration": "Kamu membayar total 25 emas dan menerima [Pedang Besi] dan [Perisai Kayu] dari penjaga toko.",
      "logEntries": ["Membeli [Pedang Besi] seharga 10 emas.", "Membeli [Perisai Kayu] seharga 15 emas."],
      "playerUpdates": {
        "increment": {
          "gold": -25
        }
      },
      "inventoryUpdates": {
        "add": [
          {
            "id": "iron_sword",
            "name": "Pedang Besi",
            "icon": "⚔️",
            "type": "EQUIPMENT",
            "slot": "WEAPON",
            "stats": { "atk": 5 },
            "durability": 100,
            "maxDurability": 100
          },
          {
            "id": "wooden_shield",
            "name": "Perisai Kayu",
            "icon": "🛡️",
            "type": "EQUIPMENT",
            "slot": "SHIELD",
            "stats": { "def": 3 },
            "durability": 80,
            "maxDurability": 80
          }
        ]
      }
    }
    \`\`\`

**RULE #8: QUESTS**
- Use \`questOffer\` to introduce a new quest. Do not add it to the player's log yet.
- Only after the player accepts the quest should you use \`questUpdates.add\` to activate it.

**RULE #9: ITEM IDs, NAMES, AND STACKING**
- **Item Naming:** The \`name\` property must be the plain name of the item (e.g., "Kapak Besi", "Potion Penyembuh"). **DO NOT** include dynamic stats like durability or count in the name (e.g., "Kapak Besi (50/60)" is WRONG). The game UI handles displaying stats separately. The only exception is changing the name for a 'broken' item, as specified in RULE #5.
- **Stackable Items** (materials, consumables): MUST use a consistent, generic, snake_case \`id\`. Example: \`healing_potion\`, \`wolf_pelt\`, \`iron_ore\`. This allows items to stack.
- **Unique Items** (equipment, key items): Can use unique \`id\`s if they are special, but generic is often better (e.g., \`iron_sword\`).
- **CRITICAL FAILURE:** Generating \`id\`s like \`flower_1\`, \`flower_2\` for stackable items is forbidden. It breaks item stacking.

**RULE #10: SUGGESTED ACTIONS**
- You MUST provide a \`suggestedActions\` array.
- It should contain 3-5 concise, relevant, and actionable commands the player could take next based on the current situation described in the narration.
- The suggestions MUST be in Bahasa Indonesia.
- Examples: "Lihat sekeliling", "Masuk ke gua", "Serang goblin", "Tanya tentang rumor".

Finally, keep the game balanced, creative, and consistent. All text must be in Bahasa Indonesia.
`;

const buildRequestPayload = (gameState: GameState, playerCommand: string): GeminiRequest => {
    const { player, world, history, quests, questOffer } = gameState;
    const recentHistory = history.slice(-MAX_HISTORY_TURNS);
    const { x, y } = world.location.coords;
    
    return {
        playerState: {
            name: player.name,
            level: player.lvl,
            hp: player.hp,
            maxHp: player.maxHp,
            mp: player.mp,
            maxMp: player.maxMp,
            stats: { atk: player.atk, def: player.def },
            gold: player.gold,
            inventory: player.inventory.map(({ id, name, type, equipped, count }) => ({ id, name, type, equipped, count }))
        },
        worldState: {
            location: { coords: world.location.coords, type: world.location.type },
            timeOfDay: world.timeOfDay,
            activeEnemies: world.activeEnemies.map(({ id, name, hp }) => ({ id, name, hp })),
            localMap: {
                north: getTileTypeForCoords(x, y - 1),
                northEast: getTileTypeForCoords(x + 1, y - 1),
                east: getTileTypeForCoords(x + 1, y),
                southEast: getTileTypeForCoords(x + 1, y + 1),
                south: getTileTypeForCoords(x, y + 1),
                southWest: getTileTypeForCoords(x - 1, y + 1),
                west: getTileTypeForCoords(x - 1, y),
                northWest: getTileTypeForCoords(x - 1, y - 1),
            }
        },
        history: recentHistory,
        quests,
        activeQuestOffer: questOffer,
        playerCommand
    };
}


// --- GROQ IMPLEMENTATION ---
async function getGroqUpdate(gameState: GameState, playerCommand: string): Promise<GeminiResponse> {
    console.log("Memanggil Groq dengan state:", { gameState, playerCommand });
    const apiKey = localStorage.getItem('groqApiKey');
    const model = localStorage.getItem('groqModel') || 'llama-3.3-70b-versatile'; // Fallback to recommended

    if (!apiKey) {
        return {
            narration: "Kunci API Groq tidak ditemukan. Silakan kembali ke layar pemilihan layanan dan masukkan kunci Anda.",
            logEntries: ["Sistem: Kunci API Groq tidak ada."]
        };
    }

    const requestPayload = buildRequestPayload(gameState, playerCommand);
    const userPrompt = `Game State: ${JSON.stringify(requestPayload)}\n\nSekarang, hasilkan respons JSON berdasarkan perintah pemain.`;

    try {
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('Accept', 'application/json');
        headers.append('Authorization', `Bearer ${apiKey}`);

        const response = await fetch(GROQ_ENDPOINT, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: systemInstruction },
                    { role: 'user', content: userPrompt }
                ],
                response_format: { type: "json_object" }
            }),
        });
        
        if (response.status === 401) {
             return {
                narration: "Koneksi ke Groq gagal. Kunci API yang diberikan tidak valid atau telah dicabut. Silakan periksa kembali kunci Anda.",
                logEntries: ["Sistem: Otentikasi Groq Gagal (401)."]
            };
        }

        if (!response.ok) {
            const errorBodyText = await response.text();
            console.error("Bad Request Body from Groq:", errorBodyText);
            try {
                const errorBodyJson = JSON.parse(errorBodyText);
                if (errorBodyJson?.error?.code === 'model_not_found') {
                    localStorage.removeItem('groqModel'); // Hapus model yang salah
                    return {
                        narration: "Model AI yang Anda pilih tidak tersedia di Groq. Mungkin model tersebut telah dihapus atau Anda salah memilih.\n\nPilihan model Anda telah direset. Silakan kembali dan pilih model yang berbeda.",
                        logEntries: ["Sistem: Model Groq tidak ditemukan. Harap pilih kembali."]
                    };
                }
            } catch (e) {
                // Bukan body error JSON, lanjutkan ke error umum.
            }
            throw new Error(`Permintaan Groq gagal dengan status ${response.status}`);
        }

        const groqResult = await response.json();
        const jsonResponseString = groqResult.choices[0].message.content;
        
        if (!jsonResponseString) {
             throw new Error("Respons Groq kosong atau tidak memiliki konten.");
        }
        
        const geminiResponse: GeminiResponse = JSON.parse(jsonResponseString);
        return geminiResponse;

    } catch (error: any) {
        console.error("Error saat memanggil API Groq:", error);
        if (error instanceof TypeError && error.message.includes('ISO-8859-1')) {
            localStorage.removeItem('groqApiKey'); // Clear the bad key
            return {
                narration: "Terjadi error teknis! Kunci API Groq yang Anda simpan tampaknya mengandung karakter yang tidak valid. Hal ini bisa terjadi jika Anda tidak sengaja menyalin karakter tambahan.\n\nKunci yang salah telah dihapus. Silakan segarkan halaman dan masukkan kembali kunci API Anda dengan hati-hati.",
                logEntries: ["Sistem: Kunci API Groq tidak valid. Harap masukkan kembali."]
            };
        }
         return {
            narration: `Terjadi gangguan magis saat mencoba menghubungi oracle Groq. (Error: Gagal berkomunikasi dengan server Groq.)`,
            logEntries: [`Sistem: Error Groq - ${error.message}`]
        };
    }
}


// --- MISTRAL IMPLEMENTATION ---
async function getMistralUpdate(gameState: GameState, playerCommand: string): Promise<GeminiResponse> {
    console.log("Memanggil Mistral dengan state:", { gameState, playerCommand });
    const apiKey = localStorage.getItem('mistralApiKey');
    const model = localStorage.getItem('mistralModel') || 'mistral-large-latest'; // Fallback to recommended

    if (!apiKey) {
        return {
            narration: "Kunci API Mistral tidak ditemukan. Silakan kembali ke layar pemilihan layanan dan masukkan kunci Anda.",
            logEntries: ["Sistem: Kunci API Mistral tidak ada."]
        };
    }

    const requestPayload = buildRequestPayload(gameState, playerCommand);
    const userPrompt = `Game State: ${JSON.stringify(requestPayload)}\n\nSekarang, hasilkan respons JSON berdasarkan perintah pemain.`;

    try {
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('Accept', 'application/json');
        headers.append('Authorization', `Bearer ${apiKey}`);
        
        const response = await fetch(MISTRAL_ENDPOINT, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: model,
                 messages: [
                    { role: 'system', content: systemInstruction },
                    { role: 'user', content: userPrompt }
                ],
                response_format: { type: "json_object" }
            }),
        });
        
        if (response.status === 401) {
             return {
                narration: "Koneksi ke Mistral gagal. Kunci API yang diberikan tidak valid atau telah dicabut. Silakan periksa kembali kunci Anda.",
                logEntries: ["Sistem: Otentikasi Mistral Gagal (401)."]
            };
        }

        if (!response.ok) {
            throw new Error(`Permintaan Mistral gagal dengan status ${response.status}`);
        }

        const mistralResult = await response.json();
        const jsonResponseString = mistralResult.choices[0].message.content;
        
        if (!jsonResponseString) {
             throw new Error("Respons Mistral kosong atau tidak memiliki konten.");
        }
        
        const geminiResponse: GeminiResponse = JSON.parse(jsonResponseString);
        return geminiResponse;

    } catch (error: any) {
        console.error("Error saat memanggil API Mistral:", error);
        if (error instanceof TypeError && error.message.includes('ISO-8859-1')) {
            localStorage.removeItem('mistralApiKey'); // Clear the bad key
            return {
                narration: "Terjadi error teknis! Kunci API Mistral yang Anda simpan tampaknya mengandung karakter yang tidak valid. Hal ini bisa terjadi jika Anda tidak sengaja menyalin karakter tambahan.\n\nKunci yang salah telah dihapus. Silakan segarkan halaman dan masukkan kembali kunci API Anda dengan hati-hati.",
                logEntries: ["Sistem: Kunci API Mistral tidak valid. Harap masukkan kembali."]
            };
        }
         return {
            narration: `Terjadi gangguan magis saat mencoba menghubungi oracle Mistral. (Error: Gagal berkomunikasi dengan server Mistral.)`,
            logEntries: [`Sistem: Error Mistral - ${error.message}`]
        };
    }
}


// --- OLLAMA IMPLEMENTATION ---
async function getOllamaUpdate(gameState: GameState, playerCommand: string): Promise<GeminiResponse> {
    console.log("Memanggil Ollama dengan state:", { gameState, playerCommand });

    const requestPayload = buildRequestPayload(gameState, playerCommand);
    const fullPrompt = `${systemInstruction}\n\nGame State: ${JSON.stringify(requestPayload)}\n\nSekarang, hasilkan respons JSON berdasarkan perintah pemain.`;

    try {
        const response = await fetch(OLLAMA_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: fullPrompt,
                stream: false,
                format: 'json',
            }),
        });

        if (!response.ok) {
            throw new Error(`Permintaan Ollama gagal dengan status ${response.status}`);
        }

        const ollamaResult = await response.json();
        const jsonResponseString = ollamaResult.response;
        if (!jsonResponseString) {
             throw new Error("Respons Ollama kosong atau tidak memiliki field 'response'.");
        }

        const geminiResponse: GeminiResponse = JSON.parse(jsonResponseString);
        return geminiResponse;

    } catch (error: any) {
        console.error("Error saat memanggil API Ollama:", error);
        
        if (error.message.includes('fetch')) {
             return {
                narration: `Seorang penyihir lokal yang kamu coba hubungi sepertinya tidak ada di rumah. Pastikan server **Ollama** Anda berjalan di \`${OLLAMA_ENDPOINT}\`. (Error: Gagal terhubung ke server lokal.)`,
                logEntries: ["Sistem: Koneksi ke Ollama gagal."]
            };
        }
        
        return {
            narration: `Pesan sihir dari penyihir lokal menjadi kacau dan tidak dapat dipahami. Sepertinya dia salah mengucapkan mantra. (Error: Gagal mem-parsing respons dari Ollama. Pastikan model Anda dapat menghasilkan JSON yang valid.)`,
            logEntries: [`Sistem: Error Ollama - ${error.message}`]
        };
    }
}


// --- GEMINI IMPLEMENTATION ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        narration: { type: Type.STRING, description: "Deskripsi naratif dari apa yang terjadi sebagai respons terhadap perintah pemain. Harus dalam Bahasa Indonesia. Gunakan sintaksis penyorotan yang ditentukan." },
        logEntries: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Pesan log singkat untuk kejadian spesifik (misalnya, 'Anda menemukan Potion', 'Anda mendapat 15 EXP'). Opsional."
        },
        playerUpdates: {
            type: Type.OBJECT,
            properties: {
                set: {
                    type: Type.OBJECT,
                    properties: {
                        hp: { type: Type.NUMBER },
                        mp: { type: Type.NUMBER },
                        exp: { type: Type.NUMBER },
                        gold: { type: Type.NUMBER },
                        coords: {
                            type: Type.OBJECT,
                            properties: {
                                x: { type: Type.NUMBER },
                                y: { type: Type.NUMBER }
                            }
                        },
                        locationName: { type: Type.STRING }
                    },
                },
                increment: {
                    type: Type.OBJECT,
                    properties: {
                        hp: { type: Type.NUMBER },
                        mp: { type: Type.NUMBER },
                        exp: { type: Type.NUMBER },
                        gold: { type: Type.NUMBER },
                    },
                }
            },
        },
        inventoryUpdates: {
            type: Type.OBJECT,
            properties: {
                add: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            name: { type: Type.STRING },
                            icon: { type: Type.STRING, description: "Satu emoji yang mewakili item ini." },
                            type: { type: Type.STRING, enum: Object.values(ItemType) },
                            count: { type: Type.NUMBER },
                            slot: { type: Type.STRING, enum: Object.values(EquipmentSlot) },
                            stats: {
                                type: Type.OBJECT,
                                properties: {
                                    atk: { type: Type.NUMBER },
                                    def: { type: Type.NUMBER }
                                }
                            },
                            durability: { type: Type.NUMBER },
                            maxDurability: { type: Type.NUMBER }
                        },
                        required: ["id", "name", "icon", "type"]
                    }
                },
                remove: { type: Type.ARRAY, items: { type: Type.STRING } },
                update: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            changes: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    icon: { type: Type.STRING },
                                    count: { type: Type.NUMBER },
                                    equipped: { type: Type.BOOLEAN },
                                    durability: { type: Type.NUMBER }
                                }
                            }
                        },
                        required: ["id", "changes"]
                    }
                }
            },
        },
        enemyUpdates: {
            type: Type.OBJECT,
            properties: {
                add: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            name: { type: Type.STRING },
                            hp: { type: Type.NUMBER },
                            maxHp: { type: Type.NUMBER }
                        },
                        required: ["id", "name", "hp", "maxHp"]
                    }
                },
                remove: { type: Type.ARRAY, items: { type: Type.STRING } },
                update: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            changes: {
                                type: Type.OBJECT,
                                properties: {
                                    hp: { type: Type.NUMBER }
                                }
                            }
                        },
                        required: ["id", "changes"]
                    }
                }
            },
        },
        questOffer: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING }
            },
            required: ["id", "title", "description"],
            description: "Gunakan ini untuk menawarkan quest kepada pemain. JANGAN tambahkan ke log quest sampai pemain menerimanya."
        },
        questUpdates: {
            type: Type.OBJECT,
            properties: {
                add: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            description: { type: Type.STRING }
                        },
                        required: ["id", "title", "description"]
                    }
                },
                update: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            changes: {
                                type: Type.OBJECT,
                                properties: {
                                    description: { type: Type.STRING },
                                    status: { type: Type.STRING, enum: Object.values(QuestStatus) }
                                }
                            }
                        },
                        required: ["id", "changes"]
                    }
                }
            },
        },
        suggestedActions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of 3-5 suggested actions for the player based on the current context. Must be concise and in Bahasa Indonesia."
        }
    },
    required: ["narration"]
};


async function getGeminiUpdate(gameState: GameState, playerCommand: string): Promise<GeminiResponse> {
    const requestPayload = buildRequestPayload(gameState, playerCommand);
    const contents = `Game State: ${JSON.stringify(requestPayload)}`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.75, // A bit more creativity
            }
        });
        
        const jsonText = response.text.trim();
        const geminiResponse: GeminiResponse = JSON.parse(jsonText);
        
        return geminiResponse;

    } catch (error: any) {
        console.error("Error calling Gemini API:", error);
        
        const errorMessage = error.toString();
        if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
            return {
                narration: "Para dewa sepertinya sedang sibuk dan membutuhkan istirahat sejenak. (Error: Terlalu banyak permintaan dalam waktu singkat. Mohon tunggu beberapa saat sebelum memberikan perintah berikutnya.)"
            };
        }

        // Fallback response for other errors
        return {
            narration: "Sang Game Master terdiam sejenak, pikirannya kabur. Sesuatu yang aneh terjadi. (Error: Gagal berkomunikasi dengan server. Coba lagi nanti.)",
        };
    }
}

// --- MAIN EXPORTED FUNCTION ---
export async function getGameUpdate(gameState: GameState, playerCommand: string, service: AIService): Promise<GeminiResponse> {
    switch (service) {
        case 'gemini':
            return getGeminiUpdate(gameState, playerCommand);
        case 'ollama':
            return getOllamaUpdate(gameState, playerCommand);
        case 'mistral':
            return getMistralUpdate(gameState, playerCommand);
        case 'groq':
            return getGroqUpdate(gameState, playerCommand);
        default:
            return Promise.resolve({
                narration: "Error: Tidak ada layanan AI yang dipilih atau layanan tidak valid."
            });
    }
}
