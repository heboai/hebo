#!/usr/bin/env bun
import { secrets } from "bun";

const [cmd, service, name, value] = process.argv.slice(2);

switch (cmd) {
  case "set": {
    await secrets.set({ service, name, value });
    console.log(`✅ set ${service}:${name}`);
    break;
  }
  case "get": {
    console.log((await secrets.get({ service, name })) ?? "");
    break;
  }
  case "delete": {
    await secrets.delete({ service, name });
    console.log(`🗑 deleted ${service}:${name}`);
    break;
  }
  default: {
    console.log("Usage: bun secrets <set|get|delete> <service> <name> [value]");
  }
}
