#!/usr/bin/env bun
import { secrets } from "bun";

const [cmd, name, value] = process.argv.slice(2);

switch (cmd) {
  case "set": {
    await secrets.set({ service: "hebo", name, value });
    console.log(`✅ set ${name}`);
    break;
  }
  case "get": {
    const secret = await secrets.get({ service: "hebo", name });
    console.log(secret ?? "");
    break;
  }
  case "delete": {
    await secrets.delete({ service: "hebo", name });
    console.log(`🗑 deleted ${name}`);
    break;
  }
  default: {
    console.log("Usage: bun secret <set|get|delete> <name> [value]");
  }
}
