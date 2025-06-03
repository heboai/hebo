import { stackServerApp } from "@/stack";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const user = await stackServerApp.getUser({ or: "throw" });
    
    const keys = await user.listApiKeys();
    const validKeys = keys.filter(key => key.isValid());

    // If there are valid keys, return the most recent one
    if (validKeys.length > 0) {
      const key = validKeys[0];
      return NextResponse.json({
        key: {
          id: key.id,
          value: null, // Don't send the value for existing keys
          displayValue: 'sk_' + '*'.repeat(9) + key.value.lastFour
        },
        hasExistingKey: true
      });
    }

    // Create a new key if none exist
    const newKey = await user.createApiKey({
      description: "defaultKey",
      expiresAt: null,
    });

    // For new keys, we can return the full value since it's a UserApiKeyFirstView
    return NextResponse.json({
      key: {
        id: newKey.id,
        value: newKey.value, // This is the full key value, only available in UserApiKeyFirstView
        displayValue: newKey.value.slice(0, 15) + '...'
      },
      hasExistingKey: false
    });
  } catch (error) {
    // Handle authentication error specifically
    if (error instanceof Error && error.message.includes("not signed in")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    console.error("Error managing API key:", error);
    return NextResponse.json(
      { error: "Failed to manage API key" },
      { status: 500 }
    );
  }
} 