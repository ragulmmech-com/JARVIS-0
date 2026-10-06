import { Message } from "../types";

export const generateChatTranscript = (messages: Message[], title: string = "J.A.R.V.I.S. Chat Transcript"): string => {
  let transcript = `=============================================\n`;
  transcript += `   ${title.toUpperCase()} \n`;
  transcript += `   Date: ${new Date().toLocaleString()}\n`;
  transcript += `=============================================\n\n`;

  messages.forEach(msg => {
    const role = msg.role.toUpperCase();
    const time = new Date(msg.timestamp).toLocaleTimeString();
    
    transcript += `[${time}] ${role}:\n`;
    if (msg.text) transcript += `${msg.text}\n`;
    if (msg.image || msg.mediaName) transcript += `[Attached Media: ${msg.mediaName || "Image"}]\n`;
    if (msg.toolCall) transcript += `[Tool Execution: ${msg.toolCall.name}]\n`;
    
    transcript += `---------------------------------------------\n\n`;
  });

  return transcript;
};
