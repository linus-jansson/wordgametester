
export type ResponseData = {letters: number[]} | { error: string };
export type DebugOptions = { 
    API_BASE_URL: string,
    MAGIC_NUMBER: number
} & ({"debug": true, "correct_word": string} | {"debug"?: false});
