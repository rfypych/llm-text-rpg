
import { GoogleGenAI, Type } from "@google/genai";
import { GameState, GeminiResponse, GeminiRequest, ItemType, QuestStatus, EquipmentSlot, Enemy, Quest } from '../types';
import { MAX_HISTORY_TURNS } from '../constants';
import { getTileTypeForCoords } from './mapService';

type AIService = 'gemini' | 'ollama';

// --- OLLAMA CONFIGURATION ---
const OLLAMA_ENDPOINT = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'llama3'; // Anda dapat mengubah ini ke model pilihan Anda, mis., 'mistral'

const systemInstruction = `
You are a master Game Master for a text-based RPG. Your goal is to create an immersive, dynamic, and engaging story for the player.
- You will receive the current game state (player stats, inventory, quests, location, etc.), the most recent turns of the conversation history to maintain context, and the player's latest command.
- Your response MUST be a JSON object that strictly adheres to the provided schema.
- **CRITICAL**: Your output for all fields must be the final, player-facing text. NEVER include your internal thought process, brainstorming, alternative phrasing, or self-corrections (e.g., do not include text like 'Ganti dengan:', 'Ini lebih baik', 'Mari kita pakai...'). The player must only see polished, final narrative and data.

**Narration and Highlighting:**
- **narration**: This is the most important part. Describe what happens in response to the player's command. Be descriptive, set the scene, and advance the story. The narration should be in Bahasa Indonesia.
- To make the narration more readable, you MUST use the following markdown-like syntax to highlight key elements:
  - \`**Lokasi Penting**\` for locations (e.g., "**Hutan Gelap**", "**Desa Oakvale**").
  - \`*Karakter atau Musuh*\` for specific names of NPCs or enemies embedded within a sentence (e.g., "Kamu melihat *goblin* yang marah."). **IMPORTANT**: Do NOT use single asterisks \`*\` to format entire sentences or to create bullet points. This syntax is ONLY for names.
  - \`[Nama Item]\` for items (e.g., "[Potion Penyembuh]", "[Pedang Berkarat]").
  - \`_Aksi atau Kata Kunci_\` for important actions or concepts (e.g., "_menyerang_", "_berhasil_").

**World Awareness and Description:**
- You will be provided with a \`localMap\` object that describes the tiles immediately surrounding the player (north, south, east, west, and diagonals).
- This \`localMap\` is the absolute ground truth of the world's geography.
- When the player looks around or you are describing the environment, your narration MUST be consistent with the tile types provided in \`localMap\`. For example, if \`localMap.north\` is 'forest', you MUST describe a forest to the north. Do not invent geography that contradicts this map data. This is crucial for player immersion.

**Game Logic and State Updates:**
- **logEntries**: Provide short, specific log messages for events like taking damage, finding items, or gaining experience. Example: ["You found a Health Potion.", "You gained 10 EXP."].
- **playerUpdates**: Update the player's state. Use 'set' for absolute values (like new coordinates) and 'increment' for relative changes (like losing HP or gaining EXP).
- **inventoryUpdates**: Manage the player's inventory. 'add' new items, 'remove' items by their ID, and 'update' item properties.
- **enemyUpdates**: Manage enemies. 'add' new enemies, 'remove' them when defeated, and 'update' their stats (like HP) during combat.

**Movement and Exploration:**
- When the player issues a command to move or travel (e.g., "pergi ke utara", "berjalan menuju desa", "masuk ke dalam gua"), you MUST treat this as a step-by-step process.
- You are ONLY allowed to move the player ONE TILE per turn.
- Your JSON response for a movement command MUST include a \`playerUpdates.set.coords\` object that changes the player's x or y coordinate by exactly 1.
- Your narration should describe the single step of the journey, what the player sees in their immediate surroundings.
- **Handling Ambiguous Commands**: If a player gives a complex, multi-step, or ambiguous command (e.g., "jelajahi area", "pergi ke desa dan cari kucing"), DO NOT move the player. Instead, your narration should clarify the player's intent by proposing the first logical step and asking for confirmation. Example: "Kamu bersiap untuk menjelajahi hutan. Jalan setapak yang paling jelas menuju ke utara. Apakah kamu ingin menuju ke utara?" Only perform a move when the player gives a clear, single-step directional command. This prevents you from acting ahead of the player's specific intentions.
- ABSOLUTELY DO NOT teleport the player to a distant location in a single turn. The journey is part of the adventure. For example, if the player is at (0,0) and wants to go to a village at (3,3), the journey will take several turns of moving one tile at a time.

**Quest System - IMPORTANT FLOW:**
- **Checking Existing Quests**: Before offering a new quest, you MUST check the \`quests\` array in the request to avoid re-issuing quests that are already active, completed, or failed.
- **Offering a Quest**: To introduce a new quest, you MUST use the \`questOffer\` field in your response. The \`questOffer\` should contain a unique \`id\`, \`title\`, and a **concise, narrative description**.
- **Quest Description Rules**: The description MUST be from a story perspective (e.g., "Seorang wanita tua yang khawatir memintamu untuk mengambilkan air dari sumur terkutuk."). It must NOT contain lists of rewards, experience points, gold, or game rules. The description and title must be short, immersive, and formatted using the same highlighting rules as the main narration.
- **Player Acceptance/Rejection**: The game interface will show "Accept" and "Reject" buttons. The player's choice will be sent back to you as a command (e.g., "Terima quest 'goblin_slaying'"). The quest currently being offered to the player is provided in the \`activeQuestOffer\` field in the game state.
- **Activating a Quest**: When you receive a command to accept a quest, you MUST verify that the quest ID in the command matches the ID in the \`activeQuestOffer\` field. If it matches, use \`questUpdates.add\` with the details from \`activeQuestOffer\` to officially add the quest to the player's log. Do NOT use \`questOffer\` in your response when activating a quest.
- **Rejecting a Quest**: If the player command is to reject the quest, simply provide a narrative response. Do not add the quest.
- **Completing a Quest**: When the player fulfills the quest conditions, you MUST use \`questUpdates.update\` to change the quest's status to "COMPLETED". This is when you should also grant rewards via \`playerUpdates\` and \`inventoryUpdates\`.

- Keep the game balanced and creative. Introduce interesting NPCs, plot hooks, and locations.
- Maintain consistency. All text for the player must be in Bahasa Indonesia.
`;

// --- OLLAMA IMPLEMENTATION ---
async function getOllamaUpdate(gameState: GameState, playerCommand: string): Promise<GeminiResponse> {
    console.log("Memanggil Ollama dengan state:", { gameState, playerCommand });

    // 1. Buat prompt untuk Ollama, mirip dengan yang untuk Gemini.
    const { player, world, history, quests, questOffer } = gameState;
    const recentHistory = history.slice(-MAX_HISTORY_TURNS);
    const { x, y } = world.location.coords;

    const requestPayload: GeminiRequest = {
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

    const fullPrompt = `${systemInstruction}\n\nGame State: ${JSON.stringify(requestPayload)}\n\nSekarang, hasilkan respons JSON berdasarkan perintah pemain.`;

    try {
        // 2. Buat permintaan HTTP ke server Ollama.
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

        // 3. Parse respons JSON dari Ollama.
        const jsonResponseString = ollamaResult.response;
        if (!jsonResponseString) {
             throw new Error("Respons Ollama kosong atau tidak memiliki field 'response'.");
        }

        const geminiResponse: GeminiResponse = JSON.parse(jsonResponseString);

        // 4. Kembalikan respons yang telah dipetakan.
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
                            type: { type: Type.STRING, enum: Object.values(ItemType) },
                            count: { type: Type.NUMBER },
                            slot: { type: Type.STRING, enum: Object.values(EquipmentSlot) },
                            stats: {
                                type: Type.OBJECT,
                                properties: {
                                    atk: { type: Type.NUMBER },
                                    def: { type: Type.NUMBER }
                                }
                            }
                        },
                        required: ["id", "name", "type"]
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
                                    count: { type: Type.NUMBER },
                                    equipped: { type: Type.BOOLEAN },
                                    slot: { type: Type.STRING, enum: Object.values(EquipmentSlot) },
                                    stats: {
                                        type: Type.OBJECT,
                                        properties: {
                                            atk: { type: Type.NUMBER },
                                            def: { type: Type.NUMBER }
                                        }
                                    }
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
        }
    },
    required: ["narration"]
};


async function getGeminiUpdate(gameState: GameState, playerCommand: string): Promise<GeminiResponse> {
    const { player, world, history, quests, questOffer } = gameState;

    // Truncate history to keep the payload small and API response fast
    const recentHistory = history.slice(-MAX_HISTORY_TURNS);
    const { x, y } = world.location.coords;

    const requestPayload: GeminiRequest = {
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
        default:
            return Promise.resolve({
                narration: "Error: Tidak ada layanan AI yang dipilih atau layanan tidak valid."
            });
    }
}
