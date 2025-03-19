import { z } from "zod";
import { server } from "./init.js";

// Ask question prompt
server.prompt(
  "ask-question",
  "Prepares a question to be answered",
  { question: z.string().describe("The question to be answered") },
  ({ question }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please answer this question: ${question}`,
        },
      },
    ],
  })
);
