import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

// To authenticate with the model you will need to generate a personal access token (PAT) in your GitHub settings. 
// Create your PAT token by following instructions here: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
const token = process.env["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"];

export async function main(prompt) {
  const client = ModelClient(
    "https://models.github.ai/inference",
    new AzureKeyCredential(token)
  );

  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { role: "user", content: prompt }
      ],
      model: "deepseek/DeepSeek-R1",
      max_tokens: 2048,
    }
  });

  if (isUnexpected(response)) {
    throw response.body.error;
  }

  return response.body.choices[0].message.content;
}
